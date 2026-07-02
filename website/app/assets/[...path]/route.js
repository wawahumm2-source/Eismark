import { readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_request, { params }) {
  const assetsRoot = path.join(process.cwd(), "assets");
  const assetPath = path.resolve(assetsRoot, ...(params.path ?? []));
  if (!assetPath.startsWith(assetsRoot)) {
    return new Response("Not found", { status: 404 });
  }

  const body = await readFile(assetPath);
  const ext = path.extname(assetPath).toLowerCase();
  return new Response(body, {
    headers: {
      "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
