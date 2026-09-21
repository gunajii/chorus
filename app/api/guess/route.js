import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import {
  resolveKeyFor, rankOf, titleCase,
  distributionMap, buildGameState, pointsFor,
} from "@/lib/prompts";
import { puzzleToday } from "@/lib/pool";
import { ensurePlayer } from "@/lib/players";

export const dynamic = "force-dynamic";

// POST /api/guess  { clientId, guess, name }
// Server-authoritative: validates the guess against the hidden answer key,
// enforces the guess budget and one game per day, and times the solve.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const clientId = String(body.clientId || "").slice(0, 64);
  const raw = String(body.guess || "").trim().slice(0, 40);
  const name = (String(body.name || "").trim().slice(0, 24)) || "Player";
  if (!clientId || !raw) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const sb = getServiceClient();
  if (!sb) return NextResponse.json({ error: "server_not_configured" }, { status: 503 });

  const pz = await puzzleToday(sb);
  const meta = { target: pz.target, budget: pz.budget, dayIndex: pz.dayIndex };
  const key = resolveKeyFor(pz.prompt, raw);
  const known = pz.prompt.o.find((o) => o.k === key);
  const label = known ? known.l : titleCase(raw);

  const votesFor = async () => {
    const { data } = await sb.from("votes").select("answer_key").eq("day", pz.day);
    return distributionMap(pz.prompt, data || []);
  };

  // Load existing game (if any)
  let { data: game } = await sb.from("games").select("*")
    .eq("day", pz.day).eq("client_id", clientId).maybeSingle();

  if (game && game.finished) {
    const dist = await votesFor();
    return NextResponse.json({ ...meta, ...buildGameState(pz, game, dist), alreadyDone: true });
  }

  // First guess of the day → create the game and record the honest vote
  if (!game) {
    const ins = await sb.from("games")
      .insert({ day: pz.day, client_id: clientId, guesses: [] })
      .select("*").single();
    if (ins.error) return NextResponse.json({ error: "db_error" }, { status: 500 });
    game = ins.data;
    await sb.from("votes").upsert(
      { day: pz.day, client_id: clientId, answer_key: key, answer_label: label },
      { onConflict: "day,client_id" }
    );
  }

  let guesses = game.guesses || [];
  if (guesses.some((g) => g.key === key)) {
    const dist = await votesFor();
    return NextResponse.json({ ...meta, ...buildGameState(pz, game, dist), duplicate: true });
  }

  const rank = rankOf(pz.ranked, key);
  const hit = rank !== null;
  guesses = [...guesses, { key, label, hit, rank }];
  const foundCount = guesses.filter((g) => g.hit).length;
  const over = foundCount >= pz.target || guesses.length >= pz.budget;

  const patch = { guesses };
  if (over) { patch.finished = true; patch.finished_at = new Date().toISOString(); }
  await sb.from("games").update(patch).eq("day", pz.day).eq("client_id", clientId);
  game = { ...game, ...patch };

  if (over) {
    const timeMs = Math.max(0, new Date(game.finished_at) - new Date(game.started_at));
    const solvedTop = guesses.some((g) => g.hit && g.rank === 0);
    const score = guesses.filter((g) => g.hit).reduce((s, g) => s + pointsFor(pz.target, g.rank), 0);
    await sb.from("results").upsert({
      day: pz.day, client_id: clientId, name,
      found: foundCount, guesses: guesses.length, solved_top: solvedTop, time_ms: timeMs, score,
    }, { onConflict: "day,client_id" });
    await ensurePlayer(sb, clientId, name);
  }

  const dist = await votesFor();
  return NextResponse.json({
    ...meta,
    ...buildGameState(pz, game, dist),
    last: { label, hit, rank },
  });
}
