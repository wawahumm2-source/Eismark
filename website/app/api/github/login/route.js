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
    return Response.json({ ok: false, message: "GitHub OAuth is not configured." }, { status: 500 });
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
