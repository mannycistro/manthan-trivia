import { Round, GameSettings } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import { AutoFitText } from "./AutoFitText";
import { EditMediaPreview } from "./EditMediaPreview";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  round: Round;
  rounds: Round[];
  settings: GameSettings;
  onTileClick: (categoryId: string, questionId: string) => void;
}

export function editBoardTotals(rounds: Round[]) {
  const questions = rounds.flatMap((r) => r.categories.flatMap((c) => c.questions));
  const withContent = (q: (typeof questions)[number]) => !!q.question.trim() || (q.mediaType !== "none" && !!q.mediaUrl);
  return {
    total: questions.length,
    complete: questions.filter((q) => withContent(q) && !!q.answer.trim()).length,
    empty: questions.filter((q) => !withContent(q)).length,
    missingAnswer: questions.filter((q) => !q.answer.trim()).length,
    media: questions.filter((q) => q.mediaType !== "none" && !!q.mediaUrl).length,
  };
}

function Overview({ label, rounds }: { label: string; rounds: Round[] }) {
  const counts = editBoardTotals(rounds);
  return <p className="text-xs text-muted-foreground">
    <span className="font-bold text-foreground">{label}</span>{" · "}
    {counts.complete}/{counts.total} complete · {counts.empty} empty · {counts.missingAnswer} missing answer · {counts.media} with media
  </p>;
}

export function EditBoard({ round, rounds, settings, onTileClick }: Props) {
  const [showAnswers, setShowAnswers] = useState(false);
  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="space-y-1" aria-label="Board completion overview">
          <Overview label={round.name || "Current round"} rounds={[round]} />
          <Overview label="All rounds" rounds={rounds} />
        </div>
        <div className="flex items-center gap-2">
        <Label htmlFor="edit-show-answers">Show answers</Label>
        <Switch id="edit-show-answers" checked={showAnswers} onCheckedChange={setShowAnswers} />
        </div>
      </div>
    <div className="grid gap-1.5 md:gap-2 w-full h-full min-h-0" style={{
      gridTemplateColumns: `max-content repeat(${round.cols}, minmax(0, 1fr))`,
      gridTemplateRows: `minmax(0, 1.6fr) repeat(${round.rows}, minmax(0, 1fr))`,
    }}>
      <div aria-hidden="true" />
      {round.categories.map((cat) => (
        <div key={cat.id} className="bg-accent text-accent-foreground rounded-lg p-1.5 md:p-2 flex items-center justify-center text-center shadow-tile overflow-hidden min-w-0 min-h-0 [container-type:size]">
          <AutoFitText text={cat.title} className="font-category text-shadow-jeopardy" minFontSize={10}
            maxFontSize={cat.titleFontSize ?? settings.categoryFontSize ?? 32}
            fontFamily={`'${cat.titleFontFamily ?? settings.categoryFontFamily ?? "Montserrat"}', system-ui, sans-serif`}
            refitKey={`${round.rows}x${round.cols}`} multiline />
        </div>
      ))}
      {Array.from({ length: round.rows }, (_, row) => [
        <div key={`value-${row}`} className="flex items-center justify-center px-1 font-display text-primary text-sm">
          {settings.currency}{round.categories[0]?.questions[row]?.value ?? round.baseValue + row * round.valueStep}
        </div>,
        ...round.categories.map((cat) => {
          const q = cat.questions[row];
          if (!q) return <div key={`${cat.id}-${row}`} />;
          const hasMedia = q.mediaType !== "none" && !!q.mediaUrl;
          return (
            <div key={q.id} data-edit-tile={q.id}
              className="tile-gradient text-tile-foreground shadow-tile rounded-lg p-1 md:p-2 min-w-0 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] hover:ring-2 hover:ring-primary transition-shadow"
              onClick={() => onTileClick(cat.id, q.id)}>
              <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onTileClick(cat.id, q.id); }}
                aria-label={`Edit ${cat.title || "category"} for ${q.value}`}
                className="w-full h-auto min-h-8 p-1 whitespace-pre-wrap break-words font-display uppercase text-center text-sm leading-tight hover:bg-transparent hover:text-tile-foreground">
                {(showAnswers ? q.answer : q.question).trim() || (!showAnswers && hasMedia)
                  ? (showAnswers ? q.answer : q.question)
                  : <span className="opacity-40">{settings.currency}{q.value}</span>}
              </Button>
              {hasMedia && <EditMediaPreview question={q} />}
            </div>
          );
        }),
      ])}
    </div>
    </div>
  );
}