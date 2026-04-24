import { Round } from "@/types/jeopardy";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  round: Round;
  currency: string;
  onTileClick: (categoryId: string, questionId: string) => void;
  onCategoryRename: (categoryId: string, title: string) => void;
  editMode: boolean;
}

export function GameBoard({
  round,
  currency,
  onTileClick,
  onCategoryRename,
  editMode,
}: Props) {
  const { categories, rows, cols, usedTileIds } = round;
  const usedSet = new Set(usedTileIds);

  // Header row gets a smaller share than question rows.
  // Total tracks: 1 header row + `rows` question rows.
  const gridTemplateRows = `minmax(0, 0.6fr) repeat(${rows}, minmax(0, 1fr))`;
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div
      className="grid gap-1.5 md:gap-2 w-full h-full"
      style={{ gridTemplateColumns, gridTemplateRows }}
    >
      {/* Category headers */}
      {categories.map((cat) => (
        <div
          key={`h-${cat.id}`}
          className="bg-accent text-accent-foreground rounded-lg p-1.5 md:p-2 flex items-center justify-center text-center shadow-tile overflow-hidden min-w-0 min-h-0 [container-type:size]"
        >
          {editMode ? (
            <Textarea
              value={cat.title}
              onChange={(e) => onCategoryRename(cat.id, e.target.value)}
              rows={2}
              className="font-display text-center bg-transparent border-white/30 text-white placeholder:text-white/50 resize-none h-full"
            />
          ) : (
            <h2
              className="font-display uppercase text-shadow-jeopardy break-words w-full leading-tight"
              style={{
                fontSize: "clamp(0.6rem, min(22cqw, 38cqh), 2rem)",
              }}
            >
              {cat.title}
            </h2>
          )}
        </div>
      ))}

      {/* Question tiles row by row */}
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
