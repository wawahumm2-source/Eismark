import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const websiteRoot = path.resolve(process.cwd());
const repositoryRoot =
  path.basename(websiteRoot).toLowerCase() === "website"
    ? path.dirname(websiteRoot)
    : websiteRoot;
const outputsRoot = path.join(repositoryRoot, "outputs");
const archivePath = path.join(outputsRoot, "Eismark_ECD_Archive_v0.1.md");
const guidePath = path.join(outputsRoot, "Eismark_Readable_Guide_v0.1.md");
const indexPath = path.join(outputsRoot, "ECD_Master_Index_v0.1.md");
const gapAuditPath = path.join(
  outputsRoot,
  "Eismark_Lore_And_Reference_Image_Gap_Audit_v0.1.md",
);

const [archive, guide, index] = await Promise.all([
  readFile(archivePath, "utf8"),
  readFile(guidePath, "utf8"),
  readFile(indexPath, "utf8"),
]);

const entries = parseEntries(archive);
const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
const indexEntries = parseIndex(index);
const indexById = new Map(indexEntries.map((entry) => [entry.id, entry]));
const guideIds = matchAll(guide, /^### ([A-Z]+-\d{3})\s+/gm, 1);

const duplicateArchiveIds = duplicates(entries.map((entry) => entry.id));
const duplicateIndexIds = duplicates(indexEntries.map((entry) => entry.id));
const archiveNotIndexed = difference(entriesById.keys(), indexById.keys());
const indexedWithoutBody = difference(indexById.keys(), entriesById.keys()).filter(
  (id) => !/^(CAP|DEV|EVO)-/.test(id),
);
const statusMismatches = entries
  .filter((entry) => indexById.has(entry.id))
  .filter((entry) => entry.status !== indexById.get(entry.id).status)
  .map(
    (entry) =>
      entry.id +
      ": archive [" +
      entry.status +
      "] vs index [" +
      indexById.get(entry.id).status +
      "]",
  );
const relatedIssues = findRelatedIssues(entries, entriesById, indexById);
const publicMissingFromGuide = entries
  .filter((entry) => ["Locked", "Under Review"].includes(entry.status))
  .filter((entry) => !/^(ARC|ARP|DEV|EVO|CAP|IMG)-/.test(entry.id))
  .filter((entry) => !guideIds.includes(entry.id))
  .map((entry) => entry.id);
const guideOrphans = [...new Set(guideIds)].filter((id) => !entriesById.has(id));
const imageIssues = await findImageIssues(archive, guide);

const thinEntries = entries
  .filter((entry) => entry.words < 150)
  .sort((a, b) => a.words - b.words || a.id.localeCompare(b.id));
const nonImageEntries = entries.filter((entry) => !entry.id.startsWith("IMG-"));
const missingReferenceImages = nonImageEntries.filter(
  (entry) => !/\bIMG-\d{3}\b|\/assets\/|!\[[^\]]*\]\([^)]+\)/.test(entry.body),
);
const thinAndMissingArt = thinEntries.filter((entry) =>
  missingReferenceImages.some((candidate) => candidate.id === entry.id),
);

const errors = [
  ...duplicateArchiveIds.map((id) => "Duplicate archive ID: " + id),
  ...duplicateIndexIds.map((id) => "Duplicate index ID: " + id),
  ...archiveNotIndexed.map((id) => "Archive entry missing from index: " + id),
  ...indexedWithoutBody.map((id) => "Indexed canon entry has no archive body: " + id),
  ...statusMismatches,
  ...relatedIssues,
  ...publicMissingFromGuide.map((id) => "Public canon missing from guide: " + id),
  ...guideOrphans.map((id) => "Guide entry has no archive body: " + id),
  ...imageIssues,
];

const report = renderGapAudit({
  entries,
  thinEntries,
  missingReferenceImages,
  thinAndMissingArt,
});

if (process.argv.includes("--write")) {
  await writeFile(gapAuditPath, report, "utf8");
}

const summary = {
  entries: entries.length,
  guideEntries: new Set(guideIds).size,
  indexEntries: indexEntries.length,
  thinEntries: thinEntries.length,
  missingReferenceImages: missingReferenceImages.length,
  structuralErrors: errors.length,
  errors,
  wrote: process.argv.includes("--write") ? gapAuditPath : null,
};

console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exitCode = 1;

function parseEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const result = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^### ([A-Z]+-\d{3}) - (.+)$/);
    if (heading) {
      if (current) result.push(finalizeEntry(current));
      current = { id: heading[1], title: heading[2].trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) result.push(finalizeEntry(current));
  return result;
}

