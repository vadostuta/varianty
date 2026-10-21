# Варіанти — Design Brief for Mockups

This brief is for the agent producing **design mockups**. It explains what the product is, who uses which
screen, and every screen state that needs a design. Technical implementation lives in `PLAN.md`; you don't
need it to do the design work.

---

## 1. Product in one paragraph
**Варіанти** ("Variants") is a party game for a group of friends in one room. One **host** reads out a question.
Each **player** secretly writes a believable fake answer on their phone. Then everyone sees all the answers
mixed together with the **real** one, and votes for the one they think is true. You score by finding the truth
and by fooling your friends with your fake answer. A **TV** shows the game to the whole room. Expect lots of
laughing, so the design should feel playful, warm and social, not like a corporate quiz.

## 2. Who uses what (3 surfaces, 1 app)
| Surface | Device | Who | Purpose |
|---|---|---|---|
| **Host controller** `/host` | Laptop (primary), phone (must still work) | 1 host | Set up the game, run it: start/pause/next, see the correct answer privately |
| **Player** `/play` | Phones and tablets, portrait | 3–10 friends | Join, write answers, vote, see their own score |
| **TV screen** `/screen` | TV or projector, 16:9, seen from 2–5 m away | Everyone | Shows the question, timer, answers, vote reveal and scoreboard |

All players see the same player UI. Nobody types on the TV; it only displays.

## 3. Game structure
- 2 rounds × 5 questions = 10 questions per game.
- Each question goes through these phases (the host moves it forward):

```
LOBBY ─▶ WRITING ─▶ REVEAL ─▶ VOTING ─▶ RESULTS ─▶ SCOREBOARD ─▶ (next question / ROUND END / GAME END)
         (timer)    (no timer,  (timer)   (host steps
                     discuss)              through reveal)
```

**Scoring** (please show it visually on the results screens):
- You vote for the **correct** answer → **you get +2**.
- Someone votes for **your fake** answer → **you get +1** per vote.
- You can't vote for your own answer, so it doesn't appear in your voting list.
- If two players write the same text, the answers are **not** merged and each stays a separate card.

## 4. Visual direction
- **Language: Ukrainian** for all UI copy. Use real Ukrainian text in the mockups, not lorem ipsum.
  Pick fonts with full Cyrillic support (e.g. Unbounded, Manrope, Inter, Montserrat Alternates, Rubik).
- **Mood:** game-show energy plus a cozy evening with friends. Bold type, big friendly shapes, saturated accent
  colours, a little playfulness in the motion.
- **Theme:** a dark base works best for the TV in a dim room. Phones can share the same dark theme.
  Light mode is not required.
- **Player identity:** each player gets an auto-assigned **colour** and an **avatar** (an emoji or a simple
  generated shape) plus their name. Use it consistently on every surface: voting chips, scoreboard, answer authors.
- **Timer:** a large, unmistakable element. It needs urgency in the last 5–10 s (colour shift or pulse) and a
  clear "paused" state.
- **Legibility:** the TV must be readable from 4 m. Question text should be about 48–72px at 1080p and the
  answers at least 32px. On phones, tap targets should be at least 48px tall.
- **Accessibility:** don't use colour alone to carry meaning (correct/incorrect, player identity); pair it with
  an icon or text. Keep contrast at WCAG AA or better.

## 5. Screens to design

### 5.1 Player (phone, portrait ~390×844; also check a tablet ~820×1180)
| # | State | Content |
|---|---|---|
| P1 | **Join** | Game logo, "Твоє ім'я" input, avatar/colour picker (optional), button "Приєднатися" |
| P2 | **Lobby / waiting** | "Чекаємо на початок гри…", your avatar, list of joined players |
| P3 | **Write answer** | Round/question label ("Раунд 1 · Питання 3/5"), question text, countdown, multiline input (max 80 chars, counter), button "Надіслати" |
| P4 | **Answer sent** | Your submitted answer, "Змінити" (edit until time is up), countdown, "Відповіли 4 з 6" |
| P5 | **Time's up / reveal** | All answers listed in the shared order (read-only), "Обговорюйте! 😄", your own card marked "Твоя відповідь" |
| P6 | **Vote** | Countdown, the answers as large tappable cards **without your own**, selected state, "Голос прийнято" confirmation (vote can be changed until time is up) |
| P7 | **Waiting for results** | "Дивіться на екран 📺" |
| P8 | **Your result for this question** | Whether you guessed right (+2), who you fooled (+1 each, show their avatars), total score, current rank |
| P9 | **Round end / Game end** | Your final place, score, and fun stats (e.g. "Ти обдурив 7 разів") |
| P10 | **Edge states** | Reconnecting…, kicked from the game, didn't answer in time ("Ти не встиг 😅") |

