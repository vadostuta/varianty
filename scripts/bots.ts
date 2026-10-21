/**
 * Fake players for local testing: they join, answer and vote randomly.
 *   npm run bots -- 4            (4 bots against http://localhost:3000)
 *   npm run bots -- 4 http://192.168.1.23:3000
 */
import { io, type Socket } from 'socket.io-client';
import type { ClientToServer, ServerToClient } from '../shared/events.ts';
import type { View } from '../shared/types.ts';

const count = Math.min(10, Number(process.argv[2] ?? 4));
const url = process.argv[3] ?? 'http://localhost:3000';

const NAMES = ['Оля', 'Тарас', 'Марія', 'Андрій', 'Ірина', 'Богдан', 'Софія', 'Максим', 'Дарина', 'Остап'];
const FAKES = [
  'Пити вино з полином',
  'Спати головою на північ',
  'Носити на шиї зубчик часнику',
  'Слухати дзвони',
  'Прикладати холодну жабу',
  'Їсти сиру цибулю',
  'Сім',
  'Козу',
  'Близько двох тижнів',
  'Зеленого',
  'Гусака',
  'Святий Юрій',
  'Полтава',
];

const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const later = (minMs: number, maxMs: number, fn: () => void) =>
  setTimeout(fn, minMs + Math.random() * (maxMs - minMs));

function bot(i: number) {
  const socket: Socket<ServerToClient, ClientToServer> = io(url, { transports: ['websocket'] });
  const name = `${NAMES[i % NAMES.length]}🤖`;
  let answeredFor = '';
  let votedFor = '';

  socket.on('connect', () => {
    socket.emit('player:join', { name, avatar: null }, (res) => {
      console.log(res.ok ? `✓ ${name} у грі` : `✗ ${name}: ${res.error}`);
    });
  });

  socket.on('state', (v: View) => {
    const key = `${v.round}:${v.qIndex}`;
    if (v.phase === 'WRITING' && answeredFor !== key) {
      answeredFor = key;
      later(1500, 8000, () => socket.emit('player:answer', pick(FAKES), () => {}));
    }
    if (v.phase === 'VOTING' && votedFor !== key) {
      votedFor = key;
      const options = v.cards.filter((c) => c.id !== v.me?.ownCardId);
      if (options.length) later(1000, 6000, () => socket.emit('player:vote', pick(options).id, () => {}));
    }
  });

  socket.on('kicked', (reason) => {
    console.log(`${name}: ${reason}`);
    socket.close();
  });
}

for (let i = 0; i < count; i++) bot(i);
console.log(`${count} ботів підключаються до ${url}… (Ctrl+C щоб зупинити)`);
