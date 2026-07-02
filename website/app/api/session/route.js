import { cookies } from "next/headers";
import { isGmRequest } from "../../../lib/auth";

export async function GET() {
  return Response.json({ gm: isGmRequest(await cookies()) });
}
