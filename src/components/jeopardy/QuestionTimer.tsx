import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { sounds } from "@/lib/sounds";

interface Props {
  initialSeconds?: number;
  /** When true, the timer is forced to stop and ticking ceases. */
  stopped?: boolean;
  /** When true (default), starts running automatically on mount/reset. */
  autoStart?: boolean;
  /** Whether sounds are globally enabled (controls ticking). */
  soundEnabled?: boolean;
  onTimeout?: () => void;
}

export function QuestionTimer({
  initialSeconds = 30,
  stopped = false,
  autoStart = true,
  soundEnabled = true,
  onTimeout,
}: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart && initialSeconds > 0 && !stopped);
  const ref = useRef<number | null>(null);
  const firedTimeout = useRef(false);

  // Reset when the configured duration changes (e.g. user updates settings)
  useEffect(() => {
    setSeconds(initialSeconds);
    setRunning(autoStart && initialSeconds > 0 && !stopped);
    firedTimeout.current = false;
  }, [initialSeconds, autoStart, stopped]);

  // External stop signal
  useEffect(() => {
    if (stopped) setRunning(false);
  }, [stopped]);

  // Manage ticking sound side-effect
  useEffect(() => {
    if (running && soundEnabled) {
      sounds.startTicking();
    } else {
      sounds.stopTicking();
    }
    return () => sounds.stopTicking();
  }, [running, soundEnabled]);

  useEffect(() => {
    if (running && seconds > 0) {
      ref.current = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && !firedTimeout.current) {
      firedTimeout.current = true;
      setRunning(false);
      sounds.stopTicking();
      if (soundEnabled) sounds.timeout();
      onTimeout?.();
    }
    return () => {
      if (ref.current) window.clearTimeout(ref.current);
    };
  }, [running, seconds, onTimeout, soundEnabled]);

  const reset = () => {
    setRunning(false);
    setSeconds(initialSeconds);
    firedTimeout.current = false;
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
          disabled={stopped || seconds === 0}
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
