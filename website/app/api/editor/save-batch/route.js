import { cookies } from "next/headers";
import { isGmRequest } from "../../../../lib/auth";
import { readGithubSession, saveGithubFilesBatch } from "../../../../lib/github-editor";

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
  if (!Array.isArray(body.files) || !body.files.length) {
    return Response.json({ ok: false, message: "At least one file is required." }, { status: 400 });
  }

  try {
    const result = await saveGithubFilesBatch({
      files: body.files,
      message: String(body.message || "Update Eismark editor content"),
      token: session.token,
    });
    return Response.json({ ok: true, ref: result });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "GitHub batch save failed." }, { status: error.status || 500 });
  }
}
