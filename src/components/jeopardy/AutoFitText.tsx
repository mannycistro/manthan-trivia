import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  /** Optional dependency that should trigger a refit (e.g. grid size). */
  refitKey?: string | number;
  fontFamily?: string;
}

/**
 * Renders text on a single line, starting at maxFontSize (the user-defined
 * base) and only shrinking down toward minFontSize when it would overflow.
 * Never scales above maxFontSize.
 */
export function AutoFitText({
  text,
  className = "",
  minFontSize = 8,
  maxFontSize = 64,
  refitKey,
  fontFamily,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const span = textRef.current;
    if (!container || !span) return;

    let raf = 0;
    const fit = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;

      // Try the base size first; only shrink if needed.
      span.style.fontSize = `${maxFontSize}px`;
      if (span.scrollWidth <= cw && span.scrollHeight <= ch) {
        setFontSize(maxFontSize);
        return;
      }

      let lo = minFontSize;
      let hi = maxFontSize;
      let best = minFontSize;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        span.style.fontSize = `${mid}px`;
        const fits = span.scrollWidth <= cw && span.scrollHeight <= ch;
        if (fits) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      span.style.fontSize = `${best}px`;
      setFontSize(best);
    };

    raf = requestAnimationFrame(fit);
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [text, minFontSize, maxFontSize, refitKey, fontFamily]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <span
        ref={textRef}
        className={className}
        style={{
          fontSize,
          fontFamily,
          whiteSpace: "nowrap",
          display: "inline-block",
          lineHeight: 1.1,
          maxWidth: "100%",
          textOverflow: "ellipsis",
          overflow: "hidden",
        }}
      >
        {text}
      </span>
    </div>
  );
}

