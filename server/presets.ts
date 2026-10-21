import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Preset } from '../shared/types.ts';
import { SAMPLE_PRESET } from './samplePreset.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '../data');
const FILE = path.join(DATA_DIR, 'presets.json');

export async function loadPresets(): Promise<Preset[]> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Preset[];
  } catch {
    const presets = [SAMPLE_PRESET];
    await savePresets(presets);
    return presets;
  }
}

export async function savePresets(presets: Preset[]): Promise<void> {
  await writeJsonAtomic(FILE, presets);
}

/** Inserts or updates; blank questions are allowed here (the editor shows them as incomplete). */
export async function upsertPreset(input: Preset): Promise<Preset> {
  const presets = await loadPresets();
  const preset: Preset = {
    id: input.id || randomUUID(),
    name: input.name.trim() || 'Без назви',
    updatedAt: Date.now(),
    rounds: input.rounds.map((r) =>
      r.map((q) => ({
        question: q.question.trim(),
        correctAnswer: q.correctAnswer.trim(),
        explanation: q.explanation?.trim() ?? '',
      })),
    ),
  };
  const i = presets.findIndex((p) => p.id === preset.id);
  if (i >= 0) presets[i] = preset;
  else presets.push(preset);
  await savePresets(presets);
  return preset;
}

export async function deletePreset(id: string): Promise<void> {
  await savePresets((await loadPresets()).filter((p) => p.id !== id));
}

export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, file);
}

export { DATA_DIR };
