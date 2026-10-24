import { Link, Route, Routes } from 'react-router-dom';
import { Play } from './routes/play/Play.tsx';
import { Screen } from './routes/screen/Screen.tsx';
import { HostRoute } from './routes/host/HostRoute.tsx';
import { Presets } from './routes/host/Presets.tsx';
import { Centered, Logo } from './components/misc.tsx';
import { uk } from './i18n/uk.ts';
import { useTheme } from './lib/theme.ts';
import { Bat, Moon, Spooky } from './components/decor.tsx';

export function App() {
  // subscribing here re-renders the whole tree on a theme switch, which picks up the new `uk`
  useTheme();
  return (
    <Routes>
      <Route path="/play" element={<Play />} />
      <Route path="/screen" element={<Screen />} />
      <Route path="/host" element={<HostRoute />} />
      <Route path="/host/presets" element={<Presets />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

function Home() {
  const links = [
    { to: '/play', title: 'Я гравець', hint: 'Телефон або планшет' },
    { to: '/host', title: 'Я ведучий', hint: 'Ноутбук: налаштувати й вести гру' },
    { to: '/screen', title: 'Екран для ТВ', hint: 'Відкрий на телевізорі чи проєкторі' },
  ];
  return (
    <Centered className="relative isolate overflow-hidden">
      <Spooky>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <Moon size={96} className="absolute top-6 right-6" />
          <Bat
            width={70}
            className="absolute top-28 right-32"
            style={{ animation: 'vflap 2.4s ease-in-out infinite' }}
          />
        </div>
      </Spooky>
      <Logo size={64} />
      <p className="text-lg font-bold">{uk.tagline}</p>
      <nav className="flex w-full max-w-sm flex-col gap-3">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="press flex flex-col rounded-phone border-2 border-edge bg-velvet px-5 py-4 text-left [--lift:5px]"
          >
            <span className="text-lg font-extrabold">{l.title}</span>
            <span className="text-sm text-fog">{l.hint}</span>
          </Link>
        ))}
      </nav>
    </Centered>
  );
}
