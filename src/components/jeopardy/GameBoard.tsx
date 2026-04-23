import { Category } from "@/types/jeopardy";
import { Input } from "@/components/ui/input";

interface Props {
  categories: Category[];
  usedTileIds: Set<string>;
  onTileClick: (categoryId: string, questionId: string) => void;
  onCategoryRename: (categoryId: string, title: string) => void;
  editMode: boolean;
}

export function GameBoard({
  categories,
  usedTileIds,
  onTileClick,
  onCategoryRename,
  editMode,
}: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 md:gap-3">
      {/* Category headers */}
      {categories.map((cat) => (
        <div
          key={`h-${cat.id}`}
          className="bg-accent text-accent-foreground rounded-lg p-2 md:p-4 min-h-[70px] md:min-h-[110px] flex items-center justify-center text-center shadow-tile"
        >
          {editMode ? (
            <Input
              value={cat.title}
              onChange={(e) => onCategoryRename(cat.id, e.target.value)}
              className="font-display text-center bg-transparent border-white/30 text-white placeholder:text-white/50"
            />
          ) : (
            <h2 className="font-display text-sm md:text-xl uppercase leading-tight text-shadow-jeopardy">
              {cat.title}
            </h2>
          )}
        </div>
      ))}

      {/* Question tiles - rendered row by row (value 100, 200, ...) */}
      {[0, 1, 2, 3, 4].map((row) =>
        categories.map((cat) => {
          const q = cat.questions[row];
          const used = usedTileIds.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => !used && onTileClick(cat.id, q.id)}
              disabled={used}
              className={[
                "rounded-lg p-2 md:p-4 min-h-[70px] md:min-h-[110px]",
                "flex items-center justify-center transition-all duration-200",
                "shadow-tile font-display",
                used
                  ? "bg-tile-used text-tile-used-foreground cursor-not-allowed opacity-60"
                  : "tile-gradient text-tile-foreground hover:scale-[1.03] hover:shadow-glow active:translate-y-1",
              ].join(" ")}
              aria-label={`${cat.title} for ${q.value}`}
            >
              <span className="text-2xl md:text-5xl text-shadow-jeopardy">
                {used ? "" : `$${q.value}`}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
