import { Round } from "@/types/jeopardy";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Props {
  rounds: Round[];
  activeIndex: number;
  onChange: (index: number) => void;
  onAddRound?: () => void;
}

export function RoundSwitcher({ rounds, activeIndex, onChange, onAddRound }: Props) {
  const safeIndex = Math.min(Math.max(0, activeIndex), rounds.length - 1);
  return (
    <div className="flex items-center gap-1 bg-card/60 border-2 border-border rounded-lg p-1">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onChange(Math.max(0, safeIndex - 1))}
        disabled={safeIndex === 0}
        aria-label="Previous round"
        className="h-8 w-8"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Select
        value={String(safeIndex)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="h-8 min-w-[140px] border-0 bg-transparent font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {rounds.map((r, i) => (
            <SelectItem key={r.id} value={String(i)}>
              {r.name || `Round ${i + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onChange(Math.min(rounds.length - 1, safeIndex + 1))}
        disabled={safeIndex === rounds.length - 1}
        aria-label="Next round"
        className="h-8 w-8"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      {onAddRound && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddRound}
          className="h-8 font-bold"
          aria-label="Add round"
        >
          <Plus className="w-4 h-4 mr-1" /> Round
        </Button>
      )}
    </div>
  );
}
