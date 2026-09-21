const ALPH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
export function genCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPH[Math.floor(Math.random() * ALPH.length)];
  return s;
}

// Make sure this device has a player row (stable friend code + name).
export async function ensurePlayer(sb, clientId, name) {
  const { data: ex } = await sb.from("players").select("*").eq("client_id", clientId).maybeSingle();
  if (ex) {
    if (name && name !== ex.name) await sb.from("players").update({ name }).eq("client_id", clientId);
    return { code: ex.code, name: name || ex.name };
  }
  for (let i = 0; i < 6; i++) {
    const code = genCode();
    const ins = await sb.from("players").insert({ client_id: clientId, code, name: name || "Player" }).select("*").single();
    if (!ins.error) return { code: ins.data.code, name: ins.data.name };
  }
  return { code: null, name: name || "Player" };
}
