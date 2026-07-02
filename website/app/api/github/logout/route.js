import { cookies } from "next/headers";
import { GITHUB_SESSION_COOKIE } from "../../../../lib/github-editor";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(GITHUB_SESSION_COOKIE);
  return Response.json({ ok: true, github: false });
}
