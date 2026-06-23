import "server-only";

import { createClient } from "@supabase/supabase-js";

// Server-only Supabase clients.
//
// - getPublicServerClient(): anon key, for reading published public data in
//   Server Components. Honors RLS.
// - getServiceClient(): service-role key, for admin writes inside Server
//   Actions / Route Handlers ONLY. Bypasses RLS. NEVER import into a client
//   component — `import "server-only"` above will hard-error if you try.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServerSupabaseConfigured = url.length > 0 && anonKey.length > 0;
export const isServiceConfigured = url.length > 0 && serviceKey.length > 0;

export function getPublicServerClient() {
  if (!isServerSupabaseConfigured) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function getServiceClient() {
  if (!isServiceConfigured) {
    throw new Error(
      "Supabase service role no configurado. Falta SUPABASE_SERVICE_ROLE_KEY en .env.local.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