function finalizeEntry(entry) {
  const body = entry.lines.join("\n");
  const status = body.match(/^Canon Status:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const content = entry.lines
    .filter(
      (line) =>
        !/^(Canon Status|Category|Related Entries|Source|Image Role|Image File):/.test(
          line,
        ),
    )
    .filter(
      (line) =>
        !/^(Canon Facts|Working Canon|Consequences|Lore Notes|Visual Notes):?$/.test(
          line,
        ),
    )
    .join(" ");
  return {
    ...entry,
    body,
    status,
    words: content.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0,
  };
}

function parseIndex(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) =>
      line.match(
        /^- ([A-Z]+-\d{3})\s+—\s+(.+?)\s+\[(Locked|Under Review|DEV|Archived Non-Canon)\]$/,
      ),
    )
    .filter(Boolean)
    .map((match) => ({ id: match[1], title: match[2], status: match[3] }));
}

function findRelatedIssues(archiveEntries, archiveById, indexedById) {
  const issues = [];
  for (const entry of archiveEntries) {
    const related = entry.body.match(/^Related Entries:\s*(.+)$/m)?.[1];
    if (!related) continue;

    for (const part of related.split(";")) {
      const reference = part.match(
        /([A-Z]+-\d{3})(?:\s+—\s+.*?)?\s+\[(Locked|Under Review|DEV|Archived Non-Canon|Future)\]/,
      );
      if (!reference) continue;
      const [, id, declaredStatus] = reference;
      const target = archiveById.get(id) ?? indexedById.get(id);
      if (!target) {
        issues.push(entry.id + " has a broken related-entry reference to " + id);
      } else if (declaredStatus !== target.status) {
        issues.push(
          entry.id +
            " references " +
            id +
            " as [" +
            declaredStatus +
            "], actual [" +
            target.status +
            "]",
        );
      }
    }
  }
  return issues;
}

async function findImageIssues(...documents) {
  const references = new Set(
    documents.flatMap((document) =>
      matchAll(document, /(?:\x60)?(\/assets\/[a-zA-Z0-9._/-]+)(?:\x60|\))?/g, 1),
    ),
  );
  const issues = [];
  for (const reference of references) {
    const filePath = path.join(websiteRoot, reference.replace(/^\/assets\//, "assets/"));
    try {
      await access(filePath);
    } catch {
      issues.push("Missing deployed image asset: " + reference);
    }
  }
  return issues;
}

function renderGapAudit({
  entries: archiveEntries,
  thinEntries: thin,
  missingReferenceImages: missingArt,
  thinAndMissingArt: highestPriority,
}) {
  const lines = [
    "# Eismark Lore and Reference Image Gap Audit v0.1",
    "",
    "Source: " + code("outputs/Eismark_ECD_Archive_v0.1.md"),
    "",
    "Generated by " +
      code("website/scripts/audit-lore.mjs") +
      " to identify entries that need additional lore and entries that do not yet have explicit reference-image coverage.",
    "",
    "## Method",
    "",
    "- **Needs More Lore** means the ECD entry body is under 150 words after excluding administrative metadata.",
    "- **No Reference Image** means the entry is not an IMG entry and does not explicitly link to an IMG entry, deployed asset, or Markdown image.",
    "- This is a mechanical audit, not a canon judgment. Concise entries can be intentional, and new lore still requires evidence or canon approval.",
    "",
    "## Summary",
    "",
    "- Total ECD entries scanned: " + archiveEntries.length,
    "- Entries under 150 words: " + thin.length,
    "- Non-image entries without explicit reference images: " + missingArt.length,
    "- Entries that are both under 150 words and missing reference images: " +
      highestPriority.length,
    "",
    "## Highest-Priority Gaps",
    "",
    "These entries are both short and missing explicit reference-image coverage.",
    "",
    table(highestPriority),
    "",
    "## Entries Needing More Lore",
    "",
  ];

  for (const [prefix, group] of groupByPrefix(thin)) {
    lines.push("### " + prefix, "", table(group), "");
  }

  lines.push("## Entries Without Explicit Reference Images", "");
  for (const [prefix, group] of groupByPrefix(missingArt)) {
    lines.push("### " + prefix, "", table(group), "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

function table(rows) {
  const header = [
    "| ID | Title | Status | Words |",
    "|---|---|---:|---:|",
  ];
  return [
    ...header,
    ...rows.map(
      (entry) =>
        "| " +
        entry.id +
        " | " +
        entry.title.replaceAll("|", "\\|") +
        " | " +
        (entry.status || "N/A") +
        " | " +
        entry.words +
        " |",
    ),
  ].join("\n");
}

function groupByPrefix(rows) {
  const groups = new Map();
  for (const row of rows) {
    const prefix = row.id.split("-")[0];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function matchAll(value, expression, group) {
  return [...value.matchAll(expression)].map((match) => match[group]);
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value);
}

function difference(left, right) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((value) => !rightSet.has(value));
}

function code(value) {
  const tick = String.fromCharCode(96);
  return tick + value + tick;
}
