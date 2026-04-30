import { Category, KeyBindings, Question } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { QuestionTimer, QuestionTimerHandle } from "./QuestionTimer";
import { sounds } from "@/lib/sounds";
import { playBackground } from "@/lib/sounds";

interface Props {
  category: Category;
  question: Question;
  soundEnabled: boolean;
  currency: string;
  timerSeconds: number;
  keyBindings: KeyBindings;
  onBack: () => void;
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {}
  return null;
}

function normalizeKey(e: KeyboardEvent): string {
  if (e.code === "Space" || e.key === " ") return "Space";
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

function keysMatch(pressed: string, bound: string): boolean {
  if (!bound) return false;
  const a = pressed === " " ? "Space" : pressed;
  const b = bound === " " ? "Space" : bound;
  return a.toLowerCase() === b.toLowerCase();
}

type Feedback = null | "correct" | "wrong";

export function QuestionView({
  category,
  question,
  soundEnabled,
  currency,
  timerSeconds,
  keyBindings,
  onBack,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timerRef = useRef<QuestionTimerHandle>(null);

  // Stop ticking when leaving
  useEffect(() => {
    return () => {
      sounds.stopTicking();
    };
  }, []);

  const reveal = useCallback(() => {
    setRevealed((r) => {
      if (!r && soundEnabled) sounds.reveal();
      return true;
    });
    timerRef.current?.stop();
    sounds.stopTicking();
  }, [soundEnabled]);

  const markCorrect = useCallback(() => {
    if (soundEnabled) sounds.correct();
    setFeedback("correct");
    timerRef.current?.stop();
    sounds.stopTicking();
    setRevealed(true);
  }, [soundEnabled]);

  const markWrong = useCallback(() => {
    if (soundEnabled) sounds.wrong();
    setFeedback("wrong");
    // Critical fix: stop timer and ticking on wrong answer
    timerRef.current?.stop();
    sounds.stopTicking();
  }, [soundEnabled]);

  const back = () => {
    if (soundEnabled) sounds.click();
    sounds.stopTicking();
    onBack();
  };

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 1200);
    return () => window.clearTimeout(t);
  }, [feedback]);

  // Keyboard host controls (hidden from UI but functional)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const k = normalizeKey(e);
      if (keysMatch(k, keyBindings.correct)) {
        e.preventDefault();
        markCorrect();
      } else if (keysMatch(k, keyBindings.wrong)) {
        e.preventDefault();
        markWrong();
      } else if (keysMatch(k, keyBindings.reveal)) {
        e.preventDefault();
        reveal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyBindings, markCorrect, markWrong, reveal]);

  const renderMedia = () => {
    if (question.mediaType === "none" || !question.mediaUrl) return null;
    if (question.mediaType === "image") {
      return (
        <img
          src={question.mediaUrl}
          alt="Question media"
          className="max-h-[40vh] mx-auto rounded-xl border-2 border-border shadow-glow"
        />
      );
    }
    if (question.mediaType === "audio") {
      return <audio src={question.mediaUrl} controls className="w-full max-w-xl mx-auto" />;
    }
    if (question.mediaType === "video") {
      const yt = youtubeEmbedUrl(question.mediaUrl);
      if (yt) {
        return (
          <div className="aspect-video max-w-3xl mx-auto rounded-xl overflow-hidden border-2 border-border shadow-glow">
            <iframe
              src={yt}
              title="Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <video
          src={question.mediaUrl}
          controls
          className="max-h-[40vh] mx-auto rounded-xl border-2 border-border shadow-glow"
        />
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in min-h-[80vh] flex flex-col relative">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button variant="secondary" size="lg" onClick={back} className="font-bold">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Board
        </Button>
        <div className="flex items-center gap-3">
          <span className="font-display text-xl md:text-2xl text-primary uppercase">
            {category.title}
          </span>
          <span className="font-display text-3xl md:text-4xl gold-gradient">
            {currency}
            {question.value}
          </span>
        </div>
        <QuestionTimer
          ref={timerRef}
          initialSeconds={timerSeconds}
          autoStart
          soundEnabled={soundEnabled}
          onTimeout={() => {}}
        />
      </div>

      {/* Main panel — player-facing only (no host buttons or shortcut hints) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-accent/90 border-4 border-primary/40 rounded-3xl p-6 md:p-12 shadow-glow text-center max-h-[75vh] overflow-y-auto">
          {renderMedia() && <div className="mb-6">{renderMedia()}</div>}

          <p className="font-display auto-shrink text-white text-shadow-jeopardy uppercase break-words">
            {question.question}
          </p>

          {revealed && (
            <div className="mt-8 pt-8 border-t-2 border-primary/40 animate-reveal">
              <p className="text-sm uppercase tracking-widest text-primary mb-2">Answer</p>
              <p className="font-display auto-shrink gold-gradient break-words">
                {question.answer}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div
            className={`flex flex-col items-center justify-center rounded-full w-48 h-48 md:w-64 md:h-64 border-8 shadow-2xl ${
              feedback === "correct"
                ? "bg-green-500/20 border-green-400 text-green-300"
                : "bg-destructive/20 border-destructive text-destructive"
            }`}
          >
            {feedback === "correct" ? (
              <Check className="w-32 h-32 md:w-40 md:h-40" strokeWidth={4} />
            ) : (
              <X className="w-32 h-32 md:w-40 md:h-40" strokeWidth={4} />
            )}
            <span className="font-display text-2xl md:text-3xl uppercase mt-1">
              {feedback === "correct" ? "Correct!" : "Wrong!"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
