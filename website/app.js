const SAVED_PAGES_KEY = "eismark-saved-pages";
const VISIT_HISTORY_KEY = "eismark-visit-history";
const SAVED_LIST_LIMIT = 5;
const SEARCH_SUGGESTION_LIMIT = 7;

const FRIENDLY_SECTIONS = {
  "Peoples and Species": "Peoples",
  "Military and Machines": "Military",
  "Monsters and Corruption": "Monsters",
  "Important Figures": "Figures",
  "Campaign Premise": "Campaign",
  "Archive Notes": "GM Archive",
  "Recovery Reports": "GM Reports",
  "Development Notes": "Development",
  "Images": "Reference Images",
};

const state = {
  manifest: null,
  entries: [],
  activeSection: "History",
  query: "",
  savedPages: loadSavedPages(),
  visitHistory: loadVisitHistory(),
  visitIndex: 0,
  suppressHistoryRecord: false,
  gmUnlocked: false,
};

const els = {
  modeLabel: document.querySelector("#modeLabel"),
  gmButton: document.querySelector("#gmButton"),
  gmDialog: document.querySelector("#gmDialog"),
  gmPassword: document.querySelector("#gmPassword"),
  gmError: document.querySelector("#gmError"),
  unlockButton: document.querySelector("#unlockButton"),
  historyBack: document.querySelector("#historyBack"),
  historyForward: document.querySelector("#historyForward"),
  searchForm: document.querySelector("#searchForm"),
  searchSuggestions: document.querySelector("#searchSuggestions"),
  savedList: document.querySelector("#savedList"),
  savedSelect: document.querySelector("#savedSelect"),
  chapterList: document.querySelector("#chapterList"),
  searchInput: document.querySelector("#searchInput"),
  activeDoc: document.querySelector("#activeDoc"),
  activeTitle: document.querySelector("#activeTitle"),
  resultCount: document.querySelector("#resultCount"),
  toolbar: document.querySelector("#toolbar"),
  homePage: document.querySelector("#homePage"),
  entryGrid: document.querySelector("#entryGrid"),
  entryDetail: document.querySelector("#entryDetail"),
};

async function init() {
  await refreshContent();
  state.visitIndex = Math.max(0, state.visitHistory.length - 1);

  bindEvents();
  applyRoute();
  recordVisit(location.hash || "#/home");
  render();
}

async function refreshContent() {
  const manifestResponse = await fetch("/api/manifest", { cache: "no-store" });
  state.manifest = await manifestResponse.json();
  state.gmUnlocked = Boolean(state.manifest.gm);

  const handbookResponse = await fetch("/api/handbook", { cache: "no-store" });
  const markdown = await handbookResponse.text();
  state.entries = parseEntries(markdown);
}

function parseEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];
  let section = "Overview";
  let current = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)/);
    const entryMatch = line.match(/^###\s+(.+)/);

    if (sectionMatch && !entryMatch) {
      section = sectionMatch[1].trim();
      continue;
    }

    if (entryMatch) {
      if (current) entries.push(finalizeEntry(current));
      const rawTitle = entryMatch[1].trim();
      current = {
        rawTitle,
        title: displayTitle(rawTitle),
        id: extractEntryId(rawTitle),
        section,
        sectionTitle: friendlySection(section),
        gmOnly: isGmOnly(section, rawTitle),
        body: [],
      };
      continue;
    }

    if (current) current.body.push(line);
  }

  if (current) entries.push(finalizeEntry(current));
  return entries;
}

function finalizeEntry(entry) {
  const body = entry.body.join("\n").trim();
  const slug = slugify(`${entry.sectionTitle}-${entry.title}`);
  return {
    ...entry,
    body,
    slug,
    excerpt: makeExcerpt(cleanReaderBody(body)),
    bodyText: cleanReaderBody(body).toLowerCase(),
    searchText: `${entry.title}\n${entry.sectionTitle}\n${cleanReaderBody(body)}`.toLowerCase(),
  };
}

