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
import { GameSettings, SavedGameModule, Category } from "@/types/jeopardy";
import { useState } from "react";
import { Save, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  savedModules: SavedGameModule[];
  currentCategories: Category[];
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
  savedModules,
  onSaveModule,
  onLoadModule,
  onDeleteModule,
}: Props) {
  const [moduleName, setModuleName] = useState("");
  const isPreset = PRESET_VALUES.has(settings.currency);
  const isNone = settings.currency === "";
  const [customMode, setCustomMode] = useState(!isPreset && !isNone);
  const [customCurrency, setCustomCurrency] = useState(
    !isPreset && !isNone ? settings.currency : ""
  );

  const selectValue = customMode
    ? CUSTOM_VALUE
    : isNone
    ? NONE_VALUE
    : settings.currency;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Settings</DialogTitle>
          <DialogDescription>
            Configure currency, timer, and manage saved games for different events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Currency */}
          <section className="space-y-2">
            <Label className="text-base font-bold">Currency / Tile prefix</Label>
            <p className="text-sm text-muted-foreground">
              Choose the symbol shown in front of each tile amount, or remove it entirely.
            </p>
            <div className="flex gap-2">
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
                <SelectTrigger className="flex-1">
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
                  maxLength={6}
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
          <section className="space-y-2">
            <Label className="text-base font-bold">
              Question time limit: {settings.timerSeconds}s
            </Label>
            <p className="text-sm text-muted-foreground">
              Seconds shown on the per-question countdown timer. Set to 0 to disable the timer.
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

          {/* Saved modules */}
          <section className="space-y-3 border-t-2 border-border pt-4">
            <div>
              <Label className="text-base font-bold">Saved Games</Label>
              <p className="text-sm text-muted-foreground">
                Save the current categories, questions, and settings as a reusable module for
                future events.
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
                No saved games yet. Save the current game above to reuse it later.
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
                        <div className="text-xs text-muted-foreground">
                          {new Date(m.savedAt).toLocaleString()} · {m.categories.length} categories
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
