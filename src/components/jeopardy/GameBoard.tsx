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

  // Equal-sized tiles via aspect ratio that scales with grid size.
  // Wider grids get shorter tiles so the board fits a single screen.
  const tileAspect = Math.max(0.9, Math.min(1.7, cols / Math.max(rows, 2) + 0.4));

  return (
    <div
      className="grid gap-2 md:gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {/* Category headers */}
      {categories.map((cat) => (
        <div
          key={`h-${cat.id}`}
          className="bg-accent text-accent-foreground rounded-lg p-2 md:p-3 flex items-center justify-center text-center shadow-tile overflow-hidden"
          style={{ aspectRatio: `${tileAspect} / 0.55` }}
        >
          {editMode ? (
            <Textarea
              value={cat.title}
              onChange={(e) => onCategoryRename(cat.id, e.target.value)}
              rows={2}
              className="font-display text-center bg-transparent border-white/30 text-white placeholder:text-white/50 resize-none h-full"
            />
          ) : (
            <h2 className="font-display tile-text uppercase text-shadow-jeopardy break-words w-full">
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
              style={{ aspectRatio: `${tileAspect} / 1` }}
              className={[
                "rounded-lg p-1 md:p-2",
                "flex items-center justify-center transition-all duration-200",
                "shadow-tile font-display",
                used
                  ? "bg-tile-used text-tile-used-foreground cursor-not-allowed opacity-60"
                  : "tile-gradient text-tile-foreground hover:scale-[1.03] hover:shadow-glow active:translate-y-1",
              ].join(" ")}
              aria-label={`${cat.title} for ${q.value}`}
            >
              <span className="tile-value text-shadow-jeopardy">
                {used ? "" : `${currency}${q.value}`}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
