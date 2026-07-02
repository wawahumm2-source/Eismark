import { cookies } from "next/headers";
import { createGmCookie, GM_COOKIE, gmCookieOptions, verifyPassword } from "../../../lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyPassword(body.password)) {
    return Response.json({ ok: false, message: "Password did not match." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(GM_COOKIE, createGmCookie(), gmCookieOptions());
  return Response.json({ ok: true, gm: true });
}
