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
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  currency: string;
  timerSeconds: number;
  categoryFontFamily?: string;
  categoryFontSize?: number; // base (max) px
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
