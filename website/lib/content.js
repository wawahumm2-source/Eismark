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
  const manifest = JSON.parse(await readFile(filePath, "utf8"));
  const archiveFile = manifest.documents?.find((document) => document.id === "ecd-archive")?.file;

  if (!archiveFile) return manifest;

  try {
    const archive = await readFile(path.join(process.cwd(), "content", archiveFile), "utf8");
    return { ...manifest, entryStatuses: archiveEntryStatuses(archive) };
  } catch {
    return manifest;
  }
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
  const statusById = entryStatuses(markdown);
  for (const [id, status] of Object.entries(manifest.entryStatuses ?? {})) {
    statusById.set(id, status);
  }
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
      const configuredVisibility = visibility[id] ?? visibility[slug];
      const defaultVisibility = statusById.get(id) === "Under Review" ? "draft" : "public";
      const entryVisibility = configuredVisibility ?? defaultVisibility;
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

function archiveEntryStatuses(markdown) {
  const statuses = {};
  const lines = markdown.split(/\r?\n/);
  let currentId = "";

  for (const line of lines) {
    const entryMatch = line.match(/^###\s+([A-Z]+-\d{3})\s+-\s+/);
    if (entryMatch) {
      currentId = entryMatch[1];
      continue;
    }
    const statusMatch = line.match(/^Canon Status:\s*(.+)$/i);
    if (currentId && statusMatch) statuses[currentId] = statusMatch[1].trim();
  }
  return statuses;
}

function entryStatuses(markdown) {
  const statuses = new Map();
  const lines = markdown.split(/\r?\n/);
  let currentId = "";

  for (const line of lines) {
    const entryMatch = line.match(/^###\s+(.+)/);
    if (entryMatch) {
      currentId = extractEntryId(entryMatch[1].trim());
      continue;
    }
    const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+)$/i);
    if (currentId && statusMatch) statuses.set(currentId, statusMatch[1].trim());
  }
  return statuses;
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
