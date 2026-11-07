# Варіанти (Varianty)

> This README is in two languages: **[English](#english)** · **[Українська](#ukrainian)**
>
> Цей README написаний двома мовами: **[English](#english)** · **[Українська](#ukrainian)**

---

<a id="english"></a>

## 🇬🇧 English

A party game where you bluff your friends with fake answers. You play it in one room: a TV shows the game, and everyone answers on their phone.

> 🇺🇦 **The interface is entirely in Ukrainian.** All screens, buttons, messages and the bundled question packs are in Ukrainian, and new presets are expected to be written in Ukrainian too.

### How it works

The host reads out a question that has a surprising real answer. Each player writes a believable fake answer on their phone. All the fakes are then shuffled together with the real answer and the host's own lie, and everyone votes for the one they think is true.

| Event | Points |
|---|---|
| You vote for the real answer | **+2** |
| Someone votes for your fake | **+1** per vote |
| You vote for the host's lie | **−2** |

You can't vote for your own answer. A game is **2 rounds × 5 questions**, for **up to 10 players**. The host can change all the point values and timers before the game starts.

Each question goes through these phases:

```
LOBBY → WRITING (timer) → REVEAL (discuss) → VOTING (timer) → RESULTS (step-by-step reveal) → SCOREBOARD
```

### Three screens, one app

| Route | Device | Purpose |
|---|---|---|
| `/host` | Laptop or phone | Pick a preset, set timers and scoring, run the game (pause, +15 s, skip, kick a player). Only the host sees the correct answer and its explanation |
| `/screen` | TV or projector | Lobby with a QR code, the question with a big countdown, the answer cards, a dramatic card-by-card reveal, the scoreboard and the final podium |
| `/play` | Players' phones | Join by name, write an answer, vote, and see your own score |

### Features

- **Local network only.** The server runs on the host's laptop, and players join over home Wi‑Fi by scanning the QR code on the TV. No accounts and no cloud.
- **Live sync.** Socket.IO keeps every screen in step. The server runs the timers, so countdowns match on every device.
- **Reconnects.** A player who reloads the page keeps their seat. If the server restarts, the game picks up where it left off (the state is saved to `data/game-state.json`).
- **Preset editor.** At `/host/presets` you can create and edit question packs: 10 questions, each with a real answer, the host's lie and an optional explanation. Several Ukrainian packs are included.
- **Themes.** A base theme and a Halloween theme. On `auto`, the Halloween theme switches on from 15 October to 3 November.
- **Background music.** Looping ambience on the TV, controlled from the host screen.

### Tech stack

TypeScript throughout. **Server:** Node.js, Express, Socket.IO. **Client:** React, React Router, Vite, Tailwind CSS. **Tests:** Vitest. Data is stored in JSON files, so there is no database.

### Getting started

You need **Node.js 24+**.

```bash
npm install
npm run dev
```

The server prints its LAN address. Then:

1. Open `/host` on the laptop and pick a preset.
2. Open `/screen` on the TV (any browser on the same network).
3. Players scan the QR code on the TV, or open `http://<laptop-ip>:5173/play`.

For a production build served from a single port (`3000`):

```bash
npm start
```

#### Other scripts

| Command | What it does |
|---|---|
| `npm test` | Runs the scoring and game state machine tests |
| `npm run typecheck` | Type-checks the project |
| `npm run bots -- 4` | Adds 4 fake players who answer and vote at random, for solo testing |
| `npm run format` | Formats the code with Prettier |

### Project layout

```
server/   Express + Socket.IO, game state machine, scoring, timers, role-filtered views, persistence
shared/   Types and socket events shared by the server and the client
src/      React client: routes/host, routes/screen, routes/play; all UI strings in src/i18n/uk.ts
data/     presets.json (question packs) and the game-state snapshot
scripts/  bots.ts for local testing
tests/    Vitest tests
```

### Writing new question packs

`PRESET_PROMPT.md` is a ready-to-use prompt for generating new presets with an LLM. It covers the game rules, the JSON format and what makes a good question. Append the output to `data/presets.json`, or add the questions by hand in the preset editor.

---

<a id="ukrainian"></a>

## 🇺🇦 Українська

Гра для вечірки, де треба обманювати друзів вигаданими відповідями. Грають в одній кімнаті: телевізор показує гру, а кожен відповідає зі свого телефона.

> 🇺🇦 **Інтерфейс повністю українською.** Усі екрани, кнопки, повідомлення та вбудовані набори питань українською мовою, і нові пресети теж варто писати українською.

### Як це працює

Ведучий зачитує питання з несподіваною правдивою відповіддю. Кожен гравець пише на телефоні правдоподібну вигадану відповідь. Потім усі вигадки перемішуються з правдивою відповіддю та брехнею ведучого, і кожен голосує за ту, яку вважає правдою.

| Подія | Бали |
|---|---|
| Ти проголосував за правдиву відповідь | **+2** |
| Хтось проголосував за твою вигадку | **+1** за кожен голос |
| Ти проголосував за брехню ведучого | **−2** |

Голосувати за власну відповідь не можна. Гра складається з **2 раундів по 5 питань**, грати можуть **до 10 гравців**. Перед початком гри ведучий може змінити всі бали й таймери.

Кожне питання проходить такі фази:

```
ЛОБІ → ПИШЕМО (таймер) → ВІДПОВІДІ (обговорення) → ГОЛОСУВАННЯ (таймер) → РЕЗУЛЬТАТИ (по одній картці) → ТАБЛИЦЯ
```

### Три екрани, один застосунок

| Маршрут | Пристрій | Для чого |
|---|---|---|
| `/host` | Ноутбук або телефон | Вибрати пресет, налаштувати таймери й бали, керувати грою (пауза, +15 с, пропустити фазу, вигнати гравця). Лише ведучий бачить правильну відповідь і пояснення до неї |
| `/screen` | Телевізор або проєктор | Лобі з QR-кодом, питання з великим таймером, картки з відповідями, драматичне відкриття карток одна за одною, таблиця балів і фінальний п'єдестал |
| `/play` | Телефони гравців | Приєднатися за ім'ям, написати відповідь, проголосувати й побачити свої бали |

### Можливості

- **Лише локальна мережа.** Сервер працює на ноутбуці ведучого, а гравці приєднуються через домашній Wi‑Fi, скануючи QR-код на телевізорі. Без акаунтів і без хмари.
- **Синхронізація наживо.** Socket.IO тримає всі екрани в одному стані. Таймери рахує сервер, тож відлік однаковий на кожному пристрої.
- **Перепідключення.** Гравець, який перезавантажив сторінку, залишається на своєму місці. Якщо сервер перезапуститься, гра продовжиться з того самого моменту (стан зберігається в `data/game-state.json`).
- **Редактор пресетів.** На `/host/presets` можна створювати й редагувати набори питань: 10 питань, у кожного правдива відповідь, брехня ведучого та необов'язкове пояснення. Кілька українських наборів уже є в комплекті.
- **Теми.** Базова тема та тема на Гелловін. У режимі `auto` тема на Гелловін вмикається з 15 жовтня по 3 листопада.
- **Фонова музика.** Атмосферна музика на телевізорі, якою керує ведучий.

### Технології

Усе на TypeScript. **Сервер:** Node.js, Express, Socket.IO. **Клієнт:** React, React Router, Vite, Tailwind CSS. **Тести:** Vitest. Дані зберігаються у JSON-файлах, бази даних немає.

### Як запустити

Потрібен **Node.js 24+**.

```bash
npm install
npm run dev
```

Сервер виведе свою адресу в локальній мережі. Далі:

1. Відкрий `/host` на ноутбуці й вибери пресет.
2. Відкрий `/screen` на телевізорі (будь-який браузер у тій самій мережі).
3. Гравці сканують QR-код на телевізорі або відкривають `http://<ip-ноутбука>:5173/play`.

Продакшн-збірка, яка працює на одному порту (`3000`):

```bash
npm start
```

#### Інші скрипти

| Команда | Що робить |
|---|---|
| `npm test` | Запускає тести підрахунку балів і стану гри |
| `npm run typecheck` | Перевіряє типи |
| `npm run bots -- 4` | Додає 4 ботів, які відповідають і голосують навмання, щоб тестувати гру самому |
| `npm run format` | Форматує код за допомогою Prettier |

### Структура проєкту

```
server/   Express + Socket.IO, стан гри, підрахунок балів, таймери, дані для кожної ролі, збереження стану
shared/   Типи та події сокетів, спільні для сервера й клієнта
src/      React-клієнт: routes/host, routes/screen, routes/play; усі тексти інтерфейсу в src/i18n/uk.ts
data/     presets.json (набори питань) і збережений стан гри
scripts/  bots.ts для локального тестування
tests/    Тести Vitest
```

### Як написати нові набори питань

`PRESET_PROMPT.md` містить готовий промпт для генерації нових пресетів за допомогою LLM. У ньому описано правила гри, формат JSON і те, яким має бути хороше питання. Додай результат у `data/presets.json` або впиши питання вручну в редакторі пресетів.
