import { useEffect, useRef } from "react";

const THROTTLE_MS = 30_000;

export function useRefreshOnFocus(onFocus: () => void) {
  const lastRefresh = useRef(0);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefresh.current < THROTTLE_MS) return;

      lastRefresh.current = now;
      onFocus();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [onFocus]);
}
