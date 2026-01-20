import { useEffect, useState } from "react";

export function useIsScrolling(idleMs = 120) {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let t: number | undefined;

    const onScroll = () => {
      if (!isScrolling) setIsScrolling(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIsScrolling(false), idleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMs, isScrolling]);

  return isScrolling;
}
