import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GameSettings,
  GameState,
  Question,
  Round,
} from "@/types/jeopardy";
import {
  defaultRounds,
  defaultTeams,
  makeRound,
  resizeRound,
  rescaleRoundValues,
} from "@/lib/defaultGame";
import {
  getActiveBoardId,
  getBoard,
  saveBoard,
  createNewBoard,
  setActiveBoardId,
  StoredBoard,
  DEFAULT_SETTINGS,
} from "@/lib/boardStorage";
import { GameBoard } from "@/components/jeopardy/GameBoard";
import { QuestionView } from "@/components/jeopardy/QuestionView";
import { ScoreboardBar } from "@/components/jeopardy/ScoreboardBar";
import { EditPanel } from "@/components/jeopardy/EditPanel";
import { SettingsDialog } from "@/components/jeopardy/SettingsDialog";
import { RoundSwitcher } from "@/components/jeopardy/RoundSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Settings as SettingsIcon, Volume2, VolumeX, Check, Home, Play } from "lucide-react";
import { sounds, setMasterVolume, setCustomSounds, playBackground, stopBackground } from "@/lib/sounds";
import { toast } from "sonner";

const DEFAULT_KEYBINDINGS = { correct: "y", wrong: "n", reveal: "Space" } as const;

function loadBoardState(): { board: StoredBoard; boardId: string } {
  const id = getActiveBoardId();
  if (id) {
    const board = getBoard(id);
    if (board) return { board, boardId: id };
  }
  // Fallback: create a new board
  const newBoard = createNewBoard();
  saveBoard(newBoard);
  setActiveBoardId(newBoard.id);
  return { board: newBoard, boardId: newBoard.id };
}

function boardToState(board: StoredBoard): GameState {
  return {
    gameName: board.gameName,
    rounds: board.rounds,
    activeRoundIndex: Math.min(board.activeRoundIndex, board.rounds.length - 1),
    teams: board.teams,
    soundEnabled: board.soundEnabled,
    settings: { ...DEFAULT_SETTINGS, ...board.settings },
  };
}

interface IndexProps {
  mode: "play" | "edit";
}

