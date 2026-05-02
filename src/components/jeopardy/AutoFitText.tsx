import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  /** Optional dependency that should trigger a refit (e.g. grid size). */
  refitKey?: string | number;
  fontFamily?: string;
  /** When true, allow text to wrap across multiple lines before shrinking. */
  multiline?: boolean;
}

/**
 * Renders text starting at maxFontSize and shrinks toward minFontSize only
 * when it overflows the container. When `multiline` is true, the text is
 * allowed to wrap across multiple lines (whole words) before shrinking; a
 * single long word will shrink instead of being broken.
 */
export function AutoFitText({
  text,
  className = "",
  minFontSize = 8,
  maxFontSize = 64,
  refitKey,
  fontFamily,
  multiline = false,
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

      const fits = (size: number) => {
        span.style.fontSize = `${size}px`;
        return span.scrollWidth <= cw && span.scrollHeight <= ch;
      };

      if (fits(maxFontSize)) {
        setFontSize(maxFontSize);
        return;
      }

      let lo = minFontSize;
      let hi = maxFontSize;
      let best = minFontSize;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(mid)) {
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
  }, [text, minFontSize, maxFontSize, refitKey, fontFamily, multiline]);

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
          whiteSpace: multiline ? "normal" : "nowrap",
          wordBreak: "normal",
          overflowWrap: multiline ? "break-word" : "normal",
          display: "inline-block",
          lineHeight: 1.1,
          maxWidth: "100%",
          textAlign: "center",
        }}
      >
        {text}
      </span>
    </div>
  );
}