function extractEntryId(title) {
  return title.match(/^([A-Z]+-\d+|[A-Z]+-[A-Z0-9]+)/)?.[1] ?? "";
}

function displayTitle(title) {
  return title
    .replace(/^[A-Z]+-[A-Z0-9]+\s+[—-]\s+/, "")
    .replace(/\s+\[(Locked|Under Review|DEV|Archived Non-Canon|Future)[^\]]*\]/gi, "")
    .trim();
}

function friendlySection(section) {
  return FRIENDLY_SECTIONS[section] ?? section;
}

function isGmSection(section) {
  return state.manifest?.gmLockedSections?.includes(section) ?? false;
}

function isGmTitle(title) {
  const patterns = state.manifest?.gmLockedTitlePatterns ?? [];
  return patterns.some((pattern) => title.toLowerCase().includes(pattern.toLowerCase()));
}

function isGmOnly(section, title) {
  return isGmSection(section) || isGmTitle(displayTitle(title));
}

function visibleEntries() {
  return state.entries.filter((entry) => state.gmUnlocked || !entry.gmOnly);
}

function searchEntries(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return visibleEntries();

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return visibleEntries()
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuery, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map((result) => result.entry);
}

function scoreEntry(entry, query, terms) {
  const title = entry.title.toLowerCase();
  const section = entry.sectionTitle.toLowerCase();
  const body = entry.bodyText;
  let score = 0;

  if (title === query) score += 160;
  if (title.startsWith(query)) score += 110;
  if (title.includes(query)) score += 80;
  if (entry.id.toLowerCase() === query) score += 140;
  if (entry.id.toLowerCase().startsWith(query)) score += 70;
  if (section.includes(query)) score += 35;
  if (body.includes(query)) score += 16;

  for (const term of terms) {
    if (title.includes(term)) score += 24;
    if (section.includes(term)) score += 10;
    if (body.includes(term)) score += 4;
  }

  return score;
}

function availableSections() {
  return [...new Set(visibleEntries().map((entry) => entry.section))];
}

function makeExcerpt(body) {
  const clean = body
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#*_`>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(0, 210) + (clean.length > 210 ? "..." : "");
}

function bindEvents() {
  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = els.searchInput.value.trim().toLowerCase();
    hideSearchSuggestions();
    location.hash = state.query ? "#/search" : "#/home";
    render();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderSearchSuggestions();
  });

  els.searchInput.addEventListener("focus", renderSearchSuggestions);

  document.addEventListener("click", (event) => {
    if (!els.searchForm.contains(event.target)) hideSearchSuggestions();
  });

  els.historyBack.addEventListener("click", () => moveVisitHistory(-1));
  els.historyForward.addEventListener("click", () => moveVisitHistory(1));

  els.savedSelect.addEventListener("change", (event) => {
    if (event.target.value) location.hash = event.target.value;
  });

  els.gmButton.addEventListener("click", () => {
    if (state.gmUnlocked) {
      lockGmMode();
      return;
    }
    els.gmPassword.value = "";
    els.gmError.textContent = "";
    els.gmDialog.showModal();
  });

  els.unlockButton.addEventListener("click", unlockGmMode);
  els.gmPassword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      unlockGmMode();
    }
  });

  window.addEventListener("hashchange", () => {
    applyRoute();
    recordVisit(location.hash || "#/home");
    render();
  });
}

async function unlockGmMode() {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: els.gmPassword.value }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    els.gmError.textContent = result.message || "Password did not match.";
    return;
  }

  els.gmDialog.close();
  await refreshContent();
  applyRoute();
  render();
}

async function lockGmMode() {
  await fetch("/api/logout", { method: "POST" });
  await refreshContent();
  if (isGmSection(state.activeSection)) state.activeSection = availableSections()[0] ?? "History";
  location.hash = `#/chapter/${slugify(state.activeSection)}`;
  applyRoute();
  render();
}

