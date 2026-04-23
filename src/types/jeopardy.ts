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

export interface GameState {
  categories: Category[];
  teams: Team[];
  usedTileIds: string[];
  soundEnabled: boolean;
}
