"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./components/Logo";
import AdSlot from "./components/AdSlot";

const TZ_OFFSET = Number(process.env.NEXT_PUBLIC_TZ_OFFSET_MINUTES || 0);
function msToNextReset() {
  const s = new Date(Date.now() + TZ_OFFSET * 60000);
  const next = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + 1, 0, 0, 0);
  return Math.max(0, next - s.getTime());
}

const LS = "hive.v1";
const pad = (n) => String(n).padStart(2, "0");
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (ms) => { const s = Math.max(0, Math.floor((ms || 0) / 1000)); return Math.floor(s/60) + ":" + pad(s%60); };

function loadLocal() {
  if (typeof window === "undefined") return {};
  try { const s = JSON.parse(localStorage.getItem(LS)); if (s && typeof s === "object") return s; } catch (e) {}
  return {};
}
function saveLocal(patch) {
  try { localStorage.setItem(LS, JSON.stringify({ ...loadLocal(), ...patch })); } catch (e) {}
}
function ensureClientId() {
  const s = loadLocal();
  if (s.clientId) return s.clientId;
  const id = crypto?.randomUUID ? crypto.randomUUID() : "c" + Math.random().toString(36).slice(2) + Date.now();
  saveLocal({ clientId: id });
  return id;
}

export default function Page() {
  const [clientId, setClientId] = useState(null);
  const [name, setName] = useState("");
  const [data, setData] = useState(null);
  const [guess, setGuess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ t: "", c: "" });
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [prefillAdd, setPrefillAdd] = useState("");
  const [boardRefresh, setBoardRefresh] = useState(0);
  const [shareFallback, setShareFallback] = useState("");
  const [theme, setTheme] = useState("light");
  const startedRef = useRef(false);
  const startTsRef = useRef(0);
  const timerRef = useRef(null);
  const toastRef = useRef(null);
  const shakeRef = useRef(null);

  const showToast = useCallback((t) => {
    setToast(t); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(""), 2000);
  }, []);

  useEffect(() => {
    try { const t = localStorage.getItem("chorus.theme"); if (t) { document.documentElement.setAttribute("data-theme", t); setTheme(t); } } catch (e) {}
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const t = prev === "dark" ? "light" : "dark";
      try { document.documentElement.setAttribute("data-theme", t); localStorage.setItem("chorus.theme", t); } catch (e) {}
      return t;
    });
  }, []);

  const startTimer = useCallback(() => {
    startedRef.current = true; startTsRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTsRef.current), 250);
  }, []);
  const stopTimer = useCallback(() => clearInterval(timerRef.current), []);

  const loadToday = useCallback(async (cid) => {
    try {
      const r = await fetch(`/api/today?clientId=${encodeURIComponent(cid)}`, { cache: "no-store" });
      const j = await r.json();
      setData(j);
      if (j.guessesUsed > 0 && !j.over) startTimer();
    } catch (e) {}
  }, [startTimer]);

  useEffect(() => {
    const cid = ensureClientId();
    setClientId(cid);
    const l = loadLocal();
    setName(l.name || "");
    setStreak(l.streak || 0);
    loadToday(cid);
    // deep-link add-friend: ?add=CODE
    try {
      const p = new URLSearchParams(window.location.search).get("add");
      if (p) { setPrefillAdd(p.toUpperCase()); setPanelOpen(true); }
    } catch (e) {}
  }, [loadToday]);

  const persistName = useCallback((n) => { setName(n); saveLocal({ name: n }); }, []);

  const submit = useCallback(async () => {
    const raw = guess.trim();
    if (!raw || submitting || !clientId || !data || data.over) return;
    if (!startedRef.current) startTimer();
    setSubmitting(true);
    try {
      const r = await fetch("/api/guess", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, guess: raw, name: name || "Player" }),
      });
      const j = await r.json();
      setSubmitting(false);
      if (j.error) { showToast("Try again"); return; }
      setGuess("");
      if (j.duplicate) { setMsg({ t: "You already guessed that", c: "" }); return; }
      setData((d) => ({ ...d, slots: j.slots, guessesUsed: j.guessesUsed, over: j.over, result: j.result }));
      if (j.last) {
        if (j.last.hit) setMsg({ t: `Nailed the crowd's #${j.last.rank + 1}  ·  +${(data.target - j.last.rank) * 20}`, c: "good" });
        else {
          setMsg({ t: `“${j.last.label}” isn't in the Top ${data.target}`, c: "bad" });
          const e = shakeRef.current; if (e) { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); }
        }
      }
      if (j.over) { stopTimer(); handleGameOver(j.result); }
    } catch (e) { setSubmitting(false); showToast("Network error"); }
  }, [guess, submitting, clientId, data, name, startTimer, stopTimer, showToast]);

  const handleGameOver = useCallback((result) => {
    const l = loadLocal();
    if (l.lastResult !== data.day) {
      let s;
      if (result.solvedTop) {
        const [yy, mm, dd] = data.day.split("-").map(Number);
        const prev = new Date(Date.UTC(yy, mm - 1, dd) - 86400000);
        const pstr = `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth()+1)}-${pad(prev.getUTCDate())}`;
        s = l.lastResult === pstr ? (l.streak || 0) + 1 : 1;
      } else s = 0;
      saveLocal({ lastResult: data.day, streak: s, best: Math.max(l.best || 0, s) });
      setStreak(s);
    }
    setBoardRefresh((n) => n + 1);
  }, [data]);

  const buildShare = useCallback(() => {
    if (!data || !data.result) return "";
    const grid = data.slots.map((s) => (s.found ? "🟩" : "⬛")).join("");
    const r = data.result;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    return `Chorus No.${data.dayIndex + 1}\n${r.score} pts · ${r.found}/${data.target} · ${fmt(r.timeMs)}\n${grid}${streak > 1 ? `  ${streak}🔥` : ""}\n${url}`;
  }, [data, streak]);

  const onShare = useCallback(async () => {
    const text = buildShare(); if (!text) return;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) {}
    try { await navigator.clipboard.writeText(text); showToast("Copied — paste it anywhere"); }
    catch (e) { setShareFallback(text); showToast("Select the text to copy"); }
  }, [buildShare, showToast]);

  if (!data) {
    return (
      <>
        <Appbar streak={streak} theme={theme} onTheme={toggleTheme} onFriends={() => setPanelOpen(true)} onHelp={() => showToast("Guess the answers most people gave.")} />
        <main className="game"><p className="task" style={{ marginTop: 40 }}>Loading today's puzzle…</p></main>
      </>
    );
  }

  const [yy, mm, dd] = data.day.split("-").map(Number);
  const dateLabel = `${MONTHS[mm - 1]} ${dd}`;
  const remaining = Math.max(0, data.budget - data.guessesUsed);

  return (
    <>
      <Appbar streak={streak} theme={theme} onTheme={toggleTheme} onFriends={() => setPanelOpen(true)}
        onHelp={() => showToast(`Guess the ${data.target} answers most people gave. ${data.budget} tries. Catch #1 to keep your streak.`)} />

      <main className="game">
        <div className="lead">Daily · No.{data.dayIndex + 1} · {dateLabel}</div>
        <h1 className="prompt">{data.question}</h1>
        <p className="task">Name the <b>Top {data.target}</b> answers the crowd gave most.</p>

        <div className="board">
          {data.slots.map((s) => (
            <div key={s.rank} className={"slot" + (s.revealed ? (s.found ? " found" : " miss") : "")}>
              <span className="rk">{s.rank + 1}</span>
              <div className="body">
                {s.revealed
                  ? (<><span className="ans">{s.label}</span><span className="pct">{s.pct}%</span></>)
                  : (<span className="dots">— — —</span>)}
              </div>
            </div>
          ))}
        </div>

        {!data.over && (
          <>
            <div className="tries">
              {Array.from({ length: data.budget }).map((_, i) => (
                <span key={i} className={"pip " + (i < data.guessesUsed ? "used" : "left")} />
              ))}
              <span className="lab">{remaining} guess{remaining === 1 ? "" : "es"} left</span>
            </div>
            {startedRef.current && <div className="clock">{fmt(elapsed)}</div>}
            <div className={"msg " + msg.c}>{msg.t}</div>
            <div className="entry" ref={shakeRef}>
              <input value={guess} onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder="Type an answer…" maxLength={40}
                autoComplete="off" autoCapitalize="off" spellCheck={false} />
              <button onClick={submit} disabled={submitting}>Guess</button>
            </div>
          </>
        )}

        {data.over && data.result && (
          <div className="result">
            <div className="score">{data.result.score}<span className="of"> pts</span></div>
            <div className="rstats">{data.result.found}/{data.target} found · {data.result.guesses} guess{data.result.guesses === 1 ? "" : "es"} · {fmt(data.result.timeMs)}</div>
            <div className="rline">
              {data.result.found >= data.target
                ? <><span className="win">Full hive mind.</span> You found every answer.</>
                : data.result.solvedTop
                  ? <>You caught the crowd's <b>#1</b> — streak safe.</>
                  : <>You missed the crowd's <b>#1</b>. Streak reset.</>}
            </div>
            <div className="rbtns">
              <button className="btn-primary" onClick={onShare}>Share result</button>
              <button className="btn-outline" onClick={() => setPanelOpen(true)}>See friends' scores</button>
            </div>
            {shareFallback && <div className="sharebox">{shareFallback}</div>}
            <Countdown />
            <AdSlot slot="1234567890" />
          </div>
        )}
      </main>

      {panelOpen && (
        <FriendsSheet
          clientId={clientId} name={name} setName={persistName}
          onClose={() => { setPanelOpen(false); setPrefillAdd(""); }}
          prefillAdd={prefillAdd} boardRefresh={boardRefresh} showToast={showToast}
        />
      )}

      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </>
  );
}

