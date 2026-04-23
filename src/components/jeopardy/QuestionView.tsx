import { Category, Question } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useState } from "react";
import { QuestionTimer } from "./QuestionTimer";
import { sounds } from "@/lib/sounds";

interface Props {
  category: Category;
  question: Question;
  soundEnabled: boolean;
  currency: string;
  timerSeconds: number;
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

export function QuestionView({ category, question, soundEnabled, currency, timerSeconds, onBack }: Props) {
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    if (soundEnabled) sounds.reveal();
  };

  const back = () => {
    if (soundEnabled) sounds.click();
    onBack();
  };

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
    <div className="animate-fade-in min-h-[80vh] flex flex-col">
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
            {currency}{question.value}
          </span>
        </div>
        <QuestionTimer initialSeconds={timerSeconds} />
      </div>

      {/* Main panel */}
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

          {!revealed && (
            <div className="mt-10">
              <Button
                size="lg"
                onClick={reveal}
                className="font-display text-xl md:text-2xl px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              >
                <Eye className="w-6 h-6 mr-2" /> Show Answer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
