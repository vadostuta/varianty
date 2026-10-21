# Varianty — party game for friends (host + players + TV)

## Context
Building a new app from scratch in `/Users/vv/apps/varianty` (empty dir). It's a "fake answer" party game:
the host asks a question, players write answers on their phones, everyone then sees all answers mixed with the
real one, players vote for what they think is correct, and points go to correct voters and to players whose
fake answers fooled others. Three kinds of screens stay in sync live: host controller, player phones, and a
shared TV screen.

Decisions confirmed with the user:
- **Runs locally**: Node server on the host laptop, everyone joins over home Wi‑Fi (QR code on TV).
- **UI language: Ukrainian.**
- **No self-voting**: a player's own answer is hidden from their voting list.
- **Duplicates are not merged**: every answer is a separate card. Scoring goes by card identity, not text:
  only the host's card counts as "correct", even if a player typed the same words.

## Game flow (server-side state machine)
```
LOBBY → [for round 1..2, question 1..5]:
  WRITING (timer)          players type and can edit their answer; the TV shows the question + timer
    → auto when the timer ends, or host clicks "Завершити зараз"
  REVEAL (no timer)        TV + phones show all answers shuffled (incl. correct); time to discuss and laugh
    → host clicks "Гравці, голосуйте"
  VOTING (timer)           phones list the answers minus the player's own; one vote, can change until time ends
    → auto when the timer ends / all voted, or host ends it
  RESULTS (host-stepped)   TV reveals card by card: who voted for it → whose card it is / ✅ correct;
                           host clicks "Далі" for each step
  SCOREBOARD               table with +delta per player for this question
    → next question, or ROUND_END (after Q5) → next round → GAME_END (final podium)
```
Host controls at any time: pause/resume timer, +15s, finish phase now, kick player, abort game.

**Scoring** (defaults; can be changed in settings): vote for the correct card → voter +2; vote for player B's
card → B +1 per vote. No answer = no card. No vote = 0.

## Tech stack
- **Single npm package**, TypeScript everywhere.
- **Server**: Node 24 + Express + Socket.IO, run with `tsx`. Binds `0.0.0.0:3000` and prints the LAN URL.
  Holds the only copy of game state; clients receive the state already filtered for their role.
- **Client**: Vite + React + React Router + Tailwind CSS. Three role routes in one SPA.
- **QR code**: `qrcode` package (QR shown on the TV lobby and on the host screen).
- **Storage**: JSON files in `data/` (presets + game-state snapshot for crash recovery). No database.
- **Tests**: Vitest for scoring and state machine; a socket.io-client bot script for end-to-end runs.

## Project layout
```
package.json, vite.config.ts, tsconfig.json, tailwind config
shared/
  types.ts        GameState, Player, Answer, Vote, Phase, Preset, Settings
  events.ts       typed Socket.IO event maps (client→server, server→client)
server/
  index.ts        Express (serves built client in prod) + Socket.IO wiring, LAN IP print
  game.ts         pure state machine: (state, action) → state; no I/O, so it's easy to test
  scoring.ts      computeDeltas(question, answers, votes, settings)
  timer.ts        server-authoritative timer: endsAt / pausedRemainingMs, fires phase-end action
  views.ts        role projections: hostView, screenView, playerView(playerId) (hide authors/correct until RESULTS)
  presets.ts      read/write data/presets.json
  persistence.ts  snapshot state to data/game-state.json on each change; restore on boot
src/
  main.tsx, App.tsx (routes), i18n/uk.ts (all Ukrainian strings in one place)
  lib/socket.ts, lib/useGame.ts (subscribe to state), lib/useCountdown.ts (server time offset)
  routes/host/   HostSetup.tsx, HostControl.tsx, Presets.tsx (preset editor)
  routes/screen/ Screen.tsx + per-phase views (Lobby with QR, Question, Reveal, Results stepper, Scoreboard, Final)
  routes/play/   Join.tsx, Play.tsx + per-phase views (Write, Wait, Reveal, Vote, Score)
  components/    Timer, AnswerCard, ScoreTable, PlayerChip, QR
tests/            scoring.test.ts, game.test.ts
scripts/bots.ts   N fake players that join, answer and vote randomly (for local testing)
```

## Screens
- **`/host`** (laptop/phone): pick a preset, set writing time and voting time (seconds), scoring values;
  lobby showing joined players (kick); then the controller: current phase, question + correct answer
  (visible only to the host), live "answered 4/6" and "voted 3/6", buttons for the controls above.
- **`/host/presets`**: CRUD for question sets. A preset = name + 2 rounds × 5 questions, each with
  `question` and `correctAnswer` (stored separately as requested). Validation: all 10 filled.
- **`/screen`** (TV): big type, dark theme. Lobby with QR + player list → question + big countdown +
  "who has answered" chips → shuffled answer grid → voting countdown + who has voted → step-by-step reveal
  of votes and authors → scoreboard with animated deltas → final podium.
- **`/play`** (phones/tablets, all identical): join with a name (+ auto colour) → text box with countdown
  and "Надіслати" (editable until time ends) → wait screen → answers list → voting buttons (own answer
  excluded) → your points this question + your rank.

## Key implementation details
- **Single game at a time** (it's a friends' game), so no room codes. The server keeps one `GameState`.
- **Reconnect**: on join the player gets `{playerId, token}` saved in `localStorage`; on reload it
  re-joins the same seat. Host and TV can reload freely; state is re-sent on connect.
- **Timers**: the server stores `phaseEndsAt` (epoch ms) and sends `serverNow` with each state, so
  clients compute a clock offset and count down without drift. Pause stores the remaining ms.
- **Shuffle**: answer order is shuffled once per question on the server (seeded, stored in state) so
  the TV and every phone show the same order.
- **Privacy**: `views.ts` removes authors and the correct flag from screen/player payloads until RESULTS;
  the correct answer is only in the host view before then.
- **Answer normalisation**: trim and limit to 80 chars; empty = no answer.
- Scripts: `npm run dev` (Vite + tsx watch via `concurrently`, Vite proxies `/socket.io`),
  `npm start` (build client, serve it from Express on :3000), `npm test`, `npm run bots -- 5`.

## Build order
1. Scaffold (Vite React TS, Tailwind, Express, Socket.IO, tsx, vitest, concurrently, qrcode).
2. `shared/types.ts`, `scoring.ts` + tests, `game.ts` state machine + tests.
3. Server wiring: sockets, timer, views, persistence, presets file with one sample preset in Ukrainian.
4. Player screens → TV screens → host controller → preset editor.
5. Bot script, then a polish pass (big-screen typography, phone layout, animations for reveal/scores).

## Verification
- `npm test`: scoring cases (correct vote +2, fooled votes +1 each, no self vote, identical text to the
  correct answer still scores as a player card, no answer/no vote) and phase transitions incl. pause/resume
  and auto-advance on timer end.
- `npm run dev`, open `/host`, `/screen`, and 3 tabs of `/play` (or `npm run bots -- 4`); play a full
  2×5 game and check: timers stay in sync across tabs, the reveal order matches on TV and phones,
  scores match the rules, reloading a player tab keeps the seat, killing and restarting the server restores the game.
- Check the real LAN: open the printed `http://192.168.x.x:3000/play` on a phone via the QR code.
