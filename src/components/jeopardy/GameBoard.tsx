import { Round } from "@/types/jeopardy";
import { Textarea } from "@/components/ui/textarea";
import { AutoFitText } from "./AutoFitText";

interface Props {
  round: Round;
  currency: string;
  onTileClick: (categoryId: string, questionId: string) => void;
  onCategoryRename: (categoryId: string, title: string) => void;
  editMode: boolean;
  categoryFontFamily?: string;
  categoryFontSize?: number;
}

export function GameBoard({
  round,
  currency,
  onTileClick,
  onCategoryRename,
  editMode,
  categoryFontFamily = "Montserrat",
  categoryFontSize = 32,
}: Props) {
  const { categories, rows, cols, usedTileIds } = round;
  const usedSet = new Set(usedTileIds);

  const gridTemplateRows = `minmax(0, 1.6fr) repeat(${rows}, minmax(0, 1fr))`;
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  const categoryFontStack = (family: string) =>
    `'${family}', system-ui, -apple-system, sans-serif`;

  return (
    <div
      className="grid gap-1.5 md:gap-2 w-full h-full"
      style={{ gridTemplateColumns, gridTemplateRows }}
    >
      {categories.map((cat) => {
        const family = cat.titleFontFamily || categoryFontFamily;
        const size = cat.titleFontSize ?? categoryFontSize;
        return (
          <div
            key={`h-${cat.id}`}
            className="bg-accent text-accent-foreground rounded-lg p-1.5 md:p-2 flex items-center justify-center text-center shadow-tile overflow-hidden min-w-0 min-h-0 [container-type:size]"
          >
            {editMode ? (
              <Textarea
                value={cat.title}
                onChange={(e) => onCategoryRename(cat.id, e.target.value)}
                rows={2}
                className="font-category text-center bg-transparent border-white/30 text-white placeholder:text-white/50 resize-none h-full"
              />
            ) : (
              <AutoFitText
                text={cat.title}
                className="font-category text-shadow-jeopardy"
                minFontSize={10}
                maxFontSize={size}
                refitKey={`${rows}x${cols}-${family}-${size}`}
                fontFamily={categoryFontStack(family)}
                multiline
              />
            )}
          </div>
        );
      })}

      {Array.from({ length: rows }).map((_, row) =>
        categories.map((cat) => {
          const q = cat.questions[row];
          if (!q) return null;
          const used = usedSet.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => !used && onTileClick(cat.id, q.id)}
              disabled={used}
              className={[
                "rounded-lg p-1 md:p-2 min-w-0 min-h-0 w-full h-full",
                "flex items-center justify-center transition-all duration-200",
                "shadow-tile font-display [container-type:size]",
                used
                  ? "bg-tile-used text-tile-used-foreground cursor-not-allowed opacity-60"
                  : "tile-gradient text-tile-foreground hover:scale-[1.03] hover:shadow-glow active:translate-y-1",
              ].join(" ")}
              aria-label={`${cat.title} for ${q.value}`}
            >
              <span
                className="text-shadow-jeopardy leading-none"
                style={{
                  fontSize: "clamp(0.9rem, min(32cqw, 55cqh), 3.25rem)",
                }}
              >
                {used ? "" : `${currency}${q.value}`}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
