import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { ensurePlayer } from "@/lib/players";
import { puzzleToday } from "@/lib/pool";

export const dynamic = "force-dynamic";

// GET /api/friends?clientId=...  → today's leaderboard for you + your friends
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const sb = getServiceClient();
  if (!clientId || !sb) return NextResponse.json({ error: "server_not_configured" }, { status: 503 });

  const me = await ensurePlayer(sb, clientId, null);
  const { data: fr } = await sb.from("friends").select("friend").eq("owner", clientId);
  const ids = [clientId, ...((fr || []).map((f) => f.friend))];

  const { data: players } = await sb.from("players").select("client_id,code,name").in("client_id", ids);
  const pById = {}; (players || []).forEach((p) => (pById[p.client_id] = p));

  const pz = await puzzleToday(sb);
  const { data: results } = await sb.from("results").select("*").eq("day", pz.day).in("client_id", ids);
  const rById = {}; (results || []).forEach((r) => (rById[r.client_id] = r));

  const rows = ids.map((id) => {
    const r = rById[id]; const p = pById[id];
    return {
      name: r?.name || p?.name || "Player",
      code: p?.code || null,
      isYou: id === clientId,
      played: !!r,
      score: r?.score ?? null,
      found: r?.found ?? null,
      timeMs: r?.time_ms ?? null,
    };
  });
  rows.sort((a, b) => {
    if (a.played !== b.played) return a.played ? -1 : 1;
    if (!a.played) return a.name.localeCompare(b.name);
    if (b.score !== a.score) return b.score - a.score;
    return a.timeMs - b.timeMs;
  });

  return NextResponse.json({ day: pz.day, dayIndex: pz.dayIndex, target: pz.target, myCode: me.code, rows });
}

// POST /api/friends  { action: "add"|"remove", clientId, name?, code }
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const clientId = String(body.clientId || "").slice(0, 64);
  const code = String(body.code || "").trim().toUpperCase().slice(0, 12);
  if (!clientId || !code) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: "server_not_configured" }, { status: 503 });

  const name = (String(body.name || "").trim().slice(0, 24)) || null;
  await ensurePlayer(sb, clientId, name);

  const { data: friend } = await sb.from("players").select("client_id,name").eq("code", code).maybeSingle();
  if (!friend) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (friend.client_id === clientId) return NextResponse.json({ error: "self" }, { status: 400 });

  if (action === "add") {
    await sb.from("friends").upsert([
      { owner: clientId, friend: friend.client_id },
      { owner: friend.client_id, friend: clientId },
    ], { onConflict: "owner,friend" });
    return NextResponse.json({ ok: true, name: friend.name });
  }
  if (action === "remove") {
    await sb.from("friends").delete().eq("owner", clientId).eq("friend", friend.client_id);
    await sb.from("friends").delete().eq("owner", friend.client_id).eq("friend", clientId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
