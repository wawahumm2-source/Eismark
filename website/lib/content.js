import { readFile } from "node:fs/promises";
import path from "node:path";

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
      const title = displayTitle(entryMatch[1]).toLowerCase();
      keepingEntry = !gmSections.has(currentSection) && !gmPatterns.some((pattern) => title.includes(pattern));
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
