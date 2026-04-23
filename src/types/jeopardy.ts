export type MediaType = "none" | "image" | "video" | "audio";

export interface Question {
  id: string;
  value: number;
  question: string;
  answer: string;
  mediaType: MediaType;
  mediaUrl?: string; // data URL for uploads OR external URL (YouTube, etc.)
}

export interface Category {
  id: string;
  title: string;
  questions: Question[]; // length 5
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  currency: string; // e.g. "$", "€", "£", "¥", "₹", "" (none), or custom
  timerSeconds: number; // per-question timer duration
}

export interface GameState {
  categories: Category[];
  teams: Team[];
  usedTileIds: string[];
  soundEnabled: boolean;
  settings: GameSettings;
}

export interface SavedGameModule {
  id: string;
  name: string;
  savedAt: number;
  categories: Category[];
  settings: GameSettings;
}
