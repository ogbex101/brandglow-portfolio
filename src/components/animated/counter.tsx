import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";

interface Parsed {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
}

function parse(value: string): Parsed | null {
  const m = String(value).match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const num = parseFloat(m[2]);
  const decimals = (m[2].split(".")[1] ?? "").length;
  return { prefix: m[1] ?? "", number: num, suffix: m[3] ?? "", decimals };
}

// easeOutCubic
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

interface Props {
  value: string;
  duration?: number;
  delay?: number;
  className?: string;
}

/** Counts up from 0 to the numeric part of `value`, with eased deceleration
 *  and a subtle "snap" scale bounce at the end. Fires once on scroll-in.
 *
 *  Until the count starts it shows the real value, so the server-rendered
 *  page, link previews, screen readers and anyone with reduced motion read
 *  "92%" rather than "0%". */
export function AnimatedCounter({ value, duration = 1600, delay = 0, className }: Props) {
  const { ref, visible } = useReveal<HTMLSpanElement>();
  const parsed = parse(value);
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false);
  const [snap, setSnap] = useState(false);

  useEffect(() => {
    if (!visible || !parsed) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setStarted(true);
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        setN(parsed.number * ease(t));
        if (t < 1) raf = requestAnimationFrame(step);
        else {
          setSnap(true);
          window.setTimeout(() => setSnap(false), 260);
        }
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [visible, parsed?.number, duration, delay]);

  if (!parsed)
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  const display = (started ? n : parsed.number).toFixed(parsed.decimals);
  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        transform: snap ? "scale(1.06)" : "scale(1)",
        transition: "transform 260ms cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}
