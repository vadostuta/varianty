import { useEffect } from 'react';
import { useConnected, useGameView, useRole } from '../../lib/useGame.ts';
import { Centered } from '../../components/misc.tsx';
import { OfflineIcon } from '../../components/icons.tsx';
import { uk } from '../../i18n/uk.ts';
import { HostSetup } from './HostSetup.tsx';
import { HostControl } from './HostControl.tsx';

export function HostRoute() {
  useRole('host');
  const view = useGameView();
  const connected = useConnected();
  useEffect(() => {
    document.title = 'Варіанти · Ведучий';
  }, []);

  if (!view || view.role !== 'host') {
    return (
      <Centered>
        <OfflineIcon size={36} className="text-fog" />
        <p className="font-bold text-fog">{uk.play.reconnecting}</p>
      </Centered>
    );
  }
  return (
    <>
      {view.phase === 'IDLE' ? <HostSetup view={view} /> : <HostControl view={view} />}
      {!connected && (
        <div
          role="status"
          className="fixed right-4 bottom-4 flex items-center gap-2 rounded-full border-2 border-dashed border-fog bg-dusk px-4 py-2 font-bold text-fog"
        >
          <OfflineIcon size={18} /> {uk.play.reconnecting}
        </div>
      )}
    </>
  );
}
