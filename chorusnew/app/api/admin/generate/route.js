import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { PROMPTS } from "@/lib/prompts";
import { getPoolPrompts } from "@/lib/pool";
import { generateQuestions } from "@/lib/generator";

export const dynamic = "force-dynamic";

// Generates N new questions and appends them to the schedule (prompt_pool).
// Protected by ADMIN_KEY. Call it from the /admin page, or hit it on a daily
// cron (e.g. Vercel Cron) to keep the schedule permanently ahead of today:
//   GET /api/admin/generate?key=YOUR_ADMIN_KEY&n=3
async function handle(key, n) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "admin_disabled" }, { status: 403 });
  if (key !== process.env.ADMIN_KEY) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: "server_not_configured" }, { status: 503 });

  const count = Math.max(1, Math.min(10, Number(n) || 5));
  const pool = await getPoolPrompts(sb);
  const existing = PROMPTS.map((p) => p.q).concat(pool.map((p) => p.q));

  const { source, items } = await generateQuestions(count, existing);
  if (!items.length) return NextResponse.json({ ok: true, source, inserted: 0, note: "nothing new to add" });

  const { data: last } = await sb.from("prompt_pool").select("idx").order("idx", { ascending: false }).limit(1);
  let idx = last && last[0] ? last[0].idx + 1 : 0;

  const rows = items.map((it) => ({ idx: idx++, question: it.q, options: it.o }));
  const { error } = await sb.from("prompt_pool").insert(rows);
  if (error) return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true, source, inserted: rows.length,
    scheduleLength: PROMPTS.length + pool.length + rows.length,
    questions: items.map((i) => i.q),
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  return handle(searchParams.get("key"), searchParams.get("n"));
}
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  return handle(body.key, body.n);
}
