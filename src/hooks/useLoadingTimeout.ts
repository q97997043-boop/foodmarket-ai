import { useEffect, useState } from "react";

/**
 * Returns true after `ms` while `active` is true.
 * Resets when `active` becomes false.
 */
export function useLoadingTimeout(active: boolean, ms = 3000): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!active) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setTimedOut(true), ms);
    return () => clearTimeout(timer);
  }, [active, ms]);

  return timedOut;
}
