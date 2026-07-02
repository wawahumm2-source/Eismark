import { cookies } from "next/headers";
import {
  assertRepoWriteAccess,
  createGithubSession,
  exchangeCodeForToken,
  fetchGithubUser,
  GITHUB_SESSION_COOKIE,
  GITHUB_SESSION_MAX_AGE,
  GITHUB_STATE_COOKIE,
  githubCookieOptions,
  isAllowedGithubUser,
  isGithubConfigured,
} from "../../../../lib/github-editor";

export async function GET(request) {
  if (!isGithubConfigured()) {
    return Response.json({ ok: false, message: "GitHub OAuth is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GITHUB_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return Response.json({ ok: false, message: "GitHub login state did not match." }, { status: 401 });
  }

  cookieStore.delete(GITHUB_STATE_COOKIE);

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchGithubUser(token);
    if (!isAllowedGithubUser(user.login)) {
      return Response.json({ ok: false, message: "This GitHub user is not allowed to edit Eismark." }, { status: 403 });
    }
    await assertRepoWriteAccess(token, user.login);
    cookieStore.set(
      GITHUB_SESSION_COOKIE,
      createGithubSession({ token, login: user.login }),
      githubCookieOptions(GITHUB_SESSION_MAX_AGE),
    );
    return Response.redirect(new URL("/#/home?github=connected", request.url));
  } catch (error) {
    return Response.json(
      { ok: false, message: error.status === 403 ? error.message : "GitHub login failed." },
      { status: error.status || 500 },
    );
  }
}
