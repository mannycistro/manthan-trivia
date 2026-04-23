import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

interface Props {
  initialSeconds?: number;
}

export function QuestionTimer({ initialSeconds = 30 }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  // Reset when the configured duration changes (e.g. user updates settings)
  useEffect(() => {
    setSeconds(initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0) {
      setRunning(false);
    }
    return () => {
      if (ref.current) window.clearTimeout(ref.current);
    };
  }, [running, seconds]);

  const reset = () => {
    setRunning(false);
    setSeconds(initialSeconds);
  };

  const danger = seconds <= 5 && seconds > 0;

  if (initialSeconds <= 0) return null;

  return (
    <div className="flex items-center gap-3 bg-card/80 border-2 border-border rounded-xl px-4 py-2">
      <Timer className="w-5 h-5 text-primary" />
      <span
        className={`font-display text-3xl tabular-nums ${
          danger ? "text-destructive animate-pulse" : "text-primary"
        }`}
      >
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Pause timer" : "Start timer"}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={reset} aria-label="Reset timer">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
