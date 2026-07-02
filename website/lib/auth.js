import crypto from "node:crypto";

export const GM_COOKIE = "eismark_gm";
const COOKIE_MAX_AGE = 60 * 60 * 12;

function getSecret() {
  return process.env.AUTH_SECRET || process.env.GM_PASSWORD_HASH || process.env.GM_PASSWORD || "local-eismark-dev-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function hashPassword(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function expectedPasswordHash() {
  if (process.env.GM_PASSWORD_HASH) return process.env.GM_PASSWORD_HASH;
  return hashPassword(process.env.GM_PASSWORD || "eismark-gm");
}

export function verifyPassword(password) {
  const received = hashPassword(password || "");
  const expected = expectedPasswordHash();
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export function createGmCookie() {
  const expiresAt = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = `gm.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function isGmRequest(cookies) {
  const token = cookies.get(GM_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [role, expiresAt, signature] = parts;
  if (role !== "gm") return false;
  if (Number(expiresAt) < Date.now()) return false;

  const payload = `${role}.${expiresAt}`;
  const expected = sign(payload);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function gmCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}
