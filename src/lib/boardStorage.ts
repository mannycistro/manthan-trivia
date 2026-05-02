import { GameSettings, Round } from "@/types/jeopardy";
import { defaultRounds, defaultTeams } from "@/lib/defaultGame";

const BOARDS_KEY = "jeopardy-boards-v2";
const ACTIVE_BOARD_KEY = "jeopardy-active-board-id";

// Legacy keys for migration
const LEGACY_STORAGE_KEY = "jeopardy-game-v1";
const LEGACY_MODULES_KEY = "jeopardy-modules-v1";

export const DEFAULT_SETTINGS: GameSettings = {
  currency: "$",
  timerSeconds: 30,
  categoryFontFamily: "Montserrat",
  categoryFontSize: 32,
  volume: 0.8,
  keyBindings: { correct: "y", wrong: "n", reveal: "Space" },
};

export interface StoredBoard {
  id: string;
  gameName: string;
  rounds: Round[];
  activeRoundIndex: number;
  teams: { id: string; name: string; score: number }[];
  soundEnabled: boolean;
  settings: GameSettings;
  createdAt: number;
  updatedAt: number;
}

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

/** One-time migration from legacy storage to new unified format */
function migrateLegacyData(): StoredBoard[] {
  const boards: StoredBoard[] = [];
  const now = Date.now();

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rounds = migrateRounds(parsed);
      if (rounds && rounds.length > 0) {
        boards.push({
          id: `b-${now}`,
          gameName: parsed.gameName ?? "Jeopardy!",
          rounds,
          activeRoundIndex: parsed.activeRoundIndex ?? 0,
          teams: parsed.teams ?? defaultTeams(),
          soundEnabled: parsed.soundEnabled ?? true,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch {}

  try {
    const raw = localStorage.getItem(LEGACY_MODULES_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as any[];
      arr.forEach((m, i) => {
        const rounds = migrateRounds(m);
        if (rounds && rounds.length > 0) {
          // Avoid duplicating the current board if it matches
          boards.push({
            id: m.id ?? `b-${now + i + 1}`,
            gameName: m.gameName ?? m.name ?? "Jeopardy!",
            rounds,
            activeRoundIndex: 0,
            teams: defaultTeams(),
            soundEnabled: true,
            settings: { ...DEFAULT_SETTINGS, ...(m.settings ?? {}) },
            createdAt: m.savedAt ?? now,
            updatedAt: m.savedAt ?? now,
          });
        }
      });
    }
  } catch {}

  if (boards.length > 0) {
    try {
      localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
      localStorage.setItem(ACTIVE_BOARD_KEY, boards[0].id);
    } catch (e) {
      console.warn("Migration write failed (quota). Skipping persistent migration.", e);
    }
    // Clean up legacy keys regardless to free space and avoid re-triggering
    try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch {}
    try { localStorage.removeItem(LEGACY_MODULES_KEY); } catch {}
  }

  return boards;
}

export function loadAllBoards(): StoredBoard[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    if (raw) {
      return JSON.parse(raw) as StoredBoard[];
    }
  } catch {}

  // Try legacy migration
  return migrateLegacyData();
}

export function saveAllBoards(boards: StoredBoard[]) {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function getBoard(id: string): StoredBoard | null {
  const boards = loadAllBoards();
  return boards.find((b) => b.id === id) ?? null;
}

export function saveBoard(board: StoredBoard) {
  const boards = loadAllBoards();
  const idx = boards.findIndex((b) => b.id === board.id);
  if (idx >= 0) {
    boards[idx] = { ...board, updatedAt: Date.now() };
  } else {
    boards.push({ ...board, updatedAt: Date.now() });
  }
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function deleteBoard(id: string) {
  const boards = loadAllBoards().filter((b) => b.id !== id);
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function createNewBoard(): StoredBoard {
  const now = Date.now();
  return {
    id: `b-${now}`,
    gameName: "Jeopardy!",
    rounds: defaultRounds(),
    activeRoundIndex: 0,
    teams: defaultTeams(),
    soundEnabled: true,
    settings: { ...DEFAULT_SETTINGS },
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateBoard(source: StoredBoard): StoredBoard {
  const now = Date.now();
  const copy: StoredBoard = JSON.parse(JSON.stringify(source));
  copy.id = `b-${now}`;
  copy.gameName = `${source.gameName} (copy)`;
  copy.createdAt = now;
  copy.updatedAt = now;
  // Re-id rounds, categories, questions for uniqueness
  copy.rounds = copy.rounds.map((r, ri) => ({
    ...r,
    id: `r-${now}-${ri}`,
    usedTileIds: [],
    categories: r.categories.map((c, ci) => ({
      ...c,
      id: `cat-${now}-${ri}-${ci}`,
      questions: c.questions.map((q, qi) => ({
        ...q,
        id: `q-${now}-${ri}-${ci}-${qi}`,
      })),
    })),
  }));
  copy.teams = copy.teams.map((t) => ({ ...t, score: 0 }));
  return copy;
}

export function getActiveBoardId(): string | null {
  return localStorage.getItem(ACTIVE_BOARD_KEY);
}

export function setActiveBoardId(id: string) {
  localStorage.setItem(ACTIVE_BOARD_KEY, id);
}
