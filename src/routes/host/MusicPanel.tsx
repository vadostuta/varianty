import { useEffect, useId, useState } from 'react';
import { STATIONS, stationOf, type MusicSettings, type MusicView } from '../../../shared/music.ts';
import { Label } from '../../components/misc.tsx';
import { CheckIcon } from '../../components/icons.tsx';
import { Vinyl } from '../../components/Vinyl.tsx';
import { uk } from '../../i18n/uk.ts';
import { setMusic, useMusic } from '../../lib/music.ts';

function statusText(m: MusicView): string {
  if (!m.on) return uk.music.off;
  if (m.status === 'idle') return uk.music.loading;
  return uk.music[m.status];
}

/** Background music for the room. It plays on the TV screen; this only steers it. */
export function MusicPanel({
  compact = false,
  onError,
}: {
  compact?: boolean;
  onError: (e: string) => void;
}) {
  const music = useMusic();
  const volumeId = useId();
  // the slider moves locally and the server catches up, so dragging stays smooth
  const [volume, setVolume] = useState<number | null>(null);

  async function change(patch: Partial<MusicSettings>) {
    const res = await setMusic(patch);
    if (!res.ok) onError(res.error);
  }

  useEffect(() => {
    if (volume === null) return;
    const t = setTimeout(() => void change({ volume }), 120);
    return () => clearTimeout(t);
  }, [volume]);

  if (!music) return null;
  const playing = music.on && music.status === 'playing';
  const warn = music.on && ['noScreen', 'blocked', 'error'].includes(music.status);

  return (
    <section className={`flex flex-col gap-4 rounded-tv bg-dusk ${compact ? 'p-5' : 'p-6'}`}>
      <div className="flex items-center gap-4">
        <Vinyl size={compact ? 64 : 84} playing={playing} arm />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label>{uk.music.title}</Label>
          <span
            role="status"
            className={`text-sm leading-snug font-bold ${warn ? 'text-coral' : playing ? 'text-sun' : 'text-fog'}`}
          >
            {compact && music.on ? `${stationOf(music.stationId).title} · ` : ''}
            {statusText(music)}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={music.on}
          aria-label={music.on ? uk.music.turnOff : uk.music.turnOn}
          onClick={() => void change({ on: !music.on })}
          className={`relative h-8 w-14 flex-none rounded-full border-2 transition-colors ${
            music.on ? 'border-sun bg-sun' : 'border-edge bg-velvet'
          }`}
        >
          <span
            className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-[left] duration-200 ${
              music.on ? 'left-[28px] bg-ink' : 'left-[3px] bg-fog'
            }`}
          />
        </button>
      </div>

      <div role="radiogroup" aria-label={uk.music.station} className="flex flex-col gap-2">
        {!compact && <Label>{uk.music.station}</Label>}
        {STATIONS.map((s) => {
          const on = s.id === music.stationId;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => void change(on ? { on: true } : { stationId: s.id, on: true })}
              className={`flex items-center gap-3 rounded-host text-left transition-colors ${
                compact ? 'px-3 py-2' : 'px-4 py-3'
              } ${on ? 'border-2 border-sun bg-ember' : 'border-2 border-edge bg-velvet hover:border-fog/50'}`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-extrabold">{s.title}</span>
                {!compact && <span className="truncate text-sm font-bold text-fog">{s.hint}</span>}
              </span>
              {on && (
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-sun text-ink">
                  <CheckIcon size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={volumeId} className="text-sm font-bold text-fog">
          {uk.music.volume}
        </label>
        <input
          id={volumeId}
          type="range"
          min={0}
          max={100}
          step={5}
          value={volume ?? music.volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 accent-sun"
        />
        <span className="w-9 text-right font-display text-sm font-bold tabular">
          {volume ?? music.volume}
        </span>
      </div>
    </section>
  );
}
