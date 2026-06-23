"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Uses the public anon key only.
// Used for Realtime subscriptions and public reads. Never has write access
// (RLS blocks anon writes); all writes go through server actions.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// True only when both public env vars are present.
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cached;
}
