import { useState, useEffect } from 'react';

/**
 * Hook for smooth enter & exit CSS animations for modals and overlays.
 * Keeps DOM element mounted while exit transition plays.
 */
export function useAnimatePresence(isOpen, duration = 250) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isMounted, setIsMounted] = useState(isOpen);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    let timer1, timer2;
    if (isOpen) {
      timer1 = setTimeout(() => setIsMounted(true), 20);
    } else {
      timer1 = setTimeout(() => setIsMounted(false), 0);
      timer2 = setTimeout(() => setShouldRender(false), duration);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, duration]);

  return { shouldRender, isMounted };
}
