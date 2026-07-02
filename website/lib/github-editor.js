import crypto from "node:crypto";

export const GITHUB_STATE_COOKIE = "eismark_github_state";
export const GITHUB_SESSION_COOKIE = "eismark_github_editor";

const SESSION_MAX_AGE = 60 * 60 * 8;
const STATE_MAX_AGE = 60 * 10;
const API_ROOT = "https://api.github.com";

const ALLOWED_OUTPUTS = new Set([
  "outputs/ECD_Master_Index_v0.1.md",
  "outputs/Eismark_ECD_Archive_v0.1.md",
  "outputs/Eismark_Readable_Guide_v0.1.md",
  "outputs/Eismark_Audit_Register_v0.3.md",
  "outputs/ECD_Protocol_Addendum_v0.2.md",
  "outputs/ECD_Source_Hierarchy_and_Canonization_Workflow_v0.1.md",
  "outputs/Eismark_New_Canonization_Ideas_From_Chat_Export_v0.1.md",
  "outputs/Eismark_Additional_Interesting_Ideas_Second_Pass_v0.1.md",
  "outputs/Eismark_New_Canonization_Ideas_Triage_v0.1.md",
]);

export function githubConfig() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    owner: process.env.GITHUB_OWNER || "wawahumm2-source",
    repo: process.env.GITHUB_REPO || "Eismark",
    branch: process.env.GITHUB_BRANCH || "main",
    allowedUsers: (process.env.GITHUB_ALLOWED_USERS || "")
      .split(",")
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean),
  };
}

export function isGithubConfigured() {
  const config = githubConfig();
  return Boolean(config.clientId && config.clientSecret && config.owner && config.repo && config.branch);
}

export function shouldUseGithubWrites() {
  return process.env.NETLIFY === "true" || process.env.EISMARK_GITHUB_WRITES === "true";
}

export function createGithubState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function githubCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createGithubSession({ token, login }) {
  const payload = JSON.stringify({
    token,
    login,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  });
  return encrypt(payload);
}

export function readGithubSession(cookies) {
  const value = cookies.get(GITHUB_SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const session = JSON.parse(decrypt(value));
    if (!session.token || !session.login || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function isAllowedGithubUser(login) {
  const allowed = githubConfig().allowedUsers;
  if (!allowed.length) return false;
  return allowed.includes(String(login || "").toLowerCase());
}

export async function exchangeCodeForToken(code) {
  const config = githubConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    throw new Error("GitHub token exchange failed.");
  }
  return result.access_token;
}

export async function fetchGithubUser(token) {
  const result = await githubFetch("/user", { token });
  return result;
}

export async function assertRepoWriteAccess(token, login) {
  const config = githubConfig();
  const permission = await githubFetch(`/repos/${config.owner}/${config.repo}/collaborators/${login}/permission`, { token });
  const level = permission.permission;
  if (!["admin", "maintain", "write"].includes(level)) {
    const error = new Error("Your GitHub account does not have write access to this repository.");
    error.status = 403;
    throw error;
  }
}

export function normalizeRepoPath(inputPath) {
  const normalized = String(inputPath || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");

  if (!normalized || normalized.includes("..")) {
    throw Object.assign(new Error("Invalid file path."), { status: 400 });
  }

  if (
    normalized.startsWith("website/content/") ||
    normalized.startsWith("website/assets/") ||
    normalized.startsWith("content/") ||
    normalized.startsWith("assets/") ||
    ALLOWED_OUTPUTS.has(normalized)
  ) {
    return normalized;
  }

  throw Object.assign(new Error("That file path is outside the editor write area."), { status: 400 });
}

export async function getGithubFile(pathname, token) {
  const config = githubConfig();
  const result = await githubFetch(
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponentPath(pathname)}?ref=${encodeURIComponent(config.branch)}`,
    { token, notFoundOk: true },
  );
  if (!result) return null;
  return {
    sha: result.sha,
    content: Buffer.from(result.content || "", "base64").toString("utf8"),
  };
}

export async function saveGithubFile({ path: pathname, content, message, token }) {
  const config = githubConfig();
  const safePath = normalizeRepoPath(pathname);
  const current = await getGithubFile(safePath, token);
  const body = {
    message: message || `Update ${safePath}`,
    content: Buffer.from(content).toString("base64"),
    branch: config.branch,
  };
  if (current?.sha) body.sha = current.sha;

  return githubFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponentPath(safePath)}`, {
    method: "PUT",
    token,
    body,
    conflictStatus: 409,
  });
}

export async function saveGithubFilesBatch({ files, message, token }) {
  const config = githubConfig();
  const safeFiles = files.map((file) => ({
    path: normalizeRepoPath(file.path),
    content: String(file.content ?? ""),
  }));

  const ref = await githubFetch(`/repos/${config.owner}/${config.repo}/git/ref/heads/${encodeURIComponent(config.branch)}`, { token });
  const baseCommit = await githubFetch(`/repos/${config.owner}/${config.repo}/git/commits/${ref.object.sha}`, { token });

  const tree = await githubFetch(`/repos/${config.owner}/${config.repo}/git/trees`, {
    method: "POST",
    token,
    body: {
      base_tree: baseCommit.tree.sha,
      tree: safeFiles.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      })),
    },
  });

  const commit = await githubFetch(`/repos/${config.owner}/${config.repo}/git/commits`, {
    method: "POST",
    token,
    body: {
      message: message || "Update Eismark editor content",
      tree: tree.sha,
      parents: [ref.object.sha],
    },
  });

  return githubFetch(`/repos/${config.owner}/${config.repo}/git/refs/heads/${encodeURIComponent(config.branch)}`, {
    method: "PATCH",
    token,
    body: { sha: commit.sha },
    conflictStatus: 409,
  });
}

async function githubFetch(endpoint, { method = "GET", token, body, notFoundOk = false, conflictStatus } = {}) {
  const response = await fetch(`${API_ROOT}${endpoint}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "eismark-editor",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (notFoundOk && response.status === 404) return null;
  if (!response.ok) {
    const status = response.status === 409 ? conflictStatus || 409 : response.status;
    const error = new Error(status === 409 ? "The file changed on GitHub. Refresh before saving." : "GitHub request failed.");
    error.status = status;
    throw error;
  }

  return response.status === 204 ? {} : response.json();
}

function encodeURIComponentPath(pathname) {
  return pathname.split("/").map(encodeURIComponent).join("/");
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decrypt(value) {
  const [iv, tag, encrypted] = String(value).split(".");
  if (!iv || !tag || !encrypted) throw new Error("Invalid session.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

function encryptionKey() {
  const secret = process.env.AUTH_SECRET || process.env.GM_PASSWORD_HASH || process.env.GM_PASSWORD || "local-eismark-dev-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

export const GITHUB_SESSION_MAX_AGE = SESSION_MAX_AGE;
export const GITHUB_STATE_MAX_AGE = STATE_MAX_AGE;
