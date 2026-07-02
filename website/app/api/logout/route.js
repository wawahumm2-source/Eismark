import { cookies } from "next/headers";
import { GM_COOKIE } from "../../../lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(GM_COOKIE);
  return Response.json({ ok: true, gm: false });
}
