import { useEffect, useState } from "react";

/**
 * Keep `true` values deferred by a timeout so loaders don't flicker
 * when expensive work resolves immediately.
 */
export default function useDelayedFlag(active, delay = 120) {
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    if (!active) {
      setFlag(false);
      return undefined;
    }

    const handle = setTimeout(() => setFlag(true), delay);
    return () => clearTimeout(handle);
  }, [active, delay]);

  return flag;
}
