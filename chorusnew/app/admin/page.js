"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Unlisted admin tool to generate & append new questions. Protected server-side
// by ADMIN_KEY. Uses your LLM key (OPENAI_API_KEY / ANTHROPIC_API_KEY) if set,
// otherwise the built-in template bank.
export default function Admin() {
  const [key, setKey] = useState("");
  const [n, setN] = useState(5);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);

  useEffect(() => { try { setKey(localStorage.getItem("crowdle_admin_key") || ""); } catch (e) {} }, []);

  const run = async () => {
    setBusy(true); setOut(null);
    try { localStorage.setItem("crowdle_admin_key", key); } catch (e) {}
    try {
      const r = await fetch("/api/admin/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, n }),
      });
      setOut(await r.json());
    } catch (e) { setOut({ error: "network" }); }
    setBusy(false);
  };

  return (
    <main className="page">
      <Link href="/" className="back">← Back to the game</Link>
      <h1>Question generator</h1>
      <p className="subtitle">Generate new daily questions and append them to the schedule. This page is unlisted; the button only works with the admin key.</p>

      <div className="field-row">
        <label>Admin key</label>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ADMIN_KEY" />
      </div>
      <div className="field-row">
        <label>How many to generate</label>
        <div className="row2">
          <input type="number" min={1} max={10} value={n} onChange={(e) => setN(e.target.value)} />
          <button className="mini brand" onClick={run} disabled={busy || !key}>{busy ? "Generating…" : "Generate"}</button>
        </div>
      </div>

      {out && (
        <div style={{ marginTop: 18 }}>
          {out.error
            ? <p style={{ color: "var(--miss)" }}>Error: {out.error}{out.detail ? ` — ${out.detail}` : ""}</p>
            : (
              <>
                <p><b>Added {out.inserted}</b> question{out.inserted === 1 ? "" : "s"} via <b>{out.source === "ai" ? "AI" : "template bank"}</b>. Schedule now {out.scheduleLength} days long.</p>
                <ul>{(out.questions || []).map((q, i) => <li key={i}>{q}</li>)}</ul>
              </>
            )}
        </div>
      )}

      <div className="divider" />
      <h2>Keep it running by itself</h2>
      <p>You have 100 questions built in, so the game runs for months untouched. To extend it forever automatically, hit this URL on a daily schedule (e.g. Vercel Cron):</p>
      <p><code style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all" }}>GET /api/admin/generate?key=YOUR_ADMIN_KEY&amp;n=3</code></p>
      <p>With an <code>OPENAI_API_KEY</code> or <code>ANTHROPIC_API_KEY</code> set, it invents brand-new questions; otherwise it pulls from a built-in bank of extra questions.</p>
    </main>
  );
}
