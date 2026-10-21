import { useEffect, useMemo, useState } from 'react';
import type { PublicPlayer, View, ViewCard } from '../../../shared/types.ts';
import { Avatar, VoteStack } from '../../components/Avatar.tsx';
import { AnswerCard } from '../../components/AnswerCard.tsx';
import { CheckIcon } from '../../components/icons.tsx';
import { plural, uk } from '../../i18n/uk.ts';
import { TvFrame } from './Screen.tsx';

/**
 * T5: the host steps through the cards. Per card: (1) the card is spotlit, (2) voters' avatars
 * drop onto it, (3) it flips to show the author or the correct-answer seal. Correct card is last.
 */
export function Results({ view }: { view: View }) {
  const players = useMemo(() => new Map(view.players.map((p) => [p.id, p])), [view.players]);
  const r = view.results!;
  const focus = view.cards.find((c) => c.id === r.focusCardId) ?? null;
  const revealedCount = view.cards.filter((c) => c.revealed).length;
  const k = r.focusStage === 'pending' ? revealedCount + 1 : revealedCount;

  return (
    <TvFrame
      view={view}
      right={
        <div className="flex flex-col items-end gap-2">
          <h1 className="font-display text-[56px] leading-none font-extrabold">{uk.screen.results}</h1>
          {focus && (
            <span className="text-[26px] font-extrabold tracking-[0.1em] text-fog uppercase">
              {uk.screen.cardOf(k, view.cards.length)}
            </span>
          )}
        </div>
      }
    >
      <p className="-mt-4 text-[32px] leading-snug font-bold text-fog">{view.question}</p>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_600px] gap-14">
        <div className="flex flex-col justify-center gap-8">
          {focus && r.focusStage && (
            <Spotlight
              key={focus.id}
              card={focus}
              stage={r.focusStage}
              players={players}
              pointsCorrect={view.settings.pointsCorrect}
              pointsFooled={view.settings.pointsFooled}
            />
          )}
        </div>
        <ul className="flex flex-col justify-center gap-3">
          {view.cards.map((c) => (
            <MiniCard key={c.id} card={c} players={players} focused={c.id === focus?.id} />
          ))}
        </ul>
      </div>
    </TvFrame>
  );
}

function Spotlight({
  card,
  stage,
  players,
  pointsCorrect,
  pointsFooled,
}: {
  card: ViewCard;
  stage: 'pending' | 'voters' | 'author';
  players: Map<string, PublicPlayer>;
  pointsCorrect: number;
  pointsFooled: number;
}) {
  // mount unflipped, then flip, so a card revealed in a single step still turns over
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (stage !== 'author') return setFlipped(false);
    const t = setTimeout(() => setFlipped(true), card.voters?.length ? 120 : 500);
    return () => clearTimeout(t);
  }, [stage, card.voters?.length]);

  const front: ViewCard = {
    ...card,
    authorId: undefined,
    voters: stage === 'pending' ? undefined : card.voters,
  };
  const voters = card.voters ?? [];
  const names = voters.map((id) => players.get(id)?.name ?? uk.leftGame);

  const believed = voters.length ? (
    <span className="block text-[30px] text-fog">
      {plural(voters.length, 'Повірив', 'Повірили', 'Повірили')}:{' '}
      <b className="text-cream">{names.join(', ')}</b>
    </span>
  ) : null;

  let caption: React.ReactNode;
  if (stage === 'pending') {
    caption = <span className="text-fog">Хто повірив?</span>;
  } else if (stage === 'voters' || !flipped) {
    caption = believed ?? <span className="text-fog">{uk.nobodyBelieved}</span>;
  } else if (card.authorId === null) {
    caption = voters.length ? (
      <>
        <span className="block text-[30px] text-fog">
          Вгадали: <b className="text-cream">{names.join(', ')}</b>
        </span>
        <span className="text-sun">+{pointsCorrect} кожному</span>
      </>
    ) : (
      <span className="text-sun">Правду не знайшов ніхто 😱</span>
    );
  } else {
    // "отримує" keeps the sentence gender-neutral
    const author = card.authorId ? players.get(card.authorId) : undefined;
    caption = (
      <>
        {believed}
        {author ? <b>{author.name}</b> : uk.leftGame}
        {voters.length ? (
          <span className="text-sun"> отримує +{voters.length * pointsFooled}</span>
        ) : (
          <span className="text-fog"> · ніхто не повірив</span>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className={`flip animate-pop ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-inner">
          <div className="flip-front">
            <AnswerCard
              card={front}
              players={players}
              scale="tv"
              highlight={stage === 'pending'}
              hideVoters
            />
          </div>
          <div className="flip-back">
            <AnswerCard
              card={card}
              players={players}
              scale="tv"
              pointsCorrect={pointsCorrect}
              pointsFooled={pointsFooled}
              hideVoters
            />
          </div>
        </div>
      </div>
      <div className="flex min-h-[112px] items-center gap-8">
        {stage === 'pending' ? (
          <span className="flex size-[104px] items-center justify-center rounded-full border-4 border-dashed border-edge font-display text-[56px] font-extrabold text-fog">
            ?
          </span>
        ) : voters.length ? (
          <VoteStack
            voterIds={voters}
            players={players}
            size={104}
            ring="var(--color-night)"
            animate={stage === 'voters'}
          />
        ) : null}
        <p className="text-[40px] leading-tight font-extrabold" aria-live="polite">
          {caption}
        </p>
      </div>
    </div>
  );
}

function MiniCard({
  card,
  players,
  focused,
}: {
  card: ViewCard;
  players: Map<string, PublicPlayer>;
  focused: boolean;
}) {
  const author = typeof card.authorId === 'string' ? players.get(card.authorId) : undefined;
  const isCorrect = card.authorId === null;
  return (
    <li
      className={`flex items-center gap-4 rounded-[20px] px-4 py-3 transition-all duration-300 ${
        isCorrect ? 'bg-sun text-ink' : card.revealed ? 'bg-velvet' : 'bg-dusk text-cream/80'
      } ${focused ? 'scale-[1.03] shadow-[inset_0_0_0_3px_var(--color-sun),0_0_0_4px_var(--color-night)]' : ''}`}
    >
      <span
        className={`flex size-11 flex-none items-center justify-center rounded-xl font-display text-xl font-extrabold ${
          isCorrect ? 'bg-ink text-sun' : 'bg-edge'
        }`}
      >
        {card.letter}
      </span>
      <span className="line-clamp-2 flex-1 text-[22px] leading-tight font-bold">{card.text}</span>
      {card.revealed && (
        <span className="flex flex-none items-center gap-2 text-[22px] font-extrabold">
          {card.voters && card.voters.length > 0 && <span className="tabular">{card.voters.length}×</span>}
          {isCorrect ? (
            <span
              role="img"
              aria-label={uk.correctAnswer}
              className="flex size-10 items-center justify-center rounded-full bg-ink text-sun"
            >
              <CheckIcon size={22} />
            </span>
          ) : author ? (
            <Avatar avatar={author.avatar} size={40} />
          ) : card.revealed === 'voters' ? (
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-fog text-fog">
              ?
            </span>
          ) : null}
        </span>
      )}
    </li>
  );
}
