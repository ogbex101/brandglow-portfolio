import { useRef, type MouseEvent } from "react";

interface TiltOptions {
  max?: number;
  scale?: number;
}

/** Lightweight pointer-driven 3D tilt: rotates the element toward the cursor
 *  and adds a subtle scale + glare-free depth via perspective. CSS-only cost
 *  (a single inline transform), no animation library. */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  max = 10,
  scale = 1.02,
}: TiltOptions = {}) {
  const ref = useRef<T>(null);

  const onMouseMove = (e: MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * max * 2;
    const rotateX = (0.5 - py) * max * 2;
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    style: { transition: "transform 300ms cubic-bezier(.22,1,.36,1)", willChange: "transform" },
  };
}