function Appbar({ streak, onFriends, onHelp, onTheme, theme }) {
  return (
    <header className="appbar">
      <div className="appbar-in">
        <Logo />
        <div className="actions">
          <span className={"chip-btn streak" + (streak > 0 ? " on" : "")}>🔥 {streak}</span>
          <button className="chip-btn" onClick={onFriends}>Friends</button>
          <button className="iconbtn" onClick={onTheme} aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button>
          <button className="iconbtn" onClick={onHelp} aria-label="How to play">?</button>
        </div>
      </div>
    </header>
  );
}

function Countdown() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const upd = () => {
      let s = Math.floor(msToNextReset() / 1000);
      const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      setT(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    upd(); const iv = setInterval(upd, 1000); return () => clearInterval(iv);
  }, []);
  return <div className="next">Next puzzle in <span className="cd">{t}</span></div>;
}

function FriendsSheet({ clientId, name, setName, onClose, prefillAdd, boardRefresh, showToast }) {
  const [myCode, setMyCode] = useState("");
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameField, setNameField] = useState(name);
  const [addCode, setAddCode] = useState(prefillAdd || "");
  const [busy, setBusy] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const r = await fetch(`/api/friends?clientId=${encodeURIComponent(clientId)}`, { cache: "no-store" });
      const j = await r.json();
      if (!j.error) { setBoard(j); if (j.myCode) setMyCode(j.myCode); }
    } catch (e) {}
    setLoading(false);
  }, [clientId]);

  const loadMe = useCallback(async () => {
    try {
      const r = await fetch(`/api/me?clientId=${encodeURIComponent(clientId)}`, { cache: "no-store" });
      const j = await r.json();
      if (j.code) setMyCode(j.code);
      if (j.name && !name) { setName(j.name); setNameField(j.name); }
    } catch (e) {}
  }, [clientId, name, setName]);

  useEffect(() => { loadMe(); loadBoard(); }, [loadMe, loadBoard]);
  useEffect(() => { loadBoard(); }, [boardRefresh, loadBoard]);

  const saveName = async () => {
    const n = nameField.trim().slice(0, 24); if (!n) return;
    setName(n);
    try { await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, name: n }) }); } catch (e) {}
    showToast("Name saved"); loadBoard();
  };

  const addFriend = async () => {
    const code = addCode.trim().toUpperCase(); if (!code || busy) return;
    const n = (nameField.trim() || "Player").slice(0, 24); setName(n);
    setBusy(true);
    try {
      const r = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", clientId, name: n, code }) });
      const j = await r.json();
      if (j.ok) { setAddCode(""); showToast(`Added ${j.name || "friend"}`); loadBoard(); }
      else if (j.error === "not_found") showToast("No player with that code");
      else if (j.error === "self") showToast("That's your own code");
      else showToast("Couldn't add");
    } catch (e) { showToast("Network error"); }
    setBusy(false);
  };

  const removeFriend = async (code) => {
    setBusy(true);
    try { await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", clientId, code }) }); showToast("Removed"); loadBoard(); }
    catch (e) { showToast("Network error"); }
    setBusy(false);
  };

  const shareCode = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/?add=${myCode}` : "";
    const text = `Add me on Chorus — my code is ${myCode}: ${url}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) {}
    try { await navigator.clipboard.writeText(text); showToast("Invite copied"); } catch (e) { showToast(text); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>Friends</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="sheet-sub">Same puzzle for everyone. See who reads the crowd best today.</p>

        <div className="field-row">
          <label>Your name</label>
          <div className="row2">
            <input value={nameField} onChange={(e) => setNameField(e.target.value)} placeholder="e.g. Gunaji" maxLength={24} />
            <button className="mini" onClick={saveName}>Save</button>
          </div>
        </div>

        {myCode && (
          <div className="invite">
            <span>Your code <code>{myCode}</code></span>
            <button className="mini brand" onClick={shareCode}>Share</button>
          </div>
        )}

        <div className="field-row">
          <label>Add a friend by code</label>
          <div className="row2">
            <input value={addCode} onChange={(e) => setAddCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={12} />
            <button className="mini brand" onClick={addFriend} disabled={busy}>Add</button>
          </div>
        </div>

        <div className="disthead" style={{ marginTop: 6 }}><span>Today's leaderboard</span><span>Score</span></div>
        <div className="lb">
          {loading ? <div className="lb-empty">Loading…</div>
            : !board || board.rows.length === 0 ? <div className="lb-empty">Just you so far — share your code to add friends.</div>
            : board.rows.map((row, i) => (
              <div key={row.code || i} className={"lb-row" + (row.isYou ? " you" : "")}>
                <span className="lb-rank">{row.played ? i + 1 : "–"}</span>
                <span className="lb-name">{row.name}{row.isYou && <span className="me">YOU</span>}</span>
                {row.played
                  ? <span className="lb-stat">{row.score}<small> pts</small></span>
                  : <span className="lb-wait">not played</span>}
                {!row.isYou && row.code && <button className="rm" onClick={() => removeFriend(row.code)} aria-label="Remove friend">✕</button>}
              </div>
            ))}
        </div>
        <p className="hint">Share your code so friends can add you — then you all appear on one daily leaderboard.</p>
      </div>
    </div>
  );
}
