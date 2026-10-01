import { useReveal } from "@/hooks/use-reveal";

/** Splits a heading into words and reveals each with a small stagger. */
export function WordReveal({
  text,
  className,
  delayBase = 0,
  per = 55,
}: {
  text: string;
  className?: string;
  delayBase?: number;
  per?: number;
}) {
  const { ref, visible } = useReveal<HTMLHeadingElement>();
  const words = (text ?? "").split(" ");
  return (
    <h2 ref={ref as any} className={className} aria-label={text}>
      {words.map((w, i) => (
        // A real space between words, so the heading reads as words (not
        // "Idon'tjustmakethingslookgood") to search engines and on copy-paste.
        <span key={i}>
          {i > 0 && " "}
          <span
            className="inline-block"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: `opacity 600ms cubic-bezier(.22,1,.36,1) ${delayBase + i * per}ms, transform 700ms cubic-bezier(.22,1,.36,1) ${delayBase + i * per}ms`,
              willChange: "opacity, transform",
            }}
          >
            {w}
          </span>
        </span>
      ))}
    </h2>
  );
}
