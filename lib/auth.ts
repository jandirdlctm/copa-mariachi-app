import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Lightweight, dependency-free session auth for the admin panel.
//
// Two roles:
//   - owner   : signs in with the shared ADMIN_PASSWORD.
//   - scorer  : signs in with a per-field PIN (validated against
//               scorekeeper_pins server-side); session is scoped to one field.
//
// Sessions are stored in HMAC-signed, httpOnly cookies. No Supabase Auth.

const SECRET = process.env.SESSION_SECRET ?? "insecure-dev-secret-change-me";
const OWNER_COOKIE = "cm_owner";
const SCORER_COOKIE = "cm_scorer";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type Session =
  | { role: "owner" }
  | { role: "scorer"; field: string }
  | null;

function sign(value: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url");
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  return value;
}

// Constant-time password check against ADMIN_PASSWORD.
export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function setOwnerSession() {
  const store = await cookies();
  store.set(OWNER_COOKIE, sign("owner"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function setScorerSession(field: string) {
  const store = await cookies();
  store.set(SCORER_COOKIE, sign(`scorer:${field}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(OWNER_COOKIE);
  store.delete(SCORER_COOKIE);
}

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const owner = unsign(store.get(OWNER_COOKIE)?.value);
  if (owner === "owner") return { role: "owner" };
  const scorer = unsign(store.get(SCORER_COOKIE)?.value);
  if (scorer?.startsWith("scorer:")) {
    return { role: "scorer", field: scorer.slice("scorer:".length) };
  }
  return null;
}

// Guards for server components / actions. Redirect to login when unauthorized.
export async function requireOwner(): Promise<{ role: "owner" }> {
  const s = await getSession();
  if (s?.role !== "owner") redirect("/admin");
  return s;
}

export async function requireScorerOrOwner(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin");
  return s;
}
