# Prompt: generate new question presets for «Варіанти»

> Copy everything below this line and give it to the agent that will write the presets.

---

You are writing question packs ("presets") for **«Варіанти»**, a Ukrainian party game for adult friends. All game content must be in **Ukrainian**.

## How the game works

«Варіанти» is a "fake answer" game, like Fibbage or Balderdash. One laptop runs the server, the TV shows the shared screen, and each player (up to 10) uses their phone.

For every question:

1. **Writing (≈60 s):** the TV shows a question with a surprising real answer. Players don't know the answer, so each one types a **fake answer** that sounds believable or funny (max 80 characters).
2. **Reveal:** every fake answer and the one real answer are shuffled and shown as cards (A, B, C…). People read them out and laugh.
3. **Voting (≈30 s):** each player votes for the card they think is true. They can't vote for their own card.
4. **Results:** a voter who picks the real answer gets **+2**. A player whose fake gets votes earns **+1 per vote**.
5. The host can read an optional **explanation** (only the host sees it) when someone asks "wait, is that really true?"

A preset has **2 rounds × 5 questions = 10 questions**.

So the game depends on one thing: **the real answer has to be something nobody would guess, but once it's on a card next to the fakes, it still has to seem believable.** If the real answer is obvious, too well known, or looks different from the fakes, the question doesn't work.

## Output format

Return a JSON array of preset objects. It must be valid JSON that can be appended to `data/presets.json` as is:

```json
[
  {
    "id": "varianty-<short-latin-slug>",
    "name": "Варіанти: <Theme name>",
    "updatedAt": 0,
    "rounds": [
      [
        { "question": "…", "correctAnswer": "…", "explanation": "…" },
        { "question": "…", "correctAnswer": "…", "explanation": "…" },
        { "question": "…", "correctAnswer": "…", "explanation": "…" },
        { "question": "…", "correctAnswer": "…", "explanation": "…" },
        { "question": "…", "correctAnswer": "…", "explanation": "…" }
      ],
      [ /* 5 more questions */ ]
    ]
  }
]
```

Hard rules:
- Exactly **2 rounds**, and exactly **5 questions** in each round.
- `id` must be unique, lowercase Latin with hyphens.
- `question` and `correctAnswer` must not be empty. `explanation` may be `""`, but fill it in whenever you can.
- Use the typographic apostrophe consistently (`'` is fine) and «ялинки» quotes for quotations.

## How to write a good question

### Question shapes that work best

1. **Unfinished sentence ending in "…"** (the best one). The question stops right where the answer goes, so players only have to fill the gap:
   - «У норвезькому місті Лонгйїрбюен офіційно заборонено…» → «Помирати»
   - «Японська туристична агенція Unagi Travel спеціалізується на тому, що відправляє в подорожі…» → «М'які іграшки»
   - «Квентін Тарантіно працював у відеопрокаті. Його звільнили, бо він…» → «Забагато говорив з клієнтами»
2. **A blank in the middle of a quote:** «Джонні Депп: «Гратися з … — це одна з небагатьох речей, у яких я справді хороший»» → «Ляльками Барбі»
3. **A dialect word:** «На Галичині та Буковині «окулярами» жартівливо називають…» → «Яєшню». Use one or two of these per preset, not more. Pick words whose meaning is funny or far from what they sound like.
4. **A plain "What / Who / Why…?" question.** Use it rarely, because it gives players less to work with.

### What the correct answer should look like

- **Short:** 1 to 5 words, the way someone would type it on a phone in 10 seconds. Long, precise or technical answers stand out among the fakes and give themselves away.
- **Written the same way as a fake:** a simple, everyday phrase with no dates, Latin names or long qualifiers. Put those details in `explanation`.
  - Good: «Мішки з картоплею». Bad: «Близько 9 тонн мішків з картоплею (Project SPUDS)».
- **The grammar must fit the gap.** If the question ends in «використовують…», the answer goes in the accusative case («Гусей»). Read the question and answer together as one sentence and check that it reads naturally.
- **Surprising but not random:** after the reveal, people should react with "no way… but that actually makes sense". Funny, absurd, slightly rude or awkward answers work best (see «Покакати», «Сечу», «Імпотент»).
- **Avoid bare numbers** such as «Три» or «116 років». Players just type other numbers and nobody laughs. One per preset at most.
- **Avoid well-known facts** like "the Hundred Years' War didn't last 100 years". If a quiz regular would know it, swap it out.

### The explanation (host only)

- 1 to 3 short sentences: what happened, where and when, and why it's true.
- If the fact is disputed, a legend, or mostly a myth, **say so honestly**. Example: «Так стверджує популярна історія. Документальних підтверджень майже немає…»
- If the source is a show, a post or an interview, name it: «Так пояснили в шоу…», «Найзалайканіша відповідь під дописом у Threads».

### Truth and sourcing (important)

- Every fact must be **real and checkable**. Don't make up facts, quotes, laws or companies. If you're not sure, drop the question.
- **Never make up "most-liked Threads/Twitter answers", celebrity quotes or replies from specific people.** The existing packs have questions like this, but they were copied from real posts. Only use this format if you have the real source; otherwise skip it.
- When you can, use well-documented sources such as Wikipedia, major media or reliable books. Treat "fun fact" listicles with suspicion.

