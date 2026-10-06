import { useEffect } from "react";
import { Category, Question } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface Props {
  category: Category;
  question: Question;
  currency: string;
  onBack: () => void;
  onUpdate: (patch: Partial<Question>) => void;
}

export function TileEditor({ category, question, currency, onBack, onUpdate }: Props) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); onBack(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onBack]);

  return <section className="flex h-full min-h-0 flex-col gap-3" aria-label="Tile editor">
    <header className="flex shrink-0 flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onBack}><ArrowLeft /> Back</Button>
      <h2 className="font-display text-xl text-primary break-words uppercase">{category.title || "Untitled category"} - {currency}{question.value}</h2>
    </header>
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 min-w-0">
        <Label htmlFor="tile-clue" className="font-display text-lg text-primary">CLUE</Label>
        <Textarea id="tile-clue" value={question.question} rows={8} className="min-h-40" onChange={(e) => onUpdate({ question: e.target.value })} />
      </div>
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 min-w-0">
        <Label htmlFor="tile-answer" className="font-display text-lg text-primary">CORRECT RESPONSE</Label>
        <Textarea id="tile-answer" value={question.answer} rows={8} className="min-h-40" onChange={(e) => onUpdate({ answer: e.target.value })} />
      </div>
    </div>
  </section>;
}