import type { ReactNode, CSSProperties } from "react";
import { useReveal } from "@/hooks/use-reveal";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: CSSProperties;
}

/** Fade-in + slight rise + subtle scale-up, triggers once on scroll-in.
 *  Uses only transform + opacity for cheap, jank-free animation. */
export function Reveal({ children, delay = 0, className, as = "div", style }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Tag = as as any;
  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(.97)",
        transition: `opacity 700ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform 800ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
