import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight portal helper. Lazily creates a detached div and appends it
 * to #portal-root, cleaning up after itself when unmounted.
 */
export default function Portal({ children }) {
  const hostRef = useRef(null);

  if (!hostRef.current) {
    hostRef.current = document.createElement("div");
  }

  useEffect(() => {
    const root = document.getElementById("portal-root");
    const host = hostRef.current;

    if (!root) {
      console.warn("Portal root element (#portal-root) not found.");
      return undefined;
    }

    root.appendChild(host);
    return () => {
      root.removeChild(host);
    };
  }, []);

  return createPortal(children, hostRef.current);
}
