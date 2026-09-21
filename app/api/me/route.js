import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { ensurePlayer } from "@/lib/players";

export const dynamic = "force-dynamic";

// GET /api/me?clientId=...  → your friend code + name (registers you if needed)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const sb = getServiceClient();
  if (!clientId || !sb) return NextResponse.json({ code: null, name: "" });
  const me = await ensurePlayer(sb, clientId, null);
  return NextResponse.json(me);
}

// POST /api/me  { clientId, name }  → set your display name
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const clientId = String(body.clientId || "").slice(0, 64);
  const name = (String(body.name || "").trim().slice(0, 24)) || "Player";
  const sb = getServiceClient();
  if (!clientId || !sb) return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  const me = await ensurePlayer(sb, clientId, name);
  return NextResponse.json({ ok: true, ...me });
}
