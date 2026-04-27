export type MediaType = "none" | "image" | "video" | "audio";

export interface Question {
  id: string;
  value: number;
  question: string;
  answer: string;
  mediaType: MediaType;
  mediaUrl?: string;
}

export interface Category {
  id: string;
  title: string;
  questions: Question[];
  /** Optional per-category override for the title font family. */
  titleFontFamily?: string;
  /** Optional per-category override for the title base (max) font size in px. */
  titleFontSize?: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface KeyBindings {
  correct: string;
  wrong: string;
  reveal: string;
}

export interface GameSettings {
  currency: string;
  timerSeconds: number;
  categoryFontFamily?: string;
  categoryFontSize?: number; // base (max) px
  volume?: number; // 0..1 master volume
  keyBindings?: KeyBindings;
}

export interface Round {
  id: string;
  name: string;
  rows: number;
  cols: number;
  baseValue: number;
  valueStep: number;
  categories: Category[]; // length === cols, each with `rows` questions
  usedTileIds: string[];
}

export interface GameState {
  gameName: string;
  rounds: Round[];
  activeRoundIndex: number;
  teams: Team[];
  soundEnabled: boolean;
  settings: GameSettings;
}

export interface SavedGameModule {
  id: string;
  name: string;
  savedAt: number;
  gameName: string;
  rounds: Round[];
  settings: GameSettings;
}
