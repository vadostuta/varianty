import { AVATARS, type PublicPlayer, type ViewCard } from '../../shared/types.ts';
import { uk } from '../i18n/uk.ts';
import { Avatar, VoteStack } from './Avatar.tsx';
import { CheckIcon } from './icons.tsx';
import { PointsIcon, TruthSeal } from './decor.tsx';

export type CardScale = 'phone' | 'tv';

const S = {
  phone: {
    radius: 'rounded-phone',
    pad: 'px-4 py-3.5',
    min: 'min-h-[76px]',
    letter: 'size-10 text-[17px] rounded-xl',
    text: 'text-[19px]',
    head: 'text-[15px] py-2 px-3',
    av: 30,
    vote: 32,
    gap: 'gap-3.5',
    shadow: '0 6px 0',
  },
  tv: {
    radius: 'rounded-tv',
    pad: 'px-7 py-6',
    min: 'min-h-[132px]',
    letter: 'size-16 text-[28px] rounded-[18px]',
    text: 'text-[36px]',
    head: 'text-[26px] py-3 px-5',
    av: 48,
    vote: 56,
    gap: 'gap-6',
    shadow: '0 8px 0',
  },
} as const;

function Letter({
  letter,
  scale,
  tone,
}: {
  letter: string;
  scale: CardScale;
  tone: 'plain' | 'sun' | 'truth';
}) {
  const color =
    tone === 'sun' ? 'bg-sun text-ink' : tone === 'truth' ? 'bg-on-truth text-truth' : 'bg-edge text-cream';
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center font-display font-extrabold ${S[scale].letter} ${color}`}
    >
      {letter}
    </span>
  );
}

/**
 * One answer card in any state. States differ by shape too (dashed = yours, frame + tick = selected,
 * header strip = revealed author, sun fill + seal = correct), never by colour alone.
 */
export function AnswerCard({
  card,
  players,
  scale = 'phone',
  own = false,
  selectable = false,
  selected = false,
  onSelect,
  pointsFooled = 1,
  pointsCorrect = 2,
  highlight = false,
  animateVotes = false,
  hideVoters = false,
}: {
  card: ViewCard;
  players: Map<string, PublicPlayer>;
  scale?: CardScale;
  own?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  pointsFooled?: number;
  pointsCorrect?: number;
  highlight?: boolean;
  animateVotes?: boolean;
  hideVoters?: boolean;
}) {
  const s = S[scale];
  const voters = card.voters ?? [];
  const showVoters = !hideVoters && card.voters !== undefined;
  const voteBlock =
    showVoters &&
    (voters.length ? (
      <VoteStack
        voterIds={voters}
        players={players}
        size={s.vote}
        ring={card.authorId === null ? 'var(--color-truth)' : 'var(--color-velvet)'}
        animate={animateVotes}
      />
    ) : card.revealed ? (
      <span
        className={`flex-none rounded-full border-2 border-dashed border-edge px-4 py-1.5 font-extrabold text-fog ${scale === 'tv' ? 'text-xl' : 'text-sm'}`}
      >
        {uk.nobodyBelieved}
      </span>
    ) : null);
  const ring = highlight ? 'outline-4 outline-offset-4 outline-sun' : '';

  // revealed: correct
  if (card.authorId === null) {
    const drop = `${s.shadow} var(--color-truth-shade)`;
    return (
      <div
        className={`truth-glow overflow-hidden bg-truth text-on-truth ${s.radius} ${ring}`}
        style={{ boxShadow: drop, '--drop': drop } as React.CSSProperties}
      >
        <div className={`flex items-center gap-2 border-b-2 border-on-truth/15 font-extrabold ${s.head}`}>
          <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-full bg-on-truth text-truth"
            style={{ width: s.av, height: s.av }}
          >
            <TruthSeal size={s.av * 0.55} />
          </span>
          <span className="flex-1 tracking-[0.08em] uppercase">{uk.correctAnswer}</span>
          <span className="opacity-90">{uk.correctBonus(pointsCorrect)}</span>
        </div>
        <div className={`flex items-center ${s.gap} ${s.pad}`}>
          <Letter letter={card.letter} scale={scale} tone="truth" />
          <span className={`flex-1 leading-tight font-extrabold ${s.text}`}>{card.text}</span>
          {voteBlock}
        </div>
      </div>
    );
  }

  // revealed: a player's fake
  if (typeof card.authorId === 'string') {
    const author = players.get(card.authorId);
    const gain = voters.length * pointsFooled;
    return (
      <div
        className={`overflow-hidden bg-velvet ${s.radius} ${ring}`}
        style={{ boxShadow: `${s.shadow} rgba(0,0,0,.35)` }}
      >
        <div
          className={`flex items-center gap-2.5 font-extrabold text-ink ${s.head}`}
          style={{ background: author ? avatarColor(author.avatar) : 'var(--color-edge)' }}
        >
          {author ? (
            <Avatar avatar={author.avatar} size={s.av} style={{ background: 'var(--color-cream)' }} />
          ) : null}
          <span className={`flex-1 ${author ? '' : 'text-cream'}`}>
            {uk.fakeBy(author ? author.name : uk.leftGame)}
            {own && ` (${uk.yourAnswer.toLowerCase()})`}
          </span>
          {author && (
            <span
              className={`flex items-center gap-1 rounded-full bg-ink px-2.5 font-display font-extrabold text-sun ${scale === 'tv' ? 'h-11 text-2xl' : 'h-7 text-sm'}`}
            >
              <PointsIcon size={scale === 'tv' ? 20 : 11} />+{gain}
            </span>
          )}
        </div>
        <div className={`flex items-center ${s.gap} ${s.pad}`}>
          <Letter letter={card.letter} scale={scale} tone="plain" />
          <span className={`flex-1 leading-tight font-bold ${s.text}`}>{card.text}</span>
          {voteBlock}
        </div>
      </div>
    );
  }

  // the player's own card: display only, dashed
  if (own) {
    return (
      <div
        className={`flex items-center border-2 border-dashed border-fog bg-dusk ${s.gap} ${s.radius} ${s.pad} ${s.min} ${ring}`}
      >
        <Letter letter={card.letter} scale={scale} tone="plain" />
        <span className="flex flex-1 flex-col gap-1">
          <span className={`leading-tight font-bold ${s.text}`}>{card.text}</span>
          <span className="text-[13px] font-extrabold text-fog">{uk.yourAnswer}</span>
        </span>
        {voteBlock}
      </div>
    );
  }

  if (selectable) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`press flex w-full items-center text-left ${s.gap} ${s.radius} ${s.min} transition-colors ${
          selected
            ? 'border-[3px] border-sun bg-ember px-[15px] py-[13px] [--base:var(--color-sun-shade)] [--lift:6px]'
            : 'border-2 border-edge bg-velvet px-4 py-3.5 [--base:rgba(0,0,0,.35)] [--lift:6px]'
        }`}
      >
        <Letter letter={card.letter} scale={scale} tone={selected ? 'sun' : 'plain'} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={`leading-tight font-bold ${s.text}`}>{card.text}</span>
          {selected && <span className="text-[13px] font-extrabold text-sun">{uk.yourVote}</span>}
        </span>
        {selected ? (
          <span
            aria-hidden="true"
            className="flex size-7 flex-none animate-pop items-center justify-center rounded-full bg-sun text-ink"
          >
            <CheckIcon size={16} />
          </span>
        ) : (
          <span aria-hidden="true" className="size-[26px] flex-none rounded-full border-[2.5px] border-fog" />
        )}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center bg-velvet ${s.gap} ${s.radius} ${s.pad} ${s.min} ${ring}`}
      style={{ boxShadow: `${s.shadow} rgba(0,0,0,.35)` }}
    >
      <Letter letter={card.letter} scale={scale} tone={highlight ? 'sun' : 'plain'} />
      <span className={`flex-1 leading-tight font-bold ${s.text}`}>{card.text}</span>
      {voteBlock}
    </div>
  );
}

function avatarColor(i: number) {
  return (AVATARS[i] ?? AVATARS[0]).color;
}
