import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service_role key. Never import this
// into a client component — the service key must never reach the browser.
let cached = null;

export function getServiceClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // env not set → routes fall back to prior-only
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
