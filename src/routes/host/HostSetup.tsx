import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_SETTINGS, type Preset, type Settings, type View } from '../../../shared/types.ts';
import { Button } from '../../components/Button.tsx';
import { Label, Logo } from '../../components/misc.tsx';
import { ArrowIcon, CheckIcon, WarnIcon } from '../../components/icons.tsx';
import { uk } from '../../i18n/uk.ts';
import { fetchPresets, missingFields } from '../../lib/presets.ts';
import { getSocket, request } from '../../lib/socket.ts';
import { PlayerChip } from '../../components/Avatar.tsx';

const SETTINGS_KEY = 'varianty:settings';

function loadSettings(fallback: Settings): Settings {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return fallback;
  }
}

/** H1: pick a preset and timings, then create the game (→ lobby). */
export function HostSetup({ view }: { view: View }) {
  const [presets, setPresets] = useState<Preset[] | null>(null);
  const [presetId, setPresetId] = useState<string | null>(view.host?.presetId ?? null);
  const [settings, setSettings] = useState<Settings>(() => loadSettings(view.settings ?? DEFAULT_SETTINGS));
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPresets()
      .then((list) => {
        setPresets(list);
        setPresetId((id) =>
          id && list.some((p) => p.id === id) ? id : (list.find((p) => !missingFields(p))?.id ?? null),
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function create() {
    if (!presetId) return;
    setError('');
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* not important */
    }
    const res = await request((ack) =>
      getSocket().emit('host:action', { type: 'createGame', presetId, settings }, ack),
    );
    if (!res.ok) setError(res.error);
  }

  const set = (k: keyof Settings) => (v: number) => setSettings((s) => ({ ...s, [k]: v }));
  const ready = presets?.filter((p) => !missingFields(p)) ?? [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Logo size={48} />
          <h1 className="font-display text-2xl font-bold">{uk.host.setupTitle}</h1>
        </div>
        <Link
          to="/host/presets"
          className="flex items-center gap-1.5 font-extrabold text-sun hover:text-[#FFE08A]"
        >
          {uk.host.presets}
          <ArrowIcon />
        </Link>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-3">
          <Label>{uk.host.preset}</Label>
          {presets === null ? (
            <p className="text-fog">…</p>
          ) : (
            <div role="radiogroup" aria-label={uk.host.preset} className="grid gap-3 sm:grid-cols-2">
              {presets.map((p) => {
                const missing = missingFields(p);
                const on = p.id === presetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={missing > 0}
                    onClick={() => setPresetId(p.id)}
                    className={`flex flex-col gap-1.5 rounded-host px-4 py-3.5 text-left transition-colors ${
                      on
                        ? 'border-[3px] border-sun bg-ember'
                        : 'border-2 border-edge bg-velvet disabled:opacity-60'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-lg font-extrabold">
                      <span className="flex-1">{p.name}</span>
                      {on && (
                        <span className="flex size-6 items-center justify-center rounded-full bg-sun text-ink">
                          <CheckIcon size={14} />
                        </span>
                      )}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-sm font-bold ${missing ? 'text-coral' : 'text-fog'}`}
                    >
                      {missing ? <WarnIcon size={14} /> : null}
                      {missing
                        ? uk.presets.incomplete(missing)
                        : `10 питань · ${p.rounds[0][0].question.slice(0, 38)}…`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {presets && !ready.length && <p className="font-bold text-coral">{uk.host.noPresets}</p>}
        </section>

        <section className="flex flex-col gap-5 rounded-tv bg-dusk p-6">
          <NumberField
            label={uk.host.writingTime}
            suffix={uk.host.seconds}
            value={settings.writingSeconds}
            onChange={set('writingSeconds')}
            min={10}
            max={600}
            step={5}
          />
          <NumberField
            label={uk.host.votingTime}
            suffix={uk.host.seconds}
            value={settings.votingSeconds}
            onChange={set('votingSeconds')}
            min={10}
            max={600}
            step={5}
          />
          <div className="flex flex-col gap-3 border-t-2 border-edge pt-5">
            <Label>{uk.host.scoring}</Label>
            <NumberField
              label={uk.host.pointsCorrect}
              prefix="+"
              value={settings.pointsCorrect}
              onChange={set('pointsCorrect')}
              min={0}
              max={10}
            />
            <NumberField
              label={uk.host.pointsFooled}
              prefix="+"
              value={settings.pointsFooled}
              onChange={set('pointsFooled')}
              min={0}
              max={10}
            />
          </div>
        </section>
      </div>

      {view.players.length > 0 && (
        <section className="flex flex-col gap-3">
          <Label>{uk.players(view.players.length)}</Label>
          <ul className="flex flex-wrap gap-2.5">
            {view.players.map((p) => (
              <li key={p.id}>
                <PlayerChip player={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p role="alert" className="font-bold text-coral">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => void create()} disabled={!presetId}>
          {uk.host.create}
        </Button>
        <a
          href="/screen"
          target="_blank"
          rel="noreferrer"
          className="font-extrabold text-sun hover:text-[#FFE08A]"
        >
          {uk.host.openScreen} ↗
        </a>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`${label}: менше`}
          onClick={() => onChange(clamp(value - step))}
          className="size-10 rounded-[10px] border-2 border-edge bg-velvet text-lg font-extrabold"
        >
          −
        </button>
        <span className="flex h-12 items-center rounded-host border-2 border-edge bg-velvet px-2 focus-within:border-sun">
          {prefix && <span className="font-bold text-fog">{prefix}</span>}
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            onBlur={() => onChange(clamp(value))}
            className="w-14 bg-transparent text-center font-display text-lg font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="pr-1 font-bold text-fog">{suffix}</span>}
        </span>
        <button
          type="button"
          aria-label={`${label}: більше`}
          onClick={() => onChange(clamp(value + step))}
          className="size-10 rounded-[10px] border-2 border-edge bg-velvet text-lg font-extrabold"
        >
          +
        </button>
      </div>
    </div>
  );
}
