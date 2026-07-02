import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";

const EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request) {
  if (!isGmRequest(await cookies())) {
    return Response.json({ ok: false, message: "GM/Editor mode required." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const alt = String(formData.get("alt") || "Reference image").trim();
  const slug = slugify(String(formData.get("slug") || "entry-image"));

  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ ok: false, message: "Image file is required." }, { status: 400 });
  }

  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return Response.json({ ok: false, message: "Use PNG, JPG, WebP, or GIF images." }, { status: 400 });
  }

  const assetsRoot = path.resolve(process.cwd(), "assets");
  await mkdir(assetsRoot, { recursive: true });

  const name = `${slug}-${Date.now()}${ext}`;
  const filePath = path.resolve(assetsRoot, name);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const assetPath = `/assets/${name}`;
  return Response.json({
    ok: true,
    path: assetPath,
    markdown: `![${alt}](${assetPath})`,
  });
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "entry-image";
}
