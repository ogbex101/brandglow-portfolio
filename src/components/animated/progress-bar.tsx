import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";

interface Props {
  value: number;
  delay?: number;
  className?: string;
}

/** Progress bar with overshoot-and-settle for a tactile "snap into place" feel.
 *  Renders at its real width until the animation starts, so the server HTML
 *  and reduced-motion visitors never see an empty bar. */
export function AnimatedProgress({ value, delay = 0, className }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [w, setW] = useState(value);
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setW(0);
    const t1 = window.setTimeout(() => setW(Math.min(100, value * 1.08)), delay);
    const t2 = window.setTimeout(() => setW(value), delay + 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible, value, delay]);
  return (
    <div
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className ?? ""}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
        style={{
          width: `${w}%`,
          transition: "width 900ms cubic-bezier(.22,1.2,.36,1)",
        }}
      />
    </div>
  );
}
