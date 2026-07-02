import { cookies } from "next/headers";
import { isGmRequest } from "../../../lib/auth";
import { filterHandbookForPlayers, readHandbook, readManifest } from "../../../lib/content";

export async function GET() {
  const manifest = await readManifest();
  const markdown = await readHandbook();
  const gm = isGmRequest(await cookies());
  return new Response(gm ? markdown : filterHandbookForPlayers(markdown, manifest), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
