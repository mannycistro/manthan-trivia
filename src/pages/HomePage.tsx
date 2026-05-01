import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SavedGameModule, GameSettings, Round } from "@/types/jeopardy";
import { defaultRounds } from "@/lib/defaultGame";
import { Button } from "@/components/ui/button";
import { Play, Pencil, Trash2, Copy, Plus } from "lucide-react";

const STORAGE_KEY = "jeopardy-game-v1";
const MODULES_KEY = "jeopardy-modules-v1";

const DEFAULT_SETTINGS: GameSettings = {
  currency: "$",
  timerSeconds: 30,
  categoryFontFamily: "Montserrat",
  categoryFontSize: 32,
  volume: 0.8,
  keyBindings: { correct: "y", wrong: "n", reveal: "Space" },
};

function migrateRounds(parsed: any): Round[] | null {
  if (Array.isArray(parsed?.rounds) && parsed.rounds.length > 0) {
    return parsed.rounds.map((r: any, i: number) => ({
      id: r.id ?? `r-mig-${i}`,
      name: r.name ?? `Round ${i + 1}`,
      rows: r.rows ?? r.categories?.[0]?.questions?.length ?? 5,
      cols: r.cols ?? r.categories?.length ?? 5,
      baseValue: r.baseValue ?? 100,
      valueStep: r.valueStep ?? 100,
      categories: r.categories ?? [],
      usedTileIds: r.usedTileIds ?? [],
    }));
  }
  if (Array.isArray(parsed?.categories) && parsed.categories.length > 0) {
    return [
      {
        id: `r-legacy-${Date.now()}`,
        name: "Round 1",
        rows: parsed.categories[0]?.questions?.length ?? 5,
        cols: parsed.categories.length,
        baseValue: 100,
        valueStep: 100,
        categories: parsed.categories,
        usedTileIds: parsed.usedTileIds ?? [],
      },
    ];
  }
  return null;
}

interface BoardEntry {
  id: string;
  name: string;
  roundCount: number;
  categoryCount: number;
  savedAt?: number;
  isCurrent?: boolean;
}

function loadBoards(): BoardEntry[] {
  const boards: BoardEntry[] = [];

  // Current game
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rounds = migrateRounds(parsed);
      if (rounds) {
        boards.push({
          id: "__current__",
          name: parsed.gameName ?? "Jeopardy!",
          roundCount: rounds.length,
          categoryCount: rounds.reduce((s: number, r: any) => s + (r.categories?.length ?? 0), 0),
          isCurrent: true,
        });
      }
    }
  } catch {}

  // Saved modules
  try {
    const raw = localStorage.getItem(MODULES_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as any[];
      arr.forEach((m) => {
        const rounds = migrateRounds(m);
        boards.push({
          id: m.id,
          name: m.gameName ?? m.name ?? "Untitled",
          roundCount: rounds?.length ?? 0,
          categoryCount: rounds?.reduce((s: number, r: any) => s + (r.categories?.length ?? 0), 0) ?? 0,
          savedAt: m.savedAt,
        });
      });
    }
  } catch {}

  return boards;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardEntry[]>(loadBoards);

  const handlePlay = (boardId: string) => {
    if (boardId !== "__current__") {
      // Load module into current state
      loadModuleIntoCurrent(boardId);
    }
    navigate("/play");
  };

  const handleEdit = (boardId: string) => {
    if (boardId !== "__current__") {
      loadModuleIntoCurrent(boardId);
    }
    navigate("/edit");
  };

  const loadModuleIntoCurrent = (moduleId: string) => {
    try {
      const raw = localStorage.getItem(MODULES_KEY);
      if (!raw) return;
      const modules = JSON.parse(raw) as any[];
      const mod = modules.find((m: any) => m.id === moduleId);
      if (!mod) return;
      const rounds = migrateRounds(mod);
      if (!rounds) return;

      const currentRaw = localStorage.getItem(STORAGE_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : {};

      const newState = {
        ...current,
        gameName: mod.gameName ?? mod.name ?? "Jeopardy!",
        rounds: rounds.map((r: any) => ({ ...r, usedTileIds: [] })),
        activeRoundIndex: 0,
        settings: { ...DEFAULT_SETTINGS, ...(mod.settings ?? {}) },
        teams: (current.teams ?? [{ id: "t-1", name: "Team 1", score: 0 }, { id: "t-2", name: "Team 2", score: 0 }]).map((t: any) => ({ ...t, score: 0 })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  };

  const handleCreateNew = () => {
    const newState = {
      gameName: "Jeopardy!",
      rounds: defaultRounds(),
      activeRoundIndex: 0,
      teams: [
        { id: "t-1", name: "Team 1", score: 0 },
        { id: "t-2", name: "Team 2", score: 0 },
      ],
      soundEnabled: true,
      settings: { ...DEFAULT_SETTINGS },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    navigate("/edit");
  };

  const handleDeleteModule = (id: string) => {
    try {
      const raw = localStorage.getItem(MODULES_KEY);
      if (!raw) return;
      const modules = JSON.parse(raw).filter((m: any) => m.id !== id);
      localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
      setBoards(loadBoards());
    } catch {}
  };

  const handleDuplicate = (id: string) => {
    try {
      const raw = localStorage.getItem(MODULES_KEY);
      if (!raw) return;
      const modules = JSON.parse(raw);
      const src = id === "__current__"
        ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
        : modules.find((m: any) => m.id === id);
      if (!src) return;

      const copy = {
        id: `m-${Date.now()}`,
        name: `${src.gameName ?? src.name ?? "Board"} (copy)`,
        savedAt: Date.now(),
        gameName: `${src.gameName ?? src.name ?? "Board"} (copy)`,
        rounds: src.rounds ?? [],
        settings: src.settings ?? {},
      };
      modules.push(copy);
      localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
      setBoards(loadBoards());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl md:text-4xl gold-gradient text-shadow-jeopardy">
            Board Manager
          </h1>
          <Button onClick={handleCreateNew} className="font-bold">
            <Plus className="w-4 h-4 mr-2" /> New Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-4">No boards yet. Create your first one!</p>
            <Button onClick={handleCreateNew} size="lg" className="font-bold">
              <Plus className="w-5 h-5 mr-2" /> Create Board
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground truncate">
                      {board.name}
                    </h2>
                    {board.isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {board.roundCount} round{board.roundCount !== 1 ? "s" : ""} · {board.categoryCount} categories
                    {board.savedAt && (
                      <> · Saved {new Date(board.savedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handlePlay(board.id)}
                    className="font-bold"
                  >
                    <Play className="w-4 h-4 mr-1" /> Play
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(board.id)}
                    className="font-bold"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDuplicate(board.id)}
                    aria-label="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!board.isCurrent && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteModule(board.id)}
                      aria-label="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
