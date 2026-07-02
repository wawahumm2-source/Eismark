export async function GET() {
  return Response.json({
    ok: true,
    app: "Eismark World Handbook",
    commit:
      process.env.COMMIT_REF ||
      process.env.DEPLOY_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "local",
    branch:
      process.env.BRANCH ||
      process.env.HEAD ||
      process.env.GITHUB_BRANCH ||
      "unknown",
    context: process.env.CONTEXT || process.env.NODE_ENV || "unknown",
  });
}
