import { readManifest } from "../../../lib/content";
import { cookies } from "next/headers";
import { isGmRequest } from "../../../lib/auth";

export async function GET() {
  const manifest = await readManifest();
  return Response.json({
    ...manifest,
    gm: isGmRequest(await cookies()),
  });
}