### Tone and content

- The audience is adults at a party. Mild toilet humour, sex jokes and awkward topics are fine.
- Off limits: making fun of real tragedies or victims of violence, hate based on nationality, religion, gender and so on, and russian propaganda or romanticising russia. Ukrainian context (history, cities, dialects, internet culture, celebrities) is very welcome.
- **Round 1** is a warm-up with lighter, easier questions. **Round 2** is weirder, cruder and more absurd.
- Mix topics inside each preset. A pack needs variety even when it has a theme.

## Topic families (from the existing packs)

| Family | Example |
|---|---|
| Weird history and old customs | «У вікторіанську епоху існували вечірки, де гості дивилися на…» → «Розгортання мумій» |
| Old medicine and beliefs | «У середньовіччі люди вірили, що жаби можуть…» → «Жити всередині людини» |
| Animals and nature | «Замість сторожових собак поліція в сільських районах Сіньцзяну використовує…» → «Гусей» |
| Celebrities: odd facts and quotes | «Деніел Редкліфф: «Щоб папараці не могли продавати мої фотографії, протягом шести місяців я…»» → «Не міняв одяг» |
| Brands and companies | «Компанія Nintendo при заснуванні у 1889 році виготовляла не приставки, а…» → «Гральні карти» |
| Strange services, jobs and laws around the world | «У Японії існує послуга оренди людини, щоб вона замість тебе…» → «Вибачалася» |
| Science and technology with a twist | «У 2012 році інженери Boeing для тестування Wi-Fi на борту замінили пасажирів на…» → «Мішки з картоплею» |
| Ukrainian dialects | «Що означає «твар» на галицькому діалекті?» → «Обличчя» |
| Absurd festivals, records, auctions | «У штаті Мен щороку проходять водні перегони, де учасники замість човнів використовують…» → «Великі гарбузи» |
| Internet / Threads (real sources only) | «Як нішево сказати «я вагітна»? (найпопулярніша відповідь у Threads)» → «Маю свою людинку в органах» |

## Two complete reference questions

```json
{
  "question": "У 1990-х роках у Північній Кореї всі вчителі перед отриманням права викладати мали довести, що вміють…",
  "correctAnswer": "Грати на акордеоні",
  "explanation": "Акордеон був інструментом пропаганди: легкий і мобільний, тож учитель міг будь-де заграти патріотичну пісню з учнями."
}
```

```json
{
  "question": "Тигри та леви можуть годинами тертися об дерево, на якому є…",
  "correctAnswer": "Парфуми Calvin Klein",
  "explanation": "Дослідники з Бронкського зоопарку з'ясували, що великі коти реагують на цибетон — синтетичну речовину з мускусним запахом. Тепер деякі фотографи бризкають парфумами місця, щоб зробити гарний кадр."
}
```

Why these work: the question cuts off right before the punchline, the answer is short and absurd yet true, and players can think of dozens of believable fakes («співати гімн», «стріляти з автомата», «котяча м'ята», «кров антилопи»…).

## Ideas for new presets

Make each pack from a mix of topic families, with a light theme if you want one:

- **«Варіанти: Їжа та напої»**: the origins of dishes, weird foods, drinks banned in different countries, odd recipes from the past.
- **«Варіанти: Закони та заборони»**: real strange laws from different countries and cities, with dates and places in the explanation.
- **«Варіанти: Тваринне божевілля»**: animal behaviour, animals in armies and politics, record-holding animals.
- **«Варіанти: Зірки без гриму»**: documented odd habits, contract riders and early jobs of famous people.
- **«Варіанти: Бренди»**: what famous companies made at first, product names that flopped, odd marketing campaigns.
- **«Варіанти: Україна дивна»**: Ukrainian history, cities, dialects, odd local records and festivals.
- **«Варіанти: Тіло людини»**: odd medical facts, old treatments, body quirks.
- **«Варіанти: Професії, яких ви не знали»**: real unusual jobs and services (Japan, Korea and the USA are good sources).
- **«Варіанти: Кохання і побачення»**: odd wedding and courtship customs, unusual divorce grounds, dating facts.
- **«Варіанти: Спорт, але дивний»**: absurd sports, championships and records.

## Self-check before you return

For each question:
- [ ] Does the question plus the answer read as one grammatical Ukrainian sentence?
- [ ] Is the answer 1 to 5 words long and in the same style a player would use for a fake?
- [ ] Would most people at the table fail to know the answer?
- [ ] Can players come up with at least five believable or funny fakes?
- [ ] Is the fact true, and does the explanation honestly flag any doubts?
- [ ] Is there no made-up quote or social media post?

For each preset:
- [ ] 2 rounds × 5 questions, valid JSON, unique `id`.
- [ ] At least 4 different topic families, at most 2 dialect words, at most 1 numeric answer.
- [ ] Round 2 is weirder or spicier than round 1.
- [ ] No question repeats one from the existing packs (the examples above or any other pack).
