import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";
import { isGithubConfigured, readGithubSession, shouldUseGithubWrites } from "../../../../lib/github-editor";

export async function GET() {
  const cookieStore = await cookies();
  const github = readGithubSession(cookieStore);
  return Response.json({
    gm: isGmRequest(cookieStore),
    github: Boolean(github),
    githubUser: github?.login ?? null,
    githubRequired: shouldUseGithubWrites(),
    githubConfigured: isGithubConfigured(),
  });
}
