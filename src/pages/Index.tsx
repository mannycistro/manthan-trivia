import { useEffect, useMemo, useState } from "react";
import { Category, GameState, Question, Team } from "@/types/jeopardy";
import { defaultCategories, defaultTeams } from "@/lib/defaultGame";
import { GameBoard } from "@/components/jeopardy/GameBoard";
import { QuestionView } from "@/components/jeopardy/QuestionView";
import { Scoreboard } from "@/components/jeopardy/Scoreboard";
import { EditPanel } from "@/components/jeopardy/EditPanel";
import { Button } from "@/components/ui/button";
import { Pencil, Volume2, VolumeX } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { toast } from "sonner";

const STORAGE_KEY = "jeopardy-game-v1";

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.categories?.length === 5) return parsed;
    }
  } catch {}
  return {
    categories: defaultCategories(),
    teams: defaultTeams(),
    usedTileIds: [],
    soundEnabled: true,
  };
}

const Index = () => {
  const [state, setState] = useState<GameState>(loadState);
  const [activeTile, setActiveTile] = useState<{ catId: string; qId: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const usedSet = useMemo(() => new Set(state.usedTileIds), [state.usedTileIds]);

  const activeCategory = activeTile
    ? state.categories.find((c) => c.id === activeTile.catId) ?? null
    : null;
  const activeQuestion: Question | null =
    activeTile && activeCategory
      ? activeCategory.questions.find((q) => q.id === activeTile.qId) ?? null
      : null;

  const playClick = () => {
    if (state.soundEnabled) sounds.click();
  };

  const onTileClick = (catId: string, qId: string) => {
    playClick();
    setActiveTile({ catId, qId });
    setState((s) =>
      s.usedTileIds.includes(qId) ? s : { ...s, usedTileIds: [...s.usedTileIds, qId] }
    );
  };

  const onBack = () => setActiveTile(null);

  const updateCategoryTitle = (id: string, title: string) =>
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, title } : c)),
    }));

  const updateQuestion = (catId: string, qId: string, patch: Partial<Question>) =>
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id !== catId
          ? c
          : { ...c, questions: c.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
      ),
    }));

  const updateTeamName = (id: string, name: string) =>
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)),
    }));

  const adjustScore = (id: string, delta: number) => {
    if (state.soundEnabled) {
      delta > 0 ? sounds.correct() : sounds.wrong();
    }
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === id ? { ...t, score: t.score + delta } : t)),
    }));
  };

  const addTeam = () => {
    if (state.teams.length >= 4) return;
    const idx = state.teams.length + 1;
    setState((s) => ({
      ...s,
      teams: [...s.teams, { id: `t-${Date.now()}`, name: `Team ${idx}`, score: 0 }],
    }));
  };

  const removeTeam = (id: string) =>
    setState((s) =>
      s.teams.length <= 2 ? s : { ...s, teams: s.teams.filter((t) => t.id !== id) }
    );

  const resetBoard = () => {
    setState((s) => ({ ...s, usedTileIds: [], teams: s.teams.map((t) => ({ ...t, score: 0 })) }));
    toast.success("Board and scores reset");
  };

  const resetGame = () => {
    setState({
      categories: defaultCategories(),
      teams: defaultTeams(),
      usedTileIds: [],
      soundEnabled: state.soundEnabled,
    });
    toast.success("Game reset to defaults");
  };

  const exportJson = () => {
    const data = JSON.stringify(
      { categories: state.categories, teams: state.teams.map((t) => ({ ...t, score: 0 })) },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jeopardy-game.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (json: string) => {
    const parsed = JSON.parse(json);
    if (!parsed.categories || parsed.categories.length !== 5) throw new Error("Invalid");
    setState((s) => ({
      ...s,
      categories: parsed.categories,
      teams: parsed.teams ?? s.teams,
      usedTileIds: [],
    }));
  };

  return (
    <div className="min-h-screen px-3 md:px-8 py-4 md:py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="font-display text-3xl md:text-5xl gold-gradient text-shadow-jeopardy">
          JEOPARDY!
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() =>
              setState((s) => ({ ...s, soundEnabled: !s.soundEnabled }))
            }
            aria-label="Toggle sound"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
          <Button onClick={() => setEditOpen(true)} className="font-bold">
            <Pencil className="w-4 h-4 mr-2" /> Edit Game
          </Button>
        </div>
      </header>

      <main className="space-y-6">
        {activeQuestion && activeCategory ? (
          <QuestionView
            category={activeCategory}
            question={activeQuestion}
            soundEnabled={state.soundEnabled}
            onBack={onBack}
          />
        ) : (
          <div className="animate-fade-in">
            <GameBoard
              categories={state.categories}
              usedTileIds={usedSet}
              onTileClick={onTileClick}
              onCategoryRename={updateCategoryTitle}
              editMode={false}
            />
          </div>
        )}

        <Scoreboard
          teams={state.teams}
          onUpdateName={updateTeamName}
          onAdjustScore={adjustScore}
          onAddTeam={addTeam}
          onRemoveTeam={removeTeam}
        />
      </main>

      <EditPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={state.categories}
        onUpdateCategoryTitle={updateCategoryTitle}
        onUpdateQuestion={updateQuestion}
        onResetBoard={resetBoard}
        onResetGame={resetGame}
        onExport={exportJson}
        onImport={importJson}
      />
    </div>
  );
};

export default Index;
