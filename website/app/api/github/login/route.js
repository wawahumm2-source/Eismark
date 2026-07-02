import { cookies } from "next/headers";
import {
  createGithubState,
  GITHUB_STATE_COOKIE,
  GITHUB_STATE_MAX_AGE,
  githubConfig,
  githubCookieOptions,
  isGithubConfigured,
} from "../../../../lib/github-editor";

export async function GET(request) {
  if (!isGithubConfigured()) {
    return redirectHome(request, "oauth_missing");
  }

  const config = githubConfig();
  const state = createGithubState();
  const cookieStore = await cookies();
  cookieStore.set(GITHUB_STATE_COOKIE, state, githubCookieOptions(GITHUB_STATE_MAX_AGE));

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: new URL("/api/github/callback", request.url).toString(),
    scope: process.env.GITHUB_OAUTH_SCOPE || "repo",
    state,
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

function redirectHome(request, status) {
  const url = new URL("/", request.url);
  url.searchParams.set("github", status);
  url.hash = "/home";
  return Response.redirect(url, 303);
}