function applyRoute() {
  const hash = location.hash || "";
  const [, routeType, routeValue] = hash.match(/^#\/([^/]+)\/?(.+)?$/) ?? [];
  const sections = availableSections();

  if (!hash) {
    location.hash = "#/home";
    return;
  }

  if (routeType === "entry" && routeValue) {
    const entry = visibleEntries().find((item) => item.slug === routeValue);
    if (entry) {
      state.activeSection = entry.section;
      return;
    }
  }

  if (routeType === "chapter" && routeValue) {
    const section = sections.find((item) => slugify(item) === routeValue);
    if (section) {
      state.activeSection = section;
      return;
    }
  }

  if (routeType === "home" || routeType === "search") {
    return;
  }

  if (!sections.includes(state.activeSection)) {
    state.activeSection = sections[0] ?? "History";
  }
}

function currentEntryFromRoute() {
  const [, routeValue] = (location.hash || "").match(/^#\/entry\/(.+)$/) ?? [];
  if (!routeValue) return null;
  return visibleEntries().find((entry) => entry.slug === routeValue) ?? null;
}

function render() {
  els.modeLabel.textContent = state.gmUnlocked ? "GM View" : "Player View";
  els.gmButton.textContent = state.gmUnlocked ? "Lock GM" : "Unlock GM";
  renderVisitButtons();
  renderSavedPages();
  renderChapterList();

  const entry = currentEntryFromRoute();
  if (location.hash === "#/home" || !location.hash) {
    renderHome();
  } else if (location.hash === "#/search") {
    renderSearchResults();
  } else if (entry) {
    showEntry(entry);
  } else {
    renderChapter();
  }
}

function renderVisitButtons() {
  els.historyBack.disabled = state.visitIndex <= 0;
  els.historyForward.disabled = state.visitIndex >= state.visitHistory.length - 1;
}

function recordVisit(hash) {
  if (state.suppressHistoryRecord) {
    state.suppressHistoryRecord = false;
    return;
  }

  const normalized = hash || "#/home";
  if (state.visitHistory[state.visitIndex] === normalized) return;

  state.visitHistory = state.visitHistory.slice(0, state.visitIndex + 1);
  state.visitHistory.push(normalized);
  state.visitHistory = state.visitHistory.slice(-50);
  state.visitIndex = state.visitHistory.length - 1;
  saveVisitHistory();
}

function moveVisitHistory(direction) {
  const nextIndex = state.visitIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.visitHistory.length) return;
  state.visitIndex = nextIndex;
  state.suppressHistoryRecord = true;
  saveVisitHistory();
  location.hash = state.visitHistory[state.visitIndex];
  renderVisitButtons();
}

function renderSavedPages() {
  const visibleSaved = state.savedPages
    .map((slug) => visibleEntries().find((entry) => entry.slug === slug))
    .filter(Boolean);

  els.savedList.innerHTML = "";
  els.savedSelect.innerHTML = "";

  if (!visibleSaved.length) {
    els.savedList.innerHTML = `<p class="empty-note">No saved pages yet.</p>`;
    els.savedList.classList.remove("hidden");
    els.savedSelect.classList.add("hidden");
    return;
  }

  if (visibleSaved.length > SAVED_LIST_LIMIT) {
    const placeholder = document.createElement("option");
    placeholder.textContent = `${visibleSaved.length} saved pages`;
    placeholder.value = "";
    els.savedSelect.appendChild(placeholder);
    for (const entry of visibleSaved) {
      const option = document.createElement("option");
      option.value = `#/entry/${entry.slug}`;
      option.textContent = entry.title;
      els.savedSelect.appendChild(option);
    }
    els.savedList.classList.add("hidden");
    els.savedSelect.classList.remove("hidden");
    return;
  }

  for (const entry of visibleSaved) {
    const link = document.createElement("a");
    link.className = "nav-button";
    link.href = `#/entry/${entry.slug}`;
    link.textContent = entry.title;
    els.savedList.appendChild(link);
  }
  els.savedList.classList.remove("hidden");
  els.savedSelect.classList.add("hidden");
}

function renderChapterList() {
  const sections = availableSections();
  els.chapterList.innerHTML = "";
  for (const section of sections) {
    const link = document.createElement("a");
    link.className = `nav-button ${section === state.activeSection && !currentEntryFromRoute() ? "active" : ""}`;
    link.href = `#/chapter/${slugify(section)}`;
    link.textContent = friendlySection(section);
    els.chapterList.appendChild(link);
  }
}

function renderHome() {
  els.toolbar.classList.remove("hidden");
  els.entryGrid.classList.add("hidden");
  els.entryDetail.classList.add("hidden");
  els.homePage.classList.remove("hidden");
  els.activeDoc.textContent = "Main Page";
  els.activeTitle.textContent = "Eismark";
  els.resultCount.textContent = `${visibleEntries().length} public entries`;

  const sectionCards = availableSections()
    .filter((section) => !isGmSection(section))
    .map((section) => {
      const entries = visibleEntries().filter((entry) => entry.section === section);
      return `
        <a class="portal-card" href="#/chapter/${slugify(section)}">
          <h3>${escapeHtml(friendlySection(section))}</h3>
          <p>${entries.length} entries</p>
        </a>
      `;
    })
    .join("");

  const featured = findEntryByTitle("The Sacrament of Kaltheim") ?? visibleEntries()[0];
  const secondary = findEntryByTitle("The Commonwealth of Veloria") ?? visibleEntries()[1];

  els.homePage.innerHTML = `
    <section class="wiki-intro">
      <h3>The Eismark Campaign Setting</h3>
      <p>Eismark is a dieselpunk fantasy world of broken memory, sacred machines, rival republics, ancient wounds, and nations trying to define what humanity owes to the past and to the future.</p>
      <p>The handbook organizes public lore for play: history, peoples, nations, faith, technology, monsters, geography, and military culture. GM-only material remains hidden unless unlocked.</p>
    </section>

    <div class="home-grid">
      <section class="wiki-box featured-box">
        <h3>Featured Article</h3>
        ${featured ? articleTeaser(featured) : ""}
      </section>
      <section class="wiki-box">
        <h3>Another Starting Point</h3>
        ${secondary ? articleTeaser(secondary) : ""}
      </section>
    </div>

    <section class="wiki-box">
      <h3>Explore the Handbook</h3>
      <div class="portal-grid">${sectionCards}</div>
    </section>

    <section class="wiki-box">
      <h3>Using This Site</h3>
      <ul>
        <li>Use the search bar for people, nations, places, events, and themes.</li>
        <li>Use the chapter navigation to browse by topic.</li>
        <li>Each article has its own page link.</li>
        <li>GM mode reveals restricted notes, reports, reference images, and selected spoiler-heavy articles.</li>
      </ul>
    </section>
  `;
}

function renderSearchResults() {
  els.toolbar.classList.remove("hidden");
  els.homePage.classList.add("hidden");
  els.entryDetail.classList.add("hidden");
  els.entryGrid.classList.remove("hidden");
  els.activeDoc.textContent = "Search";
  els.activeTitle.textContent = state.query ? `Search: ${state.query}` : "Search";

  const entries = searchEntries(state.query);
  els.resultCount.textContent = `${entries.length} results`;
  renderEntryCards(entries);
}

function renderSearchSuggestions() {
  const query = els.searchInput.value.trim().toLowerCase();
  if (!query) {
    hideSearchSuggestions();
    return;
  }

  const suggestions = searchEntries(query).slice(0, SEARCH_SUGGESTION_LIMIT);
  if (!suggestions.length) {
    els.searchSuggestions.innerHTML = `<p class="suggestion-empty">No matching articles</p>`;
    els.searchSuggestions.classList.remove("hidden");
    return;
  }

  els.searchSuggestions.innerHTML = suggestions
    .map((entry) => `
      <a class="search-suggestion" href="#/entry/${entry.slug}">
        <span>${escapeHtml(entry.title)}</span>
        <small>${escapeHtml(entry.sectionTitle)}</small>
      </a>
    `)
    .join("");
  els.searchSuggestions.classList.remove("hidden");
}

function hideSearchSuggestions() {
  els.searchSuggestions.classList.add("hidden");
  els.searchSuggestions.innerHTML = "";
}

function articleTeaser(entry) {
  return `
    <a class="article-teaser" href="#/entry/${entry.slug}">
      <strong>${escapeHtml(entry.title)}</strong>
      <span>${escapeHtml(entry.excerpt)}</span>
      <em>read more</em>
    </a>
  `;
}

function findEntryByTitle(title) {
  return visibleEntries().find((entry) => entry.title.toLowerCase() === title.toLowerCase());
}

function entriesForActiveSection() {
  return visibleEntries().filter((entry) => {
    const sectionMatches = entry.section === state.activeSection;
    const queryMatches = !state.query || entry.searchText.includes(state.query);
    return sectionMatches && queryMatches;
  });
}

function renderChapter() {
  const entries = entriesForActiveSection();
  els.toolbar.classList.remove("hidden");
  els.homePage.classList.add("hidden");
  els.entryDetail.classList.add("hidden");
  els.entryGrid.classList.remove("hidden");
  els.activeDoc.textContent = state.gmUnlocked && isGmSection(state.activeSection) ? "GM Notes" : "Handbook";
  els.activeTitle.textContent = friendlySection(state.activeSection);
  els.resultCount.textContent = `${entries.length} entries`;
  renderEntryCards(entries);
}

function renderEntryCards(entries) {
  els.entryGrid.innerHTML = "";
  for (const entry of entries) {
    const card = document.createElement("a");
    card.href = `#/entry/${entry.slug}`;
    card.className = "entry-card";
    card.innerHTML = `
      <span class="chapter-kicker">${escapeHtml(entry.sectionTitle)}</span>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.excerpt)}</p>
    `;
    els.entryGrid.appendChild(card);
  }
}

function showEntry(entry) {
  const sectionEntries = visibleEntries().filter((item) => item.section === entry.section);
  const entryIndex = sectionEntries.findIndex((item) => item.slug === entry.slug);
  const previousEntry = sectionEntries[entryIndex - 1] ?? null;
  const nextEntry = sectionEntries[entryIndex + 1] ?? null;

  els.toolbar.classList.add("hidden");
  els.homePage.classList.add("hidden");
  els.entryGrid.classList.add("hidden");
  els.entryDetail.classList.remove("hidden");
  els.activeDoc.textContent = entry.gmOnly ? "GM Notes" : "Handbook";
  els.activeTitle.textContent = entry.title;
  els.resultCount.textContent = friendlySection(entry.section);
  const readerBody = cleanReaderBody(entry.body);
  const keyPoints = extractKeyPoints(readerBody);
  const keyPointsHtml = keyPoints.length
    ? `
      <aside class="key-points-panel" aria-label="Key points">
        <h3>Key Points</h3>
        <ul>${keyPoints.map((point) => `<li>${inlineMarkdown(point)}</li>`).join("")}</ul>
      </aside>
    `
    : "";
  els.entryDetail.innerHTML = `
    <nav class="article-nav" aria-label="Article navigation">
      <a class="back-button" href="#/chapter/${slugify(entry.section)}">Back to ${escapeHtml(friendlySection(entry.section))}</a>
      <div class="arrow-nav">
        ${previousEntry ? `<a class="arrow-button" href="#/entry/${previousEntry.slug}" title="${escapeHtml(previousEntry.title)}">←</a>` : `<span class="arrow-button disabled">←</span>`}
        ${nextEntry ? `<a class="arrow-button" href="#/entry/${nextEntry.slug}" title="${escapeHtml(nextEntry.title)}">→</a>` : `<span class="arrow-button disabled">→</span>`}
      </div>
      <button class="save-button ${isSaved(entry.slug) ? "saved" : ""}" type="button" id="savePageButton">${isSaved(entry.slug) ? "Saved" : "Save Page"}</button>
    </nav>

    <header class="article-header">
      <div>
        <p class="chapter-kicker">${escapeHtml(friendlySection(entry.section))}</p>
        <h2>${escapeHtml(entry.title)}</h2>
      </div>
      <figure class="image-slot">
        <div>Illustration Space</div>
        <figcaption>Future art, map, portrait, or symbol</figcaption>
      </figure>
    </header>

    <div class="entry-body-layout ${keyPoints.length ? "has-key-points" : ""}">
      <section class="lore-panel">
        <h3>Lore</h3>
        <div class="entry-columns">${markdownToHtml(readerBody)}</div>
      </section>
      ${keyPointsHtml}
    </div>
  `;
  document.querySelector("#savePageButton").addEventListener("click", () => {
    toggleSavedPage(entry.slug);
    showEntry(entry);
    renderSavedPages();
  });
}

function cleanReaderBody(markdown) {
  return markdown
    .split(/\n/)
    .filter((line) => !/^\s*(Canon Status|Source|Record Note|Image Role|Image File):/i.test(line))
    .filter((line) => !/^\s*\*\*Status:\*\*/i.test(line))
    .filter((line) => !/^\s*\*\*Lore\*\*/i.test(line))
    .filter((line) => !/^\s*\*\*See Also:\*\*/i.test(line))
    .filter((line) => !/^\s*Related Entries:/i.test(line))
    .join("\n")
    .replace(/\b[A-Z]{2,5}-\d+\s+[—-]\s+/g, "")
    .trim();
}

function extractKeyPoints(markdown) {
  const bullets = markdown
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && line.length <= 180)
    .slice(0, 6);

  if (bullets.length) return bullets;

  return markdown
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.endsWith(":") && !line.startsWith("!"))
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((line) => line.trim())
    .filter((line) => line.length >= 28 && line.length <= 180)
    .slice(0, 4);
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\n/);
  let html = "";
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (image) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<figure><img src="${escapeHtml(resolveAssetPath(image[2]))}" alt="${escapeHtml(image[1])}"></figure>`;
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${inlineMarkdown(displayTitle(line.slice(4)))}</h3>`;
      continue;
    }

    if (line.endsWith(":") && line.length < 90) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${inlineMarkdown(line.slice(0, -1))}</h3>`;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inlineMarkdown(line.slice(2))}</li>`;
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }
    html += `<p>${inlineMarkdown(line)}</p>`;
  }

  if (inList) html += "</ul>";
  return html;
}

function resolveAssetPath(src) {
  if (src.includes("cb1f182c-db85-488f-8288-b2a406e5443f.png")) {
    return "assets/uriel-joivian-form.png";
  }
  return src;
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadSavedPages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_PAGES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadVisitHistory() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(VISIT_HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveVisitHistory() {
  sessionStorage.setItem(VISIT_HISTORY_KEY, JSON.stringify(state.visitHistory));
}

function saveSavedPages() {
  localStorage.setItem(SAVED_PAGES_KEY, JSON.stringify(state.savedPages));
}

function isSaved(slug) {
  return state.savedPages.includes(slug);
}

function toggleSavedPage(slug) {
  if (isSaved(slug)) {
    state.savedPages = state.savedPages.filter((item) => item !== slug);
  } else {
    state.savedPages = [slug, ...state.savedPages];
  }
  saveSavedPages();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init().catch((error) => {
  console.error(error);
  els.entryGrid.innerHTML = `<p>Failed to load handbook content. Serve the website over a local web server so markdown files can be fetched.</p>`;
});
