import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";
import { readManifest } from "../../../../lib/content";

const OUTPUT_READABLE = path.resolve(process.cwd(), "..", "outputs", "Eismark_Readable_Guide_v0.1.md");

export async function POST(request) {
  if (!isGmRequest(await cookies())) {
    return Response.json({ ok: false, message: "GM/Editor mode required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const nextBody = String(body.body ?? "").trim();
  const rawTitle = String(body.rawTitle ?? "").trim();
  const id = String(body.id ?? "").trim();

  if (!rawTitle || !nextBody) {
    return Response.json({ ok: false, message: "Entry title and body are required." }, { status: 400 });
  }

  const manifest = await readManifest();
  const handbookPath = path.resolve(process.cwd(), "content", manifest.handbookFile);
  const written = [];

  for (const filePath of [handbookPath, OUTPUT_READABLE]) {
    try {
      const current = await readFile(filePath, "utf8");
      const updated = replaceEntryBody(current, { rawTitle, id, body: nextBody });
      await writeFile(filePath, updated, "utf8");
      written.push(filePath);
    } catch (error) {
      return Response.json(
        { ok: false, message: `Could not save ${path.basename(filePath)}: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return Response.json({ ok: true, written });
}

function replaceEntryBody(markdown, entry) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const match = line.match(/^###\s+(.+)/);
    if (!match) return false;
    const heading = match[1].trim();
    return heading === entry.rawTitle || (entry.id && heading.startsWith(entry.id));
  });

  if (start < 0) {
    throw new Error(`Entry not found: ${entry.rawTitle}`);
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^###\s+/.test(lines[index]) || /^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }

  const replacement = entry.body.split(/\r?\n/);
  return [...lines.slice(0, start + 1), "", ...replacement, "", ...lines.slice(end)].join("\n");
}
