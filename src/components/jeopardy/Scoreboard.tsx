import { Team } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, UserPlus, UserMinus } from "lucide-react";
import { useState } from "react";

interface Props {
  teams: Team[];
  defaultDelta?: number;
  onUpdateName: (id: string, name: string) => void;
  onAdjustScore: (id: string, delta: number) => void;
  onAddTeam: () => void;
  onRemoveTeam: (id: string) => void;
}

const QUICK = [100, 200, 300, 400, 500];

export function Scoreboard({
  teams,
  defaultDelta = 100,
  onUpdateName,
  onAdjustScore,
  onAddTeam,
  onRemoveTeam,
}: Props) {
  const [delta, setDelta] = useState<number>(defaultDelta);

  return (
    <div className="bg-card/60 backdrop-blur border-2 border-border rounded-2xl p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl md:text-2xl text-primary text-shadow-jeopardy">
          SCOREBOARD
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Points:</span>
          {QUICK.map((v) => (
            <Button
              key={v}
              size="sm"
              variant={delta === v ? "default" : "secondary"}
              onClick={() => setDelta(v)}
              className="font-display"
            >
              {v}
            </Button>
          ))}
          <Input
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value) || 0)}
            className="w-20 h-9"
          />
          {teams.length < 4 && (
            <Button size="sm" variant="outline" onClick={onAddTeam}>
              <UserPlus className="w-4 h-4 mr-1" /> Team
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-secondary/80 border-2 border-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-1">
              <Input
                value={team.name}
                onChange={(e) => onUpdateName(team.id, e.target.value)}
                className="font-bold text-lg bg-background/40 border-border"
              />
              {teams.length > 2 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onRemoveTeam(team.id)}
                  aria-label="Remove team"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="font-display text-4xl md:text-5xl text-center text-primary text-shadow-jeopardy tabular-nums py-1">
              {team.score}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="destructive"
                onClick={() => onAdjustScore(team.id, -delta)}
                className="font-bold"
              >
                <Minus className="w-4 h-4 mr-1" /> {delta}
              </Button>
              <Button
                onClick={() => onAdjustScore(team.id, delta)}
                className="font-bold bg-success hover:bg-success/90 text-success-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> {delta}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
