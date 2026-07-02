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
  const routeParams = await params;
  const requestedPath = routeParams?.path ?? [];
  const assetsRoot = path.resolve(process.cwd(), "assets");
  const assetPath = path.resolve(assetsRoot, ...requestedPath);
  const relativePath = path.relative(assetsRoot, assetPath);

  if (!requestedPath.length) {
    return new Response("Not found", { status: 404 });
  }

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return new Response("Not found", { status: 404 });
  }

  let body;
  try {
    body = await readFile(assetPath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(assetPath).toLowerCase();
  return new Response(body, {
    headers: {
      "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
