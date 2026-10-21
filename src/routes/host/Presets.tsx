import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Preset } from '../../../shared/types.ts';
import { Button } from '../../components/Button.tsx';
import { ConfirmDialog, Label } from '../../components/misc.tsx';
import { BackIcon, CheckIcon, PlusIcon, WarnIcon } from '../../components/icons.tsx';
import { uk } from '../../i18n/uk.ts';
import { emptyPreset, fetchPresets, missingFields } from '../../lib/presets.ts';
import { getSocket, request } from '../../lib/socket.ts';
import { useRole } from '../../lib/useGame.ts';

/** H8 preset list + H9 editor. */
export function Presets() {
  useRole('host');
  const [presets, setPresets] = useState<Preset[] | null>(null);
  const [editing, setEditing] = useState<Preset | null>(null);
  const [removing, setRemoving] = useState<Preset | null>(null);
  const [error, setError] = useState('');

  const reload = () =>
    fetchPresets()
      .then(setPresets)
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    document.title = 'Варіанти · Набори питань';
    void reload();
  }, []);

  async function save(p: Preset): Promise<Preset | null> {
    const res = await request<{ preset: Preset }>((ack) => getSocket().emit('presets:save', p, ack));
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    await reload();
    return res.preset;
  }

  async function remove(p: Preset) {
    const res = await request((ack) => getSocket().emit('presets:delete', p.id, ack));
    if (!res.ok) setError(res.error);
    await reload();
  }

  if (editing) {
    return (
      <Editor
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={async (p) => {
          const saved = await save(p);
          if (saved) setEditing(saved);
          return !!saved;
        }}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
      <Link
        to="/host"
        className="flex w-fit items-center gap-1.5 font-extrabold text-sun hover:text-[#FFE08A]"
      >
        <BackIcon /> {uk.presets.back}
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{uk.presets.title}</h1>
        <Button size="host" onClick={() => setEditing(emptyPreset())}>
          <PlusIcon /> {uk.presets.create}
        </Button>
      </header>
      {error && (
        <p role="alert" className="font-bold text-coral">
          {error}
        </p>
      )}
      {presets?.length === 0 && <p className="text-fog">{uk.presets.empty}</p>}
      <ul className="flex flex-col gap-3">
        {presets?.map((p) => {
          const missing = missingFields(p);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-host bg-dusk px-5 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-extrabold">{p.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold">
                  {missing ? (
                    <span className="flex items-center gap-1.5 text-coral">
                      <WarnIcon size={14} /> {uk.presets.incomplete(missing)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sun">
                      <CheckIcon size={14} /> {uk.presets.complete}
                    </span>
                  )}
                  {p.updatedAt > 0 && (
                    <span className="text-fog">
                      {uk.presets.updated(new Date(p.updatedAt).toLocaleDateString('uk-UA'))}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="host" variant="secondary" onClick={() => setEditing(structuredClone(p))}>
                  {uk.presets.edit}
                </Button>
                <Button
                  size="host"
                  variant="secondary"
                  onClick={() =>
                    void save({ ...structuredClone(p), id: '', name: p.name + uk.presets.copySuffix })
                  }
                >
                  {uk.presets.duplicate}
                </Button>
                <Button size="host" variant="danger" onClick={() => setRemoving(p)}>
                  {uk.presets.remove}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!removing}
        title={removing ? uk.presets.removeTitle(removing.name) : ''}
        body={uk.presets.removeBody}
        cancelLabel={uk.presets.removeNo}
        confirmLabel={uk.presets.removeYes}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void remove(removing);
          setRemoving(null);
        }}
      />
    </main>
  );
}

function Editor({
  initial,
  onClose,
  onSave,
}: {
  initial: Preset;
  onClose: () => void;
  onSave: (p: Preset) => Promise<boolean>;
}) {
  const [p, setP] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const missing = missingFields(p);

  const update = (r: number, q: number, field: 'question' | 'correctAnswer' | 'explanation', value: string) =>
    setP((prev) => {
      const next = structuredClone(prev);
      next.rounds[r][q][field] = value;
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setBusy(true);
    const ok = await onSave(p);
    setBusy(false);
    if (ok) setSavedAt(Date.now());
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8"
    >
      <button
        type="button"
        onClick={onClose}
        className="flex w-fit items-center gap-1.5 font-extrabold text-sun hover:text-[#FFE08A]"
      >
        <BackIcon /> {uk.presets.title}
      </button>
      <Field
        label={uk.presets.name}
        value={p.name}
        placeholder={uk.presets.namePlaceholder}
        onChange={(v) => setP({ ...p, name: v })}
        error={touched && !p.name.trim() ? 'Дай набору назву' : ''}
        big
      />
      {p.rounds.map((round, r) => (
        <section key={r} className="flex flex-col gap-4 rounded-tv bg-dusk p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{uk.presets.round(r)}</h2>
          <ol className="flex flex-col gap-4">
            {round.map((item, q) => (
              <li key={q} className="grid gap-3 md:grid-cols-[32px_minmax(0,1.4fr)_minmax(0,1fr)]">
                <span className="pt-8 font-display text-lg font-bold text-fog max-md:pt-0">{q + 1}</span>
                <Field
                  label={uk.presets.question}
                  value={item.question}
                  onChange={(v) => update(r, q, 'question', v)}
                  error={touched && !item.question.trim() ? uk.presets.needQuestion : ''}
                />
                <Field
                  label={uk.presets.answer}
                  value={item.correctAnswer}
                  onChange={(v) => update(r, q, 'correctAnswer', v)}
                  error={touched && !item.correctAnswer.trim() ? uk.presets.needAnswer : ''}
                />
                <Field
                  label={uk.presets.explanation}
                  value={item.explanation ?? ''}
                  placeholder={uk.presets.explanationPlaceholder}
                  onChange={(v) => update(r, q, 'explanation', v)}
                  className="md:col-span-2 md:col-start-2"
                  multiline
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t-2 border-edge bg-night/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button type="submit" disabled={busy}>
          {uk.presets.save}
        </Button>
        {missing > 0 ? (
          <span className="flex items-center gap-1.5 font-bold text-coral">
            <WarnIcon /> {uk.presets.incomplete(missing)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-bold text-sun">
            <CheckIcon /> {uk.presets.complete}
          </span>
        )}
        {savedAt > 0 && (
          <span key={savedAt} role="status" className="animate-fade font-bold text-fog">
            {uk.presets.saved}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  big = false,
  multiline = false,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  big?: boolean;
  multiline?: boolean;
  className?: string;
}) {
  const id = useId();
  const props = {
    id,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-err` : undefined,
    className: `w-full rounded-host border-2 bg-velvet px-3.5 font-semibold text-cream outline-none placeholder:text-fog/60 focus:border-sun ${
      error ? 'border-coral' : 'border-edge'
    } ${big ? 'h-14 text-xl font-extrabold' : multiline ? 'min-h-20 py-2.5 text-[15px]' : 'h-12 text-[15px]'}`,
  };
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? <textarea rows={2} {...props} /> : <input {...props} />}
      {error && (
        <span id={`${id}-err`} className="flex items-center gap-1.5 text-[13px] font-bold text-coral">
          <WarnIcon size={14} /> {error}
        </span>
      )}
    </div>
  );
}