### 5.2 TV screen (1920×1080, 16:9)
| # | State | Content |
|---|---|---|
| T1 | **Lobby** | Big logo, **QR code** + LAN URL (`192.168.1.23:3000/play`), joined players appearing as avatars (animate them in), "Гравців: 5" |
| T2 | **Question + writing** | Round/question label, large question, big countdown, row of player avatars that light up / tick ✓ once each player has answered |
| T3 | **Reveal** | Grid of all answers (3–11 cards: N players + the correct one) in shuffled order, no authors shown, "Час обговорити!" |
| T4 | **Voting** | Same grid, countdown, avatars that tick ✓ once each player has voted (who voted for what stays hidden) |
| T5 | **Results: step-by-step reveal** (most important, the dramatic moment) | The host reveals the cards one by one. For each card: first show the voters' avatars landing on it, then flip it to show **the author** ("Обман від Олі: +2") or **✅ ПРАВИЛЬНА ВІДПОВІДЬ** ("+2 кожному, хто вгадав"). The correct answer is revealed last. Please design 3 frames: before the card is revealed, voters shown, author/correct shown |
| T6 | **Scoreboard** | Ranked table: place, avatar, name, total, **+delta this question** (animated). Highlight the leader |
| T7 | **Round end** | "Раунд 1 завершено", scoreboard, "Раунд 2 скоро" |
| T8 | **Game end** | Podium for the top 3, then the full table, confetti, a few fun titles ("Головний брехун", "Знавець") |
| T9 | **Paused overlay** | Dimmed screen, "Пауза ⏸" |

### 5.3 Host controller (laptop 1440×900; must also work on a phone)
| # | State | Content |
|---|---|---|
| H1 | **Home / setup** | Choose preset (dropdown or cards), writing time (sec), voting time (sec), scoring (+2 / +1, editable), button "Створити гру"; link to "Набори питань" |
| H2 | **Lobby** | QR + URL, joined players list with a kick (✕) button for each, "Почати гру" (disabled until ≥2 players) |
| H3 | **Live control: writing** | Current question **plus the correct answer (visible only to the host, clearly marked 🔒)**, timer, "Відповіли 4/6" with names, live list of incoming answers, buttons: Пауза/Продовжити, +15 с, Завершити зараз |
| H4 | **Live control: reveal** | Shuffled answer list with authors visible to the host, button "Гравці, голосуйте" |
| H5 | **Live control: voting** | Timer, "Проголосували 3/6", controls as in H3 |
| H6 | **Live control: results** | Step indicator ("Картка 2 з 7"), preview of what the next step reveals, big "Далі ▶" button |
| H7 | **Scoreboard / next** | Deltas, "Наступне питання" / "Почати раунд 2" / "Завершити гру" |
| H8 | **Preset list** | Saved question sets (name, date, ✓ complete / ⚠ incomplete), create / edit / duplicate / delete |
| H9 | **Preset editor** | Preset name; two sections "Раунд 1" and "Раунд 2"; each has 5 rows of **Питання** + **Правильна відповідь** (separate fields), validation for empty fields, Save |
| — | Always visible | Small header with phase name, round/question progress (●●●○○), "Скасувати гру" (with a confirmation) |

The host UI is a **tool**: it should be dense, clear and fast to operate under pressure. One primary action per
state, big and obvious ("Далі ▶"). Destructive actions (kick, cancel game) should be visually secondary.

## 6. Shared components (please define once and reuse)
- Timer (normal / last 10 s / paused / finished)
- Player chip (avatar + name + colour; states: answered ✓, voted ✓, disconnected)
- Answer card (neutral / selectable / selected / "your own" / revealed-as-fake with author / revealed-as-correct)
- Vote avatars stacked on a card
- Score row with an animated +delta
- Progress indicator (round + question)
- Primary / secondary / danger buttons, text input with a char counter
- QR block with URL

## 7. Sample content (use it in the mockups)
- **Players:** Оля 🦊, Тарас 🐻, Марія 🐸, Андрій 🦉, Ірина 🐙, Богдан 🦄
- **Question:** "Що в середньовіччі вважали ліками від головного болю?"
  - Correct: "Прикладати до голови мертву мишу"
  - Fakes: "Пити вино з полином" (Оля), "Спати головою на північ" (Тарас), "Носити на шиї зубчик часнику" (Марія),
    "Слухати дзвони" (Андрій), "Прикладати холодну жабу" (Ірина), "Їсти сиру цибулю" (Богдан)
- **Results example:** Тарас and Ірина voted correctly (+2 each); 2 people voted for Оля's answer (+2 for Оля);
  Андрій fooled 1 person (+1).
- **Scoreboard example:** Оля 14 (+2), Тарас 12 (+2), Ірина 11 (+2), Андрій 9 (+1), Марія 7 (0), Богдан 5 (0)

## 8. Deliverables
1. A short style guide: colour tokens, type scale for TV / phone / host, spacing, radius, motion notes.
2. The shared components from §6 in all their states.
3. Mockups for every screen in §5 (P1–P10, T1–T9, H1–H9), at the listed sizes.
4. For **T5 (results reveal)** and **T6 (scoreboard)**: a short description or storyboard of the animation sequence.
5. Notes on anything in this brief that felt unclear or that you changed, and why.

## 9. Out of scope
- No accounts, login, chat, sound design or monetisation.
- No multiple simultaneous games or room codes: only one game runs at a time on the host laptop.
- No light theme.
