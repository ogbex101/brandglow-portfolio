import { useEffect, useRef, useState } from "react";

/** Fire once when the element scrolls into view. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { setVisible(true); io.disconnect(); break; }
      }
    }, { threshold: 0.2, rootMargin: "0px 0px -60px 0px", ...options });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, options]);
  return { ref, visible };
}
