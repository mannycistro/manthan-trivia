import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameSettings, Round, SavedGameModule } from "@/types/jeopardy";
import { useState } from "react";
import {
  Save,
  Trash2,
  FolderOpen,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;

  gameName: string;
  onSetGameName: (name: string) => void;

  rounds: Round[];
  activeRoundIndex: number;
  onSetActiveRound: (idx: number) => void;
  onAddRound: () => void;
  onRenameRound: (idx: number, name: string) => void;
  onDuplicateRound: (idx: number) => void;
  onDeleteRound: (idx: number) => void;
  onMoveRound: (idx: number, dir: -1 | 1) => void;
  onSetRoundLayout: (rows: number, cols: number, baseValue: number, valueStep: number) => void;
  onRescaleRound: (baseValue: number, valueStep: number) => void;

  savedModules: SavedGameModule[];
  onSaveModule: (name: string) => void;
  onLoadModule: (id: string) => void;
  onDeleteModule: (id: string) => void;
}

const NONE_VALUE = "__none__";
const CUSTOM_VALUE = "__custom__";

const CURRENCY_PRESETS = [
  { value: "$", label: "$ — US Dollar" },
  { value: "€", label: "€ — Euro" },
  { value: "£", label: "£ — Pound" },
  { value: "¥", label: "¥ — Yen / Yuan" },
  { value: "₹", label: "₹ — Rupee" },
  { value: "₽", label: "₽ — Ruble" },
  { value: "₩", label: "₩ — Won" },
  { value: "R$", label: "R$ — Real" },
  { value: "kr", label: "kr — Krona" },
  { value: "pts", label: "pts — Points (suffix)" },
  { value: NONE_VALUE, label: "(none — number only)" },
  { value: CUSTOM_VALUE, label: "Custom…" },
];

