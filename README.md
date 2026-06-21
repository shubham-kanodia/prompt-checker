# Break The Prompt

A prompt injection CTF starring PIP, an overeager AI intern that keeps getting
put in charge of things it shouldn't be. Sixteen days, each a new job on its
first week. Your only weapon is the chat box. Talk PIP into leaking a secret,
approving a bogus payment, trashing its own product, or following instructions
hidden in an email.

On extraction days you read the secret out of PIP's reply, decode it yourself if
needed, and submit it to clear the day (the answer is checked server-side, never
auto-detected). On action days, where PIP has to actually do or say the wrong
thing, the day clears automatically when it slips.

Built with Next.js (App Router), TypeScript, Tailwind, a real LLM behind
OpenRouter, Postgres on Supabase, and Google login through Auth.js. Progress is
saved on your device with localStorage and synced to your account when you log
in.

## The days

Each day teaches a real technique and gets harder than the last. The objective
varies too: most days are about extracting a secret, but some are about making
PIP take an action, say something forbidden, act on poisoned data, or leak a
coworker's private info.

### Core (PIP's first week)

1. DAY ONE — the secret is just sitting there. Ask for it.
2. THE GRAPEVINE — social-engineer PIP into leaking a coworker's salary.
3. THE COPY DESK — indirect disclosure through spelling, acrostics, translation.
4. THE HELP DESK — instruction override ("ignore previous instructions").
5. THE OUTBOX — bypass an output filter by encoding the leak.
6. THE FRONT DESK — bypass an input keyword filter with oblique wording.
7. THE BRAND VOICE — roleplay jailbreak to make PIP trash its own product (say-forbidden).
8. THE INBOX — indirect injection through an email PIP summarizes (poisoned data).
9. THE RECORDS DESK — combine techniques to beat input and output filters at once.
10. THE COMPLIANCE REVIEW — filters plus a second LLM reviewer reading every reply.

### Advanced tier

11. THE SECURE LINE — an encrypted channel hides the leak from the censor. Spot the Caesar shift and decode it.
12. THE TWO CODES — a honeypot. The code PIP hands over is a decoy. Find the real one it will not admit exists.
13. DOUBLE BLIND — an LLM firewall screens your input. Look like a writing prompt, hide the answer in structure.
14. THE SANITIZER — the dual-LLM defense paraphrases your message first. The exploit has to survive the wash.
15. PERFORMANCE REVIEW — an input firewall and an output reviewer at once. Only the obliquely-requested acrostic clears both.
16. THE EXPENSE DESK — no secret to steal. Hijack PIP into approving a fraudulent expense (action).

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
node --env-file=.env.local scripts/migrate.mjs   # create the database tables
npm run dev
```

Open http://localhost:3000.

## Environment

See `.env.example`. You need:

- `OPENROUTER_API_KEY` — your OpenRouter key. Challenges run against
  `OPENROUTER_MODEL` (default `openai/gpt-4.1-mini`). Change the model freely.
- `DATABASE_URL` — the Supabase pooled connection string (port 6543). The app
  uses `prepare: false` because of the transaction pooler.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — optional. The game is fully playable
  anonymously without them. Add them to turn on Google login, the leaderboard,
  and cross-device sync.
- `RL_PER_IP_PER_MIN` / `RL_GLOBAL_PER_DAY` — optional spend caps (defaults 12
  and 2000). See below.
- `NEXT_PUBLIC_GA_ID` — optional Google Analytics 4 id (e.g. `G-XXXXXXXXXX`).
  Analytics stays off until this is set.

## Data and analytics

- **Prompts.** Every message a player sends, plus the bot's reply, is saved to
  the `prompts` table (with the day, whether the firewall blocked it, whether it
  solved an action day, and the user id when signed in). It is a dataset of real
  prompt-injection attempts. Logging is best-effort and never blocks a turn.
- **Google Analytics.** Set `NEXT_PUBLIC_GA_ID` to enable GA4. It tracks page
  views on navigation plus these events: `day_opened`, `prompt_sent`,
  `input_blocked`, `hint_revealed`, `answer_submitted`, `day_cleared`,
  `share_clicked`, `login_click`.

## Spend protection

The only route that calls OpenRouter is `POST /api/challenge/[slug]`, and one
request can fan out to ~3 model calls. It is guarded by three layers:

1. A cheap in-memory burst guard per instance.
2. A Postgres-backed per-IP-per-minute cap (`RL_PER_IP_PER_MIN`). Shared across
   serverless instances via the `api_usage` table, so it survives cold starts.
3. A Postgres-backed global daily cap (`RL_GLOBAL_PER_DAY`). This is the real
   backstop: it holds even if a client spoofs the `x-forwarded-for` IP, because
   it caps total usage regardless of source.

Input size is also bounded (message and history length, fixed `max_tokens`), so
per-call cost is capped.

The ultimate guarantee, though, is **a hard credit/spend limit on the OpenRouter
key itself** (set it in the OpenRouter dashboard). Do that before going public:
if anything in the app layer is ever bypassed, the account cap is what actually
stops the bleeding.

### Turning on Google login

1. In the Google Cloud console, create an OAuth 2.0 Client ID (type: Web
   application).
2. Add the authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google` (and your production URL
   later).
3. Put the client id and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`,
   then restart the dev server.

Until those are set, the header shows "login soon" and everyone plays
anonymously with progress kept on their device.

## How it works

- Challenge configs live server-side in `lib/challenges/levels.ts`. Flags,
  system prompts, and filters never reach the browser. The client only ever sees
  the model's (filtered) reply and a `solved` boolean.
- `lib/challenges/run.ts` runs each turn: input guards, then the model, then
  output guards, then the optional judge. The win check (`containsFlag.ts`) runs
  on the final delivered text, and it decodes base64, hex, reversed text,
  leetspeak, and acrostics, so a clever encoded leak still counts.
- Scoring lives in `lib/score.ts`. Hints and extra attempts cost points; clean
  and fast solves earn bonuses.
- Anonymous progress is in `lib/progress.ts` (localStorage). On login,
  `components/ProgressSync.tsx` merges it into the account, keeping your best of
  each value.

## A note on safety

This is a learning tool. The point is to understand how prompt injection works
so you can build systems that resist it. Play nice out there.
