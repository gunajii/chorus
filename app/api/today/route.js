import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { distributionMap, buildGameState } from "@/lib/prompts";
import { puzzleToday } from "@/lib/pool";

export const dynamic = "force-dynamic";

// GET /api/today?clientId=...
// Returns today's question (NOT the answers) plus the player's current game
// state, so a reload resumes exactly where they left off.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const sb = getServiceClient();
  const pz = await puzzleToday(sb);
  let game = null;
  let votes = [];
  if (sb) {
    if (clientId) {
      const { data } = await sb.from("games").select("*")
        .eq("day", pz.day).eq("client_id", clientId).maybeSingle();
      game = data || null;
    }
    const { data: v } = await sb.from("votes").select("answer_key").eq("day", pz.day);
    votes = v || [];
  }

  const dist = distributionMap(pz.prompt, votes);
  const state = buildGameState(pz, game, dist);

  return NextResponse.json({
    day: pz.day,
    dayIndex: pz.dayIndex,
    question: pz.prompt.q,
    target: pz.target,
    budget: pz.budget,
    ...state,
  });
}
