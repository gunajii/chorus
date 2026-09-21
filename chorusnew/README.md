# 📊 Chorus

A daily crowd-guessing game. One globally-relatable question a day; uncover the **5 answers most people gave** before your guesses run out. Keep a streak, race the clock, and climb private leaderboards with friends.

Built with **Next.js (App Router)** + **Supabase (Postgres)**. Deploys free on Vercel + Supabase.

> **Name note:** "Hive" was taken (a trademarked board game + several puzzle apps), so the project is **Chorus**. Do a domain/trademark check before committing money.

---

## Highlights

- **100 built-in questions**, all globally relatable — the game runs for months with zero upkeep.
- **Auto question generator** — `/admin` + `/api/admin/generate` appends new questions to the schedule. Uses your LLM key to *invent* new ones, or a built-in bank if you have no key. Hit it on a daily cron and the game never runs out.
- **Server-authoritative gameplay** — the browser never receives the answers; guesses are validated server-side, with a guess budget, one game per day, and an official solve timer. Hard to cheat.
- **Friends leaderboard** — each player gets a shareable friend code; add friends by code (`/?add=CODE` invites), and everyone appears on one daily leaderboard ranked by **score**. Each answer scores points (crowd's #1 is worth most).
- **A real website** — How to play / About / Privacy pages, favicon, Open Graph, and env-gated Google AdSense.

## Structure

```
app/
  page.js                game + friends leaderboard (client)
  admin/                 unlisted question generator UI
  how-to-play/ about/ privacy/
  api/
    today/ guess/        server-authoritative game
    friends/ me/         friend list + daily leaderboard, player registry
    admin/generate/      generate & append questions (ADMIN_KEY)
  components/ icon.svg globals.css layout.js
lib/
  prompts.js             100 questions, daily schedule, scoring
  pool.js                merges generated questions into the schedule
  generator.js           AI generator (+ built-in fallback bank)
  supabaseServer.js
supabase/schema.sql      run once
```

---

## Deploy (~10 min)

1. **Supabase:** new project → SQL Editor → paste `supabase/schema.sql` → Run. Copy the **Project URL** and **service_role key**.
2. **Local:** `npm install` → `cp .env.example .env.local` (fill the two Supabase values) → `npm run dev`.
3. **Vercel:** push to GitHub → import → add env vars → deploy. Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_LAUNCH_DATE` (your launch day, so puzzle No.1 lands then).

Everything works before you configure the generator or ads.

## Running the generator

- Set `ADMIN_KEY` to turn it on. Optionally set `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` for AI-invented questions (otherwise it uses the built-in bank).
- Visit `/admin`, enter the key, and generate — or automate it with a daily cron hitting:
  `GET /api/admin/generate?key=YOUR_ADMIN_KEY&n=3`
- On **Vercel Cron**, add to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/admin/generate?key=YOUR_ADMIN_KEY&n=3", "schedule": "0 0 * * *" }] }
  ```

## Monetising with AdSense (plan)

Users first, then ads. Get real traffic → apply at adsense.google.com with your live domain (the Privacy + About pages you need are included; update the contact email in `app/privacy/page.js`) → on approval set `NEXT_PUBLIC_ADSENSE_CLIENT` and rename `public/ads.txt.example` → `ads.txt`. One tasteful unit sits on the result screen. Casual-game RPMs are low, so volume is what matters.

## Growth

The result grid and `/?add=CODE` friend invites are the loops. Seed daily in a few communities for ~2 weeks, lean on streaks + the midnight countdown, and instrument with a free analytics tool so your traffic numbers double as the proof AdSense wants.
