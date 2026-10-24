import { useEffect, useState } from 'react';

let cached: string | null = null;

/** Where to open the TV screen: the server's network-name URL, or this origin's /screen until it answers. */
export function useScreenUrl(): string {
  const [url, setUrl] = useState(cached ?? '/screen');
  useEffect(() => {
    if (cached) return;
    fetch('/api/info')
      .then((r) => r.json())
      .then((info: { screenUrl?: string }) => {
        if (!info.screenUrl) return;
        cached = info.screenUrl;
        setUrl(info.screenUrl);
      })
      .catch(() => {
        /* the relative link still works */
      });
  }, []);
  return url;
}
