import { readFile } from "node:fs/promises";
import path from "node:path";

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

export async function readManifest() {
  const filePath = path.join(process.cwd(), "content", "manifest.json");
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function readHandbook() {
  const manifest = await readManifest();
  const filePath = path.join(process.cwd(), "content", manifest.handbookFile);
  return readFile(filePath, "utf8");
}

export function filterHandbookForPlayers(markdown, manifest) {
  const gmSections = new Set(manifest.gmLockedSections ?? []);
  const gmPatterns = (manifest.gmLockedTitlePatterns ?? []).map((pattern) => pattern.toLowerCase());
  const visibility = manifest.entryVisibility ?? {};
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let currentSection = "";
  let keepingEntry = true;
  let sectionHasVisibleEntries = false;
  let pendingSectionLines = [];

  function flushSection() {
    if (sectionHasVisibleEntries) output.push(...pendingSectionLines);
    pendingSectionLines = [];
    sectionHasVisibleEntries = false;
  }

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)/);
    const entryMatch = line.match(/^###\s+(.+)/);

    if (sectionMatch && !entryMatch) {
      flushSection();
      currentSection = sectionMatch[1].trim();
      keepingEntry = !gmSections.has(currentSection);
      pendingSectionLines = [line];
      continue;
    }

    if (entryMatch) {
      const rawTitle = entryMatch[1].trim();
      const title = displayTitle(rawTitle);
      const id = extractEntryId(rawTitle);
      const slug = slugify(`${friendlySection(currentSection)}-${title}`);
      const entryVisibility = visibility[id] ?? visibility[slug] ?? "public";
      keepingEntry =
        entryVisibility === "public" &&
        !gmSections.has(currentSection) &&
        !gmPatterns.some((pattern) => title.toLowerCase().includes(pattern));
      if (keepingEntry) {
        if (!sectionHasVisibleEntries) {
          output.push(...pendingSectionLines);
          pendingSectionLines = [];
          sectionHasVisibleEntries = true;
        }
        output.push(line);
      }
      continue;
    }

    if (keepingEntry && sectionHasVisibleEntries) output.push(line);
  }

  flushSection();
  return output.join("\n").trim() + "\n";
}

function displayTitle(title) {
  return title
    .replace(/^[A-Z]+-[A-Z0-9]+\s+[-—]\s+/, "")
    .replace(/\s+\[(Locked|Under Review|DEV|Archived Non-Canon|Future)[^\]]*\]/gi, "")
    .trim();
}

function extractEntryId(title) {
  return title.match(/^([A-Z]+-\d+|[A-Z]+-[A-Z0-9]+)/)?.[1] ?? "";
}

function friendlySection(section) {
  return FRIENDLY_SECTIONS[section] ?? section;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
