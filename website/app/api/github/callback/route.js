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
    return redirectHome(request, "oauth_missing");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GITHUB_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectHome(request, "state_mismatch");
  }

  cookieStore.delete(GITHUB_STATE_COOKIE);

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchGithubUser(token);
    if (!isAllowedGithubUser(user.login)) {
      return redirectHome(request, "not_allowed");
    }
    await assertRepoWriteAccess(token, user.login);
    cookieStore.set(
      GITHUB_SESSION_COOKIE,
      createGithubSession({ token, login: user.login }),
      githubCookieOptions(GITHUB_SESSION_MAX_AGE),
    );
    return redirectHome(request, "connected");
  } catch (error) {
    return redirectHome(request, error.status === 403 ? "not_allowed" : "login_failed");
  }
}

function redirectHome(request, status) {
  const url = new URL("/", request.url);
  url.searchParams.set("github", status);
  url.hash = "/home";
  return Response.redirect(url, 303);
}
