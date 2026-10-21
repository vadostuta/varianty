import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { MAX_ANSWER_LEN, QUESTIONS_PER_ROUND, ROUNDS } from '../../shared/types.ts';
import { uk } from '../i18n/uk.ts';
import { Button } from './Button.tsx';
import { CheckIcon } from './icons.tsx';

const LOGO = [
  ['В', '#FF8A3D', -4, 0],
  ['а', '#5AB0FF', 3, -8],
  ['р', '#9BE15D', -2, 0],
  ['і', '#B48CFF', 4, -5],
  ['а', '#FF6FB5', -3, 0],
  ['н', '#3DD6D0', 2, -8],
  ['т', '#FFC83D', -4, 0],
  ['и', '#FF8A3D', 3, -3],
] as const;

export function Logo({ size = 112 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Варіанти"
      className="flex items-end font-display leading-none font-black tracking-[-0.02em]"
      style={{ fontSize: size }}
    >
      {LOGO.map(([ch, color, rot, y], i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block"
          style={{ color, transform: `rotate(${rot}deg) translateY(${(y * size) / 112}px)` }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

export function Label({
  children,
  className = '',
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  const cls = `text-[13px] font-extrabold tracking-[0.1em] text-fog uppercase ${className}`;
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {children}
    </label>
  ) : (
    <span className={cls}>{children}</span>
  );
}

/** Round pills + question dots; the text label repeats the state for screen readers and clarity. */
export function Progress({
  round,
  qIndex,
  scale = 1,
  showLabel = true,
}: {
  round: number;
  qIndex: number;
  scale?: number;
  showLabel?: boolean;
}) {
  const dot = 14 * scale;
  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <span
          className="font-extrabold tracking-[0.12em] text-fog uppercase"
          style={{ fontSize: 13 * scale }}
        >
          {uk.progress(round, qIndex)}
        </span>
      )}
      <div
        role="img"
        aria-label={`Раунд ${round + 1} з ${ROUNDS}, питання ${qIndex + 1} з ${QUESTIONS_PER_ROUND}`}
        className="flex items-center"
        style={{ gap: 18 * scale }}
      >
        <div className="flex" style={{ gap: 6 * scale }}>
          {Array.from({ length: ROUNDS }, (_, r) => (
            <span
              key={r}
              className={`flex items-center rounded-full font-extrabold ${r === round ? 'bg-cream text-ink' : r < round ? 'bg-edge text-cream' : 'border-2 border-edge text-fog'}`}
              style={{ height: 28 * scale, padding: `0 ${12 * scale}px`, fontSize: 13 * scale }}
            >
              Р{r + 1}
            </span>
          ))}
        </div>
        <div className="flex items-center" style={{ gap: 8 * scale }}>
          {Array.from({ length: QUESTIONS_PER_ROUND }, (_, q) =>
            q === qIndex ? (
              <span
                key={q}
                className="rounded-full bg-sun"
                style={{
                  width: dot * 1.57,
                  height: dot * 1.57,
                  boxShadow: `0 0 0 ${4 * scale}px rgba(255,200,61,.25)`,
                }}
              />
            ) : (
              <span
                key={q}
                className={`rounded-full ${q < qIndex ? 'bg-cream' : 'border-2 border-edge'}`}
                style={{ width: dot, height: dot }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function QRCodeSvg({ text, size = 152 }: { text: string; size?: number }) {
  const path = useMemo(() => {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    let d = '';
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [text]);
  return (
    <svg
      role="img"
      aria-label="QR-код для входу в гру"
      width={size}
      height={size}
      viewBox={`0 0 ${path.n} ${path.n}`}
      shapeRendering="crispEdges"
    >
      <path fill="#1A1206" d={path.d} />
    </svg>
  );
}

/** QR on a cream tile (so cameras read it on a dark background) with the URL as text. */
export function QRBlock({
  url,
  size = 180,
  vertical = false,
  big = false,
}: {
  url: string;
  size?: number;
  vertical?: boolean;
  big?: boolean;
}) {
  const pretty = url.replace(/^https?:\/\//, '');
  return (
    <div
      className={`flex items-center ${vertical ? 'flex-col text-center' : ''}`}
      style={{ gap: big ? 36 : 24 }}
    >
      <div
        className="flex-none rounded-[22px] bg-cream"
        style={{ width: size, height: size, padding: size * 0.078 }}
      >
        <QRCodeSvg text={url} size={size * 0.844} />
      </div>
      <div className={`flex flex-col ${vertical ? 'items-center' : ''}`} style={{ gap: big ? 14 : 10 }}>
        <span
          className="font-extrabold tracking-[0.12em] text-fog uppercase"
          style={{ fontSize: big ? 24 : 13 }}
        >
          {uk.screen.scan}
        </span>
        <span className="font-display font-bold" style={{ fontSize: big ? 36 : 22 }}>
          {pretty.split('/').map((part, i) => (
            <span key={i} className="whitespace-nowrap">
              {i > 0 && '/'}
              {part}
              <wbr />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export function AnswerInput({
  value,
  onChange,
  label,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const left = MAX_ANSWER_LEN - value.length;
  const near = left <= 10;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={3}
        maxLength={MAX_ANSWER_LEN}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
        placeholder={uk.play.answerPlaceholder}
        aria-describedby={`${id}-count`}
        className="w-full resize-none rounded-phone border-2 border-edge bg-velvet px-4 py-3.5 text-lg leading-snug font-bold text-cream outline-none placeholder:text-fog/70 focus:border-sun focus:shadow-[0_0_0_4px_rgba(255,200,61,.2)]"
      />
      <span
        id={`${id}-count`}
        aria-live="polite"
        className={`self-end text-[13px] ${near ? 'font-extrabold text-coral' : 'font-bold text-fog'}`}
      >
        {value.length}/{MAX_ANSWER_LEN}
        {near && ` · ще ${left}`}
      </span>
    </div>
  );
}

export function StatusToast({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      role="status"
      className="flex w-fit animate-rise items-center gap-3 rounded-phone bg-velvet px-[18px] py-3.5 shadow-[inset_0_0_0_2px_var(--color-sun)]"
    >
      <span
        aria-hidden="true"
        className="flex size-8 flex-none items-center justify-center rounded-full bg-sun text-ink"
      >
        <CheckIcon size={18} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[17px] font-extrabold">{title}</span>
        {hint && <span className="text-sm text-fog">{hint}</span>}
      </span>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-3xl border-2 border-edge bg-dusk p-7 text-cream shadow-[0_12px_0_rgba(0,0,0,.4)] backdrop:bg-night/70"
    >
      <div className="flex flex-col gap-3.5">
        <h3 id={titleId} className="font-display text-[22px] font-bold">
          {title}
        </h3>
        <p className="text-[15px] leading-normal text-fog">{body}</p>
        <div className="mt-1.5 flex flex-wrap justify-end gap-3">
          <Button size="host" variant="secondary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button size="host" variant="danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** Full-screen centred message used for edge states. */
export function Centered({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center ${className}`}>
      {children}
    </div>
  );
}
