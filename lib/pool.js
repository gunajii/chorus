import { puzzleFor } from "./prompts";

// Reads AI/admin-generated prompts appended to the DB, in schedule order.
export async function getPoolPrompts(sb) {
  if (!sb) return [];
  const { data } = await sb.from("prompt_pool").select("question,options").order("idx", { ascending: true });
  return (data || []).map((r) => ({ q: r.question, o: r.options }));
}

// Today's puzzle, taking any generated prompts into account.
export async function puzzleToday(sb, date = new Date()) {
  const pool = await getPoolPrompts(sb);
  return puzzleFor(date, pool);
}
