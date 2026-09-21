import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Diagnostic endpoint — open /api/health in the browser to see exactly what the
// server sees at runtime. Safe to expose temporarily (the Supabase URL is public
// and the key is never revealed, only its length). Delete this file once working.
export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const info = {
    url_present: !!rawUrl,
    url_value: rawUrl,                       // public, safe to show
    url_length: rawUrl.length,
    url_has_trailing_whitespace: /\s$/.test(rawUrl),
    url_ends_with_slash: /\/$/.test(rawUrl),
    key_present: !!rawKey,
    key_length: rawKey.length,
    key_looks_like_jwt: rawKey.trim().startsWith("eyJ"),
  };

  let dbTest;
  try {
    const sb = getServiceClient();
    if (!sb) dbTest = { error: "no_client_env_missing" };
    else {
      const r = await sb.from("games").select("day").limit(1);
      dbTest = r.error ? { error: r.error.message } : { ok: true, rows: (r.data || []).length };
    }
  } catch (e) {
    dbTest = { exception: String(e && e.message ? e.message : e) };
  }

  return NextResponse.json({ ...info, dbTest });
}
