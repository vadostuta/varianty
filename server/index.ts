import express from 'express';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { Server, type Socket } from 'socket.io';
import type { ClientToServer, ServerToClient } from '../shared/events.ts';
import { AVATARS, type GameState, type Role } from '../shared/types.ts';
import { GameError, initialState, reduce, validatePreset, type GameAction } from './game.ts';
import { buildView } from './views.ts';
import { deletePreset, loadPresets, upsertPreset } from './presets.ts';
import { restoreState, snapshotState } from './persistence.ts';
import { createPhaseTimer } from './timer.ts';

const PORT = Number(process.env.PORT ?? 3000);
const PROD = process.env.NODE_ENV === 'production';
// in dev the phones open the Vite server; in prod Express serves everything
const CLIENT_PORT = Number(process.env.CLIENT_PORT ?? (PROD ? PORT : 5173));

const lanIp = findLanIp();
const joinUrl = `http://${lanIp}:${CLIENT_PORT}/play`;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(httpServer, {
  cors: PROD ? undefined : { origin: true },
});

interface SocketData {
  role?: Role;
  playerId?: string;
}

let state: GameState = restoreState() ?? initialState();
// nobody is connected right after a (re)start
for (const p of state.players) p.connected = false;

const timer = createPhaseTimer(() => dispatch({ type: 'timerEnd' }));

function dispatch(action: GameAction): void {
  const prevIds = new Set(state.players.map((p) => p.id));
  const next = reduce(state, action, Date.now());
  if (next === state) return;
  state = next;
  if (action.type === 'kick' || action.type === 'abort') {
    const reason = action.type === 'kick' ? 'kicked' : 'aborted';
    for (const s of io.sockets.sockets.values()) {
      if (
        s.data.playerId &&
        prevIds.has(s.data.playerId) &&
        !state.players.some((p) => p.id === s.data.playerId)
      ) {
        s.emit('kicked', reason);
        s.data.playerId = undefined;
        s.data.role = undefined;
      }
    }
  }
  timer.sync(state);
  snapshotState(state);
  broadcast();
}

function broadcast(): void {
  const now = Date.now();
  for (const s of io.sockets.sockets.values()) sendState(s, now);
  const taken = new Set(state.players.map((p) => p.avatar));
  io.emit(
    'freeAvatars',
    AVATARS.map((_, i) => i).filter((i) => !taken.has(i)),
  );
}

function sendState(
  s: Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>,
  now = Date.now(),
) {
  const role = s.data.role;
  if (!role) return;
  s.emit('state', buildView(state, role, { now, joinUrl, playerId: s.data.playerId }));
}

/** Reports an error to the client: game rule errors verbatim, everything else generic. */
function fail(ack: unknown, err: unknown): void {
  if (!(err instanceof GameError)) console.error(err);
  if (typeof ack === 'function') {
    ack({ ok: false, error: err instanceof GameError ? err.message : 'Щось пішло не так' });
  }
}

io.on('connection', (socket) => {
  socket.on('hello', (role) => {
    if (role !== 'host' && role !== 'screen') return;
    socket.data.role = role;
    sendState(socket);
  });

  socket.on('player:join', async ({ name, avatar }, ack) => {
    try {
      const id = randomUUID();
      const token = randomBytes(16).toString('hex');
      dispatch({
        type: 'join',
        id,
        token,
        name: String(name ?? ''),
        avatar: typeof avatar === 'number' ? avatar : null,
      });
      socket.data.role = 'player';
      socket.data.playerId = id;
      ack({ ok: true, playerId: id, token });
      sendState(socket);
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('player:resume', async ({ playerId, token }, ack) => {
    try {
      const p = state.players.find((x) => x.id === playerId && x.token === token);
      if (!p) throw new GameError('Місце в грі не знайдено');
      socket.data.role = 'player';
      socket.data.playerId = p.id;
      ack({ ok: true });
      dispatch({ type: 'setConnected', playerId: p.id, connected: true });
      sendState(socket);
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('player:answer', async (text, ack) => {
    try {
      const playerId = requirePlayer(socket);
      dispatch({ type: 'answer', playerId, text: String(text ?? '') });
      ack({ ok: true });
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('player:vote', async (cardId, ack) => {
    try {
      const playerId = requirePlayer(socket);
      dispatch({ type: 'vote', playerId, cardId: String(cardId) });
      ack({ ok: true });
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('host:action', async (a, ack) => {
    try {
      if (socket.data.role !== 'host') throw new GameError('Лише для ведучого');
      if (a.type === 'createGame') {
        const preset = (await loadPresets()).find((p) => p.id === a.presetId);
        if (!preset) throw new GameError('Набір питань не знайдено');
        validatePreset(preset);
        dispatch({ type: 'createGame', preset, settings: a.settings });
      } else {
        dispatch(a);
      }
      ack({ ok: true });
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('presets:list', async (ack) => {
    try {
      ack({ ok: true, presets: await loadPresets() });
    } catch (err) {
      fail(ack, err);
    }
  });
  socket.on('presets:save', async (p, ack) => {
    try {
      if (socket.data.role !== 'host') throw new GameError('Лише для ведучого');
      ack({ ok: true, preset: await upsertPreset(p) });
    } catch (err) {
      fail(ack, err);
    }
  });
  socket.on('presets:delete', async (id, ack) => {
    try {
      if (socket.data.role !== 'host') throw new GameError('Лише для ведучого');
      await deletePreset(id);
      ack({ ok: true });
    } catch (err) {
      fail(ack, err);
    }
  });

  socket.on('disconnect', () => {
    const pid = socket.data.playerId;
    if (!pid) return;
    const stillHere = [...io.sockets.sockets.values()].some((s) => s !== socket && s.data.playerId === pid);
    if (!stillHere) dispatch({ type: 'setConnected', playerId: pid, connected: false });
  });

  const taken = new Set(state.players.map((p) => p.avatar));
  socket.emit(
    'freeAvatars',
    AVATARS.map((_, i) => i).filter((i) => !taken.has(i)),
  );
});

function requirePlayer(
  socket: Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>,
): string {
  const pid = socket.data.playerId;
  if (!pid || !state.players.some((p) => p.id === pid)) throw new GameError('Тебе немає в грі');
  return pid;
}

app.get('/api/info', (_req, res) => {
  res.json({ joinUrl });
});

const distDir = path.resolve(import.meta.dirname, '../dist');
if (PROD && existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!socket\.io|api).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// a timer may have expired while the server was down
timer.sync(state);
if (state.timer?.endsAt && state.timer.endsAt <= Date.now()) dispatch({ type: 'timerEnd' });

httpServer.listen(PORT, '0.0.0.0', () => {
  const base = `http://${lanIp}:${CLIENT_PORT}`;
  console.log(`\n  Варіанти запущено`);
  console.log(`  Ведучий:  ${base}/host`);
  console.log(`  Екран:    ${base}/screen`);
  console.log(`  Гравці:   ${joinUrl}\n`);
});

function findLanIp(): string {
  const candidates: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === 'IPv4' && !a.internal) candidates.push(a.address);
    }
  }
  return (
    candidates.find((a) => /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(a)) ?? candidates[0] ?? 'localhost'
  );
}
