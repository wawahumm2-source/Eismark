import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";
import { readGithubSession, saveGithubFile } from "../../../../lib/github-editor";

export async function POST(request) {
  const cookieStore = await cookies();
  if (!isGmRequest(cookieStore)) {
    return Response.json({ ok: false, message: "GM/Editor mode required." }, { status: 401 });
  }

  const session = readGithubSession(cookieStore);
  if (!session) {
    return Response.json({ ok: false, message: "Connect GitHub before saving to the repository." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const result = await saveGithubFile({
      path: body.path,
      content: String(body.content ?? ""),
      message: String(body.message || "Update Eismark content"),
      token: session.token,
    });
    return Response.json({ ok: true, commit: result.commit, content: result.content });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "GitHub save failed." }, { status: error.status || 500 });
  }
}