const Index = ({ mode }: IndexProps) => {
  const navigate = useNavigate();
  const { board: initialBoard, boardId } = loadBoardState();
  const [state, setState] = useState<GameState>(() => boardToState(initialBoard));
  const boardIdRef = useRef(boardId);
  const [activeTile, setActiveTile] = useState<{ catId: string; qId: string } | null>(null);
  const [editOpen, setEditOpen] = useState(mode === "edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.gameName);
  const playMode = mode === "play";
  const containerRef = useRef<HTMLDivElement>(null);

  // Cursor remains visible in both modes; caret/selection restrictions are scoped per-component.

  // Auto-save to board storage on every state change
  useEffect(() => {
    const id = boardIdRef.current;
    const existing = getBoard(id);
    if (!existing) return;
    saveBoard({
      ...existing,
      gameName: state.gameName,
      rounds: state.rounds,
      activeRoundIndex: state.activeRoundIndex,
      teams: state.teams,
      soundEnabled: state.soundEnabled,
      settings: state.settings,
    });
  }, [state]);

  // Apply master volume / mute to sound engine
  useEffect(() => {
    const v = state.settings.volume ?? 0.8;
    setMasterVolume(state.soundEnabled ? v : 0);
  }, [state.settings.volume, state.soundEnabled]);

  // Sync uploaded custom sounds with engine
  useEffect(() => {
    setCustomSounds(state.settings.customSounds ?? {});
  }, [state.settings.customSounds]);

  const activeRound = state.rounds[state.activeRoundIndex] ?? state.rounds[0];

  const activeCategory = activeTile
    ? activeRound?.categories.find((c) => c.id === activeTile.catId) ?? null
    : null;
  const activeQuestion: Question | null =
    activeTile && activeCategory
      ? activeCategory.questions.find((q) => q.id === activeTile.qId) ?? null
      : null;

  // Background music coordination
  useEffect(() => {
    if (!state.soundEnabled) {
      stopBackground();
      return;
    }
    if (activeTile) {
      playBackground("questionMusic");
    } else {
      playBackground("homeMusic");
    }
  }, [activeTile, state.soundEnabled, state.settings.customSounds]);

  useEffect(() => () => stopBackground(), []);

  const playClick = () => {
    if (state.soundEnabled) sounds.click();
  };

  // ---- Round helpers
  const updateActiveRound = (updater: (r: Round) => Round) =>
    setState((s) => ({
      ...s,
      rounds: s.rounds.map((r, i) => (i === s.activeRoundIndex ? updater(r) : r)),
    }));

  const updateRoundAt = (idx: number, updater: (r: Round) => Round) =>
    setState((s) => ({
      ...s,
      rounds: s.rounds.map((r, i) => (i === idx ? updater(r) : r)),
    }));

  // ---- Tile interactions
  const onTileClick = (catId: string, qId: string) => {
    playClick();
    setActiveTile({ catId, qId });
    updateActiveRound((r) =>
      r.usedTileIds.includes(qId) ? r : { ...r, usedTileIds: [...r.usedTileIds, qId] }
    );
  };

  const onBack = () => setActiveTile(null);

  // ---- Editing categories/questions on the active round
  const updateCategoryTitle = (id: string, title: string) =>
    updateActiveRound((r) => ({
      ...r,
      categories: r.categories.map((c) => (c.id === id ? { ...c, title } : c)),
    }));

  const updateCategory = (
    id: string,
    patch: { titleFontFamily?: string; titleFontSize?: number }
  ) =>
    updateActiveRound((r) => ({
      ...r,
      categories: r.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const updateQuestion = (catId: string, qId: string, patch: Partial<Question>) =>
    updateActiveRound((r) => ({
      ...r,
      categories: r.categories.map((c) =>
        c.id !== catId
          ? c
          : { ...c, questions: c.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) }
      ),
    }));

  // ---- Teams
  const updateTeamName = (id: string, name: string) =>
    setState((s) => ({ ...s, teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)) }));

  const adjustScore = (id: string, delta: number) => {
    if (state.soundEnabled) (delta > 0 ? sounds.correct() : sounds.wrong());
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
    setState((s) => (s.teams.length <= 2 ? s : { ...s, teams: s.teams.filter((t) => t.id !== id) }));

  // ---- Reset (gameplay only — never deletes questions, answers, media, or settings)
  const resetActiveRoundUsedTiles = () => {
    setActiveTile(null); // close any open question / reset timer
    updateActiveRound((r) => ({ ...r, usedTileIds: [] }));
    setState((s) => ({ ...s, teams: s.teams.map((t) => ({ ...t, score: 0 })) }));
    toast.success("Round tiles and scores reset");
  };

  const resetAllRounds = () => {
    setActiveTile(null); // close any open question / reset timer
    setState((s) => ({
      ...s,
      rounds: s.rounds.map((r) => ({ ...r, usedTileIds: [] })),
      teams: s.teams.map((t) => ({ ...t, score: 0 })),
    }));
    toast.success("All rounds and scores reset");
  };

  const resetGame = () => {
    setState((s) => ({
      gameName: "Jeopardy!",
      rounds: defaultRounds(),
      activeRoundIndex: 0,
      teams: defaultTeams(),
      soundEnabled: s.soundEnabled,
      settings: s.settings,
    }));
    setNameDraft("Jeopardy!");
    toast.success("Game reset to defaults");
  };

  // ---- Settings
  const updateSettings = (patch: Partial<GameSettings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const setGameName = (name: string) => {
    setState((s) => ({ ...s, gameName: name }));
    setNameDraft(name);
  };

  // ---- Rounds management
  const addRound = () => {
    setState((s) => {
      const cur = s.rounds[s.activeRoundIndex] ?? s.rounds[0];
      const newRound = makeRound(
        `Round ${s.rounds.length + 1}`,
        cur?.rows ?? 5,
        cur?.cols ?? 5,
        cur?.baseValue ?? 100,
        cur?.valueStep ?? 100
      );
      return {
        ...s,
        rounds: [...s.rounds, newRound],
        activeRoundIndex: s.rounds.length,
      };
    });
    setActiveTile(null);
  };

  const renameRound = (idx: number, name: string) =>
    updateRoundAt(idx, (r) => ({ ...r, name }));

  const duplicateRound = (idx: number) => {
    setState((s) => {
      const src = s.rounds[idx];
      if (!src) return s;
      const copy: Round = JSON.parse(JSON.stringify(src));
      copy.id = `r-${Date.now()}`;
      copy.name = `${src.name} (copy)`;
      copy.usedTileIds = [];
      copy.categories = copy.categories.map((c, ci) => ({
        ...c,
        id: `cat-${Date.now()}-${ci}`,
        questions: c.questions.map((q, qi) => ({ ...q, id: `q-${Date.now()}-${ci}-${qi}` })),
      }));
      const rounds = [...s.rounds];
      rounds.splice(idx + 1, 0, copy);
      return { ...s, rounds, activeRoundIndex: idx + 1 };
    });
  };

  const deleteRound = (idx: number) => {
    setState((s) => {
      if (s.rounds.length <= 1) return s;
      const rounds = s.rounds.filter((_, i) => i !== idx);
      const newActive = Math.min(s.activeRoundIndex, rounds.length - 1);
      return { ...s, rounds, activeRoundIndex: newActive };
    });
    setActiveTile(null);
  };

  const moveRound = (idx: number, dir: -1 | 1) => {
    setState((s) => {
      const target = idx + dir;
      if (target < 0 || target >= s.rounds.length) return s;
      const rounds = [...s.rounds];
      [rounds[idx], rounds[target]] = [rounds[target], rounds[idx]];
      const newActive =
        s.activeRoundIndex === idx ? target : s.activeRoundIndex === target ? idx : s.activeRoundIndex;
      return { ...s, rounds, activeRoundIndex: newActive };
    });
  };

  const setActiveRound = (idx: number) => {
    setActiveTile(null);
    setState((s) => ({ ...s, activeRoundIndex: idx }));
  };

  const setRoundLayout = (rows: number, cols: number, baseValue: number, valueStep: number) => {
    updateActiveRound((r) => resizeRound(r, rows, cols, baseValue, valueStep));
  };

  const rescaleActiveRound = (baseValue: number, valueStep: number) => {
    updateActiveRound((r) => rescaleRoundValues(r, baseValue, valueStep));
  };

  // ---- Import / Export
  const exportJson = async () => {
    // Inline media data URLs from IDB so the exported JSON is self-contained.
    const roundsForExport = await Promise.all(
      state.rounds.map(async (r) => ({
        ...r,
        usedTileIds: [],
        categories: await Promise.all(
          r.categories.map(async (c) => ({
            ...c,
            questions: await Promise.all(
              c.questions.map(async (q) => {
                if (isMediaRef(q.mediaUrl)) {
                  try {
                    const url = await getMedia(refToId(q.mediaUrl!));
                    return { ...q, mediaUrl: url ?? undefined };
                  } catch {
                    return q;
                  }
                }
                return q;
              })
            ),
          }))
        ),
      }))
    );
    const data = JSON.stringify(
      {
        gameName: state.gameName,
        rounds: roundsForExport,
        teams: state.teams.map((t) => ({ ...t, score: 0 })),
        settings: state.settings,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.gameName.replace(/\s+/g, "-").toLowerCase() || "jeopardy"}-game.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (json: string) => {
    const parsed = JSON.parse(json);
    const rounds = migrateRoundsLocal(parsed);
    if (!rounds || rounds.length === 0) throw new Error("Invalid");
    // Move any inline data: URLs into IDB and replace with refs.
    for (const r of rounds) {
      for (const c of r.categories) {
        for (const q of c.questions) {
          if (q.mediaUrl && q.mediaUrl.startsWith("data:")) {
            const id = newMediaId();
            try {
              await putMedia(id, q.mediaUrl);
              q.mediaUrl = idToRef(id);
            } catch {
              // leave as-is on failure
            }
          }
        }
      }
    }
    setState((s) => ({
      ...s,
      gameName: parsed.gameName ?? s.gameName,
      rounds,
      activeRoundIndex: 0,
      teams: parsed.teams ?? s.teams,
      settings: { ...s.settings, ...(parsed.settings ?? {}) },
    }));
    setNameDraft(parsed.gameName ?? state.gameName);
    setActiveTile(null);
  };

  return (
    <div ref={containerRef} className="h-screen flex flex-col px-2 md:px-4 pt-1 md:pt-2 overflow-hidden">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-1 mb-1 md:mb-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {playMode ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { setActiveTile(null); navigate("/"); }}
                aria-label="Back to Home"
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setState((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                aria-label="Toggle sound"
              >
                {state.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <h1 className="font-display text-2xl md:text-3xl gold-gradient text-shadow-jeopardy break-words leading-none">
                {state.gameName}
              </h1>
            </>
          ) : editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setGameName(nameDraft.trim() || "Jeopardy!");
                    setEditingName(false);
                  }
                }}
                className="font-display text-xl md:text-2xl h-8 md:h-10 min-w-[200px] md:min-w-[400px]"
                autoFocus
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  setGameName(nameDraft.trim() || "Jeopardy!");
                  setEditingName(false);
                }}
                aria-label="Save name"
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl md:text-3xl gold-gradient text-shadow-jeopardy break-words leading-none">
                {state.gameName}
              </h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setNameDraft(state.gameName);
                  setEditingName(true);
                }}
                aria-label="Rename game"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!activeQuestion && state.rounds.length > 0 && (
            <RoundSwitcher
              rounds={state.rounds}
              activeIndex={state.activeRoundIndex}
              onChange={setActiveRound}
              onAddRound={playMode ? undefined : addRound}
            />
          )}
          {!playMode && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setState((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                aria-label="Toggle sound"
              >
                {state.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button variant="secondary" onClick={() => setSettingsOpen(true)} className="font-bold">
                <SettingsIcon className="w-4 h-4 mr-2" /> Settings
              </Button>
              <Button onClick={() => setEditOpen(true)} className="font-bold">
                <Pencil className="w-4 h-4 mr-2" /> Edit Game
              </Button>
            </>
          )}
          {!playMode && (
            <Button onClick={() => navigate("/play")} variant="default" className="font-bold">
              <Play className="w-4 h-4 mr-2" /> Play
            </Button>
          )}
          {!playMode && (
            <Button onClick={() => navigate("/")} variant="ghost" className="font-bold">
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col pb-1">
        {activeQuestion && activeCategory ? (
          <div className="flex-1 min-h-0">
            <QuestionView
              category={activeCategory}
              question={activeQuestion}
              soundEnabled={state.soundEnabled}
              currency={state.settings.currency}
              timerSeconds={state.settings.timerSeconds}
              keyBindings={state.settings.keyBindings ?? { ...DEFAULT_KEYBINDINGS }}
              onBack={onBack}
            />
          </div>
        ) : activeRound ? (
          <div className="animate-fade-in flex-1 min-h-0 h-full">
            <GameBoard
              round={activeRound}
              currency={state.settings.currency}
              onTileClick={onTileClick}
              onCategoryRename={updateCategoryTitle}
              editMode={false}
              categoryFontFamily={state.settings.categoryFontFamily}
              categoryFontSize={state.settings.categoryFontSize}
            />
          </div>
        ) : null}
      </main>

      {/* Sticky horizontal scoreboard */}
      <div className="shrink-0 -mx-2 md:-mx-4 mt-auto">
        <ScoreboardBar
          teams={state.teams}
          onUpdateName={updateTeamName}
          onAdjustScore={adjustScore}
          onAddTeam={addTeam}
          onRemoveTeam={removeTeam}
        />
      </div>

      {!playMode && activeRound && (
        <EditPanel
          open={editOpen}
          onOpenChange={setEditOpen}
          rounds={state.rounds}
          activeRoundIndex={state.activeRoundIndex}
          onChangeRound={setActiveRound}
          round={activeRound}
          onUpdateCategoryTitle={updateCategoryTitle}
          onUpdateCategory={updateCategory}
          onUpdateQuestion={updateQuestion}
          onResetBoard={resetActiveRoundUsedTiles}
          onResetAll={resetAllRounds}
          onResetGame={resetGame}
          onExport={exportJson}
          onImport={importJson}
          settings={state.settings}
          onUpdateSettings={updateSettings}
        />
      )}

      {!playMode && (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={state.settings}
          onUpdateSettings={updateSettings}
          gameName={state.gameName}
          onSetGameName={setGameName}
          rounds={state.rounds}
          activeRoundIndex={state.activeRoundIndex}
          onSetActiveRound={setActiveRound}
          onAddRound={addRound}
          onRenameRound={renameRound}
          onDuplicateRound={duplicateRound}
          onDeleteRound={deleteRound}
          onMoveRound={moveRound}
          onSetRoundLayout={setRoundLayout}
          onRescaleRound={rescaleActiveRound}
        />
      )}
    </div>
  );
};

// Local migration helper for import
function migrateRoundsLocal(parsed: any): Round[] | null {
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
    return [{
      id: `r-legacy-${Date.now()}`,
      name: "Round 1",
      rows: parsed.categories[0]?.questions?.length ?? 5,
      cols: parsed.categories.length,
      baseValue: 100,
      valueStep: 100,
      categories: parsed.categories,
      usedTileIds: parsed.usedTileIds ?? [],
    }];
  }
  return null;
}

export default Index;
