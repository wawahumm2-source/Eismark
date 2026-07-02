import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";

const MODES = new Set(["public", "draft", "hidden"]);

export async function POST(request) {
  if (!isGmRequest(await cookies())) {
    return Response.json({ ok: false, message: "GM/Editor mode required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const key = String(body.id || body.slug || "").trim();
  const visibility = String(body.visibility || "public").trim();

  if (!key || !MODES.has(visibility)) {
    return Response.json({ ok: false, message: "Valid entry and visibility are required." }, { status: 400 });
  }

  const manifestPath = path.resolve(process.cwd(), "content", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.entryVisibility = manifest.entryVisibility ?? {};

  if (visibility === "public") {
    delete manifest.entryVisibility[key];
  } else {
    manifest.entryVisibility[key] = visibility;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, entryVisibility: manifest.entryVisibility });
}
