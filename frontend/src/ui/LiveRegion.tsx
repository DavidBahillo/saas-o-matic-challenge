// Región aria-live="polite" que anuncia tras 500 ms de calma (V7, RF33).
import { useEffect, useState } from 'react';

export const LIVE_REGION_DELAY_MS = 500;

export function LiveRegion({ message }: { message: string }) {
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setAnnounced(message); }, LIVE_REGION_DELAY_MS);
    return () => { clearTimeout(timer); };
  }, [message]);
  return (
    <div aria-live="polite" className="sr-only">
      {announced}
    </div>
  );
}
