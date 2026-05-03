import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Square, Timer } from "lucide-react";
import { sounds } from "@/lib/sounds";

export interface QuestionTimerHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  stop: () => void;
}

interface Props {
  initialSeconds?: number;
  autoStart?: boolean;
  soundEnabled?: boolean;
  onTimeout?: () => void;
}

export const QuestionTimer = forwardRef<QuestionTimerHandle, Props>(function QuestionTimer(
  { initialSeconds = 30, autoStart = true, soundEnabled = true, onTimeout },
  ref
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart && initialSeconds > 0);
  // Manual override flag: once user interacts, auto behavior won't override
  const manualRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const firedTimeout = useRef(false);

  // Re-init when configured duration changes
  useEffect(() => {
    setSeconds(initialSeconds);
    setRunning(autoStart && initialSeconds > 0);
    manualRef.current = false;
    firedTimeout.current = false;
  }, [initialSeconds, autoStart]);

  // Audio follows timer state. Pause/resume preserves position; stop only on unmount or restart.
  useEffect(() => {
    if (running) {
      sounds.resumeTicking(() => {
        // audio fully ended (only meaningful for custom track)
      });
    } else {
      sounds.pauseTicking();
    }
  }, [running]);

  // Mute toggling without affecting playback position
  useEffect(() => {
    sounds.setTickingMuted(!soundEnabled);
  }, [soundEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => sounds.stopTicking();
  }, []);

  // Countdown
  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && !firedTimeout.current) {
      firedTimeout.current = true;
      setRunning(false);
      sounds.stopTicking();
      if (soundEnabled) sounds.timeout();
      onTimeout?.();
    }
    return () => {
      if (intervalRef.current) window.clearTimeout(intervalRef.current);
    };
  }, [running, seconds, onTimeout, soundEnabled]);

  useImperativeHandle(ref, () => ({
    pause: () => {
      manualRef.current = true;
      setRunning(false);
      sounds.stopTicking();
    },
    resume: () => {
      manualRef.current = true;
      if (seconds > 0) setRunning(true);
    },
    restart: () => {
      manualRef.current = true;
      firedTimeout.current = false;
      setSeconds(initialSeconds);
      setRunning(initialSeconds > 0);
    },
    stop: () => {
      manualRef.current = true;
      setRunning(false);
      sounds.stopTicking();
    },
  }), [seconds, initialSeconds]);

  const danger = seconds <= 5 && seconds > 0;

  if (initialSeconds <= 0) return null;

  const handlePause = () => {
    manualRef.current = true;
    setRunning(false);
    sounds.stopTicking();
  };
  const handleResume = () => {
    manualRef.current = true;
    if (seconds > 0) setRunning(true);
  };
  const handleRestart = () => {
    manualRef.current = true;
    firedTimeout.current = false;
    setSeconds(initialSeconds);
    setRunning(initialSeconds > 0);
  };
  const handleStop = () => {
    manualRef.current = true;
    setRunning(false);
    setSeconds(initialSeconds);
    firedTimeout.current = false;
    sounds.stopTicking();
  };

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
          onClick={running ? handlePause : handleResume}
          disabled={seconds === 0}
          aria-label={running ? "Pause timer" : "Resume timer"}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleRestart} aria-label="Restart timer">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleStop} aria-label="Stop timer">
          <Square className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});
