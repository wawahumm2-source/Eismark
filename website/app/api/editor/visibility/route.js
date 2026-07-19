import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";
import { readManifest } from "../../../../lib/content";
import { getGithubFile, readGithubSession, saveGithubFile, shouldUseGithubWrites } from "../../../../lib/github-editor";

const MODES = new Set(["public", "draft", "hidden"]);
const MANIFEST_REPO_PATH = "website/content/manifest.json";

export async function POST(request) {
  const cookieStore = await cookies();
  if (!isGmRequest(cookieStore)) {
    return Response.json({ ok: false, message: "GM/Editor mode required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const key = String(body.id || body.slug || "").trim();
  const visibility = String(body.visibility || "public").trim();

  if (!key || !MODES.has(visibility)) {
    return Response.json({ ok: false, message: "Valid entry and visibility are required." }, { status: 400 });
  }

  const manifestPath = path.resolve(process.cwd(), "content", "manifest.json");
  const session = shouldUseGithubWrites() ? readGithubSession(cookieStore) : null;
  if (shouldUseGithubWrites() && !session) {
    return Response.json(
      { ok: false, message: "Connect GitHub before saving to the repository.", needsGithub: true },
      { status: 401 },
    );
  }

  const githubManifest = shouldUseGithubWrites() ? await getGithubFile(MANIFEST_REPO_PATH, session.token) : null;
  if (shouldUseGithubWrites() && !githubManifest) {
    return Response.json({ ok: false, message: "Could not load the website manifest from GitHub." }, { status: 500 });
  }
  const manifest = shouldUseGithubWrites()
    ? JSON.parse(githubManifest.content)
    : JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.entryVisibility = manifest.entryVisibility ?? {};
  const resolvedManifest = await readManifest();
  const defaultVisibility = resolvedManifest.entryStatuses?.[key] === "Under Review" ? "draft" : "public";

  if (visibility === defaultVisibility) {
    delete manifest.entryVisibility[key];
  } else {
    manifest.entryVisibility[key] = visibility;
  }

  const nextContent = `${JSON.stringify(manifest, null, 2)}\n`;
  if (shouldUseGithubWrites()) {
    await saveGithubFile({
      path: MANIFEST_REPO_PATH,
      content: nextContent,
      message: `Update ${key} visibility`,
      token: session.token,
    });
    return Response.json({ ok: true, github: true, entryVisibility: manifest.entryVisibility });
  } else {
    await writeFile(manifestPath, nextContent, "utf8");
  }
  return Response.json({ ok: true, entryVisibility: manifest.entryVisibility });
}