const PRESET_VALUES = new Set(
  CURRENCY_PRESETS.map((p) => p.value).filter((v) => v !== CUSTOM_VALUE && v !== NONE_VALUE)
);

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  gameName,
  onSetGameName,
  rounds,
  activeRoundIndex,
  onSetActiveRound,
  onAddRound,
  onRenameRound,
  onDuplicateRound,
  onDeleteRound,
  onMoveRound,
  onSetRoundLayout,
  onRescaleRound,
  savedModules,
  onSaveModule,
  onLoadModule,
  onDeleteModule,
}: Props) {
  const [moduleName, setModuleName] = useState("");
  const [gameNameDraft, setGameNameDraft] = useState(gameName);
  const isPreset = PRESET_VALUES.has(settings.currency);
  const isNone = settings.currency === "";
  const [customMode, setCustomMode] = useState(!isPreset && !isNone);
  const [customCurrency, setCustomCurrency] = useState(
    !isPreset && !isNone ? settings.currency : ""
  );

  const selectValue = customMode ? CUSTOM_VALUE : isNone ? NONE_VALUE : settings.currency;

  const activeRound = rounds[activeRoundIndex] ?? rounds[0];
  const [rowsDraft, setRowsDraft] = useState(activeRound?.rows ?? 5);
  const [colsDraft, setColsDraft] = useState(activeRound?.cols ?? 5);
  const [baseDraft, setBaseDraft] = useState(activeRound?.baseValue ?? 100);
  const [stepDraft, setStepDraft] = useState(activeRound?.valueStep ?? 100);

  // Sync drafts when active round changes
  const syncKey = `${activeRound?.id}`;
  const [lastKey, setLastKey] = useState(syncKey);
  if (lastKey !== syncKey && activeRound) {
    setRowsDraft(activeRound.rows);
    setColsDraft(activeRound.cols);
    setBaseDraft(activeRound.baseValue);
    setStepDraft(activeRound.valueStep);
    setLastKey(syncKey);
  }

  const handleSave = () => {
    const name = moduleName.trim();
    if (!name) {
      toast.error("Enter a name for this game");
      return;
    }
    onSaveModule(name);
    setModuleName("");
    toast.success(`Saved "${name}"`);
  };

  const applyLayout = () => {
    if (!activeRound) return;
    const willShrink = rowsDraft < activeRound.rows || colsDraft < activeRound.cols;
    if (willShrink) {
      const ok = window.confirm(
        "Shrinking the grid will discard tiles that don't fit. Continue?"
      );
      if (!ok) return;
    }
    onSetRoundLayout(rowsDraft, colsDraft, baseDraft, stepDraft);
    toast.success("Board layout updated");
  };

  const applyRescale = () => {
    onRescaleRound(baseDraft, stepDraft);
    toast.success("Tile values rescaled");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Settings</DialogTitle>
          <DialogDescription>
            Game name, currency, timer, board layout, rounds, and saved games.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Game name */}
          <section className="space-y-2">
            <Label className="text-base font-bold">Game Name</Label>
            <p className="text-sm text-muted-foreground">
              Shown as the big title at the top of the board.
            </p>
            <div className="flex gap-2">
              <Input
                value={gameNameDraft}
                onChange={(e) => setGameNameDraft(e.target.value)}
                placeholder="e.g. Q4 Trivia Showdown"
                className="font-display text-lg"
              />
              <Button
                onClick={() => {
                  onSetGameName(gameNameDraft.trim() || "Jeopardy!");
                  toast.success("Game name updated");
                }}
                className="font-bold"
              >
                <Check className="w-4 h-4 mr-1" /> Apply
              </Button>
            </div>
          </section>

          {/* Currency */}
          <section className="space-y-2 border-t-2 border-border pt-4">
            <Label className="text-base font-bold">Currency / Tile prefix</Label>
            <p className="text-sm text-muted-foreground">
              Symbol shown in front of each tile amount, or remove it entirely.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  if (v === CUSTOM_VALUE) {
                    setCustomMode(true);
                    onUpdateSettings({ currency: customCurrency });
                  } else if (v === NONE_VALUE) {
                    setCustomMode(false);
                    onUpdateSettings({ currency: "" });
                  } else {
                    setCustomMode(false);
                    onUpdateSettings({ currency: v });
                  }
                }}
              >
                <SelectTrigger className="flex-1 min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customMode && (
                <Input
                  placeholder="Custom symbol"
                  value={customCurrency}
                  onChange={(e) => {
                    setCustomCurrency(e.target.value);
                    onUpdateSettings({ currency: e.target.value });
                  }}
                  className="w-40"
                />
              )}
              <div className="flex items-center justify-center px-4 rounded-md border-2 border-border bg-background min-w-[80px] font-display text-primary">
                {settings.currency}500
              </div>
            </div>
          </section>

          {/* Timer */}
          <section className="space-y-2 border-t-2 border-border pt-4">
            <Label className="text-base font-bold">
              Question time limit: {settings.timerSeconds}s
            </Label>
            <p className="text-sm text-muted-foreground">
              Per-question countdown. Set to 0 to disable.
            </p>
            <div className="flex items-center gap-4">
              <Slider
                min={0}
                max={300}
                step={5}
                value={[settings.timerSeconds]}
                onValueChange={(v) => onUpdateSettings({ timerSeconds: v[0] })}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={3600}
                value={settings.timerSeconds}
                onChange={(e) =>
                  onUpdateSettings({ timerSeconds: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-24"
              />
            </div>
          </section>

          {/* Master Volume */}
          <section className="space-y-2 border-t-2 border-border pt-4">
            <Label className="text-base font-bold">
              Master Volume: {Math.round(((settings.volume ?? 0.8) as number) * 100)}%
            </Label>
            <p className="text-sm text-muted-foreground">
              Affects all sound effects and the ticking timer.
            </p>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(((settings.volume ?? 0.8) as number) * 100)]}
              onValueChange={(v) => onUpdateSettings({ volume: v[0] / 100 })}
            />
          </section>

          {/* Host Key Bindings */}
          <section className="space-y-3 border-t-2 border-border pt-4">
            <div>
              <Label className="text-base font-bold">Host Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">
                Active only on the question screen. Click a field, then press the key to bind it.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { key: "correct", label: "Correct answer" },
                { key: "wrong", label: "Wrong answer" },
                { key: "reveal", label: "Show answer" },
              ] as const).map((b) => {
                const kb =
                  settings.keyBindings ?? { correct: "y", wrong: "n", reveal: "Space" };
                const value = (kb as any)[b.key] as string;
                return (
                  <div key={b.key}>
                    <Label>{b.label}</Label>
                    <Input
                      readOnly
                      value={value === " " ? "Space" : value.toUpperCase()}
                      placeholder="Press a key"
                      onKeyDown={(e) => {
                        e.preventDefault();
                        const k =
                          e.code === "Space" || e.key === " "
                            ? "Space"
                            : e.key.length === 1
                            ? e.key.toLowerCase()
                            : e.key;
                        onUpdateSettings({
                          keyBindings: { ...kb, [b.key]: k } as any,
                        });
                      }}
                      className="font-mono text-center cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Board Layout (active round) */}
          {activeRound && (
            <section className="space-y-3 border-t-2 border-border pt-4">
              <div>
                <Label className="text-base font-bold">
                  Board Layout — {activeRound.name}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose how many categories (columns) and questions per category (rows).
                  Tiles automatically resize to fill the board equally.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Categories (cols)</Label>
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    value={colsDraft}
                    onChange={(e) =>
                      setColsDraft(Math.min(8, Math.max(2, Number(e.target.value) || 2)))
                    }
                  />
                </div>
                <div>
                  <Label>Questions (rows)</Label>
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    value={rowsDraft}
                    onChange={(e) =>
                      setRowsDraft(Math.min(8, Math.max(2, Number(e.target.value) || 2)))
                    }
                  />
                </div>
                <div>
                  <Label>Base value</Label>
                  <Input
                    type="number"
                    min={0}
                    value={baseDraft}
                    onChange={(e) => setBaseDraft(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <Label>Step</Label>
                  <Input
                    type="number"
                    min={0}
                    value={stepDraft}
                    onChange={(e) => setStepDraft(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={applyLayout} className="font-bold">
                  Apply Layout
                </Button>
                <Button onClick={applyRescale} variant="secondary" className="font-bold">
                  Rescale Values Only
                </Button>
              </div>
            </section>
          )}

          {/* Rounds manager */}
          <section className="space-y-3 border-t-2 border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-base font-bold">Rounds</Label>
                <p className="text-sm text-muted-foreground">
                  Build multiple rounds (e.g. Round 1, Double Jeopardy, Final).
                </p>
              </div>
              <Button onClick={onAddRound} size="sm" className="font-bold">
                <Plus className="w-4 h-4 mr-1" /> Add Round
              </Button>
            </div>
            <ul className="space-y-2">
              {rounds.map((r, i) => (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-2 border-2 rounded-lg px-3 py-2 ${
                    i === activeRoundIndex ? "border-primary bg-primary/10" : "border-border bg-background/50"
                  }`}
                >
                  <Input
                    value={r.name}
                    onChange={(e) => onRenameRound(i, e.target.value)}
                    className="flex-1 min-w-[160px] font-bold"
                  />
                  <span className="text-xs text-muted-foreground">
                    {r.cols}×{r.rows}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMoveRound(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onMoveRound(i, 1)}
                      disabled={i === rounds.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={i === activeRoundIndex ? "default" : "secondary"}
                      onClick={() => onSetActiveRound(i)}
                    >
                      {i === activeRoundIndex ? "Active" : "Activate"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDuplicateRound(i)}
                      aria-label="Duplicate round"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (rounds.length <= 1) {
                          toast.error("At least one round is required");
                          return;
                        }
                        if (window.confirm(`Delete "${r.name}"?`)) onDeleteRound(i);
                      }}
                      aria-label="Delete round"
                      disabled={rounds.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Saved modules */}
          <section className="space-y-3 border-t-2 border-border pt-4">
            <div>
              <Label className="text-base font-bold">Saved Games</Label>
              <p className="text-sm text-muted-foreground">
                Save the current game (all rounds + settings) for future events.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. Q4 Team Offsite"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave} className="font-bold">
                <Save className="w-4 h-4 mr-1" /> Save Current
              </Button>
            </div>

            {savedModules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-3">
                No saved games yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {savedModules
                  .slice()
                  .sort((a, b) => b.savedAt - a.savedAt)
                  .map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-2 bg-background/50 border-2 border-border rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(m.savedAt).toLocaleString()} · {m.gameName} ·{" "}
                          {m.rounds.length} round{m.rounds.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onLoadModule(m.id);
                          toast.success(`Loaded "${m.name}"`);
                        }}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" /> Load
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          onDeleteModule(m.id);
                          toast.success(`Deleted "${m.name}"`);
                        }}
                        aria-label="Delete saved game"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
