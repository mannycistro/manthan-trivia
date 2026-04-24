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

/**
 * Compact horizontal scoreboard designed to live in a sticky bottom bar.
 * Teams render side-by-side; controls stay inline to minimize vertical space.
 */
export function ScoreboardBar({
  teams,
  defaultDelta = 100,
  onUpdateName,
  onAdjustScore,
  onAddTeam,
  onRemoveTeam,
}: Props) {
  const [delta, setDelta] = useState<number>(defaultDelta);

  return (
    <div className="bg-card/80 backdrop-blur border-t-2 border-border px-3 md:px-6 py-2 md:py-3">
      <div className="flex items-stretch gap-3 md:gap-4">
        {/* Points selector — compact column */}
        <div className="hidden md:flex flex-col justify-center gap-1 shrink-0 pr-3 border-r border-border/60">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Points
          </span>
          <div className="flex items-center gap-1 flex-wrap max-w-[260px]">
            {QUICK.map((v) => (
              <Button
                key={v}
                size="sm"
                variant={delta === v ? "default" : "secondary"}
                onClick={() => setDelta(v)}
                className="font-display h-7 px-2 text-xs"
              >
                {v}
              </Button>
            ))}
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value) || 0)}
              className="w-16 h-7 text-xs"
            />
          </div>
        </div>

        {/* Teams strip */}
        <div className="flex-1 flex gap-2 md:gap-3 overflow-x-auto">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex-1 min-w-[160px] bg-secondary/80 border-2 border-border rounded-lg px-2 py-1.5 flex items-center gap-2"
            >
              {/* Name + score column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Input
                    value={team.name}
                    onChange={(e) => onUpdateName(team.id, e.target.value)}
                    className="font-bold text-sm h-6 px-1 bg-background/40 border-0 focus-visible:ring-1"
                  />
                  {teams.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 shrink-0"
                      onClick={() => onRemoveTeam(team.id)}
                      aria-label="Remove team"
                    >
                      <UserMinus className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="font-display text-2xl md:text-3xl text-primary text-shadow-jeopardy tabular-nums leading-none mt-0.5">
                  {team.score}
                </div>
              </div>

              {/* +/- buttons stacked */}
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  onClick={() => onAdjustScore(team.id, delta)}
                  className="h-7 px-2 font-bold bg-success hover:bg-success/90 text-success-foreground"
                  size="sm"
                  aria-label={`Add ${delta}`}
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  {delta}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onAdjustScore(team.id, -delta)}
                  className="h-7 px-2 font-bold"
                  size="sm"
                  aria-label={`Subtract ${delta}`}
                >
                  <Minus className="w-3 h-3 mr-0.5" />
                  {delta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add team + mobile points */}
        <div className="flex flex-col justify-center gap-1 shrink-0">
          {teams.length < 4 && (
            <Button size="sm" variant="outline" onClick={onAddTeam} className="h-7">
              <UserPlus className="w-3 h-3 mr-1" /> Team
            </Button>
          )}
          <div className="md:hidden">
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value) || 0)}
              className="w-16 h-7 text-xs"
              aria-label="Points delta"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
