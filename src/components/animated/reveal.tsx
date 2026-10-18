import type { ReactNode, CSSProperties, ElementType } from "react";
import { useReveal } from "@/hooks/use-reveal";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
}

/** Fade-in + slight rise + subtle 3D tilt-up, triggers once on scroll-in.
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
        transform: visible
          ? "perspective(1000px) translateY(0) rotateX(0deg) scale(1)"
          : "perspective(1000px) translateY(28px) rotateX(6deg) scale(.97)",
        transformOrigin: "center bottom",
        transition: `opacity 700ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform 850ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
