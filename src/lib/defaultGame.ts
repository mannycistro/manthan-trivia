import { Category, Question, Round, Team } from "@/types/jeopardy";

let _idc = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(_idc++).toString(36)}`;

export function makeQuestion(value: number, question = "", answer = ""): Question {
  return {
    id: uid("q"),
    value,
    question,
    answer,
    mediaType: "none",
  };
}

export function makeCategory(title: string, rows: number, baseValue: number, valueStep: number): Category {
  return {
    id: uid("cat"),
    title,
    questions: Array.from({ length: rows }, (_, i) => makeQuestion(baseValue + valueStep * i)),
  };
}

export function makeRound(
  name: string,
  rows: number,
  cols: number,
  baseValue: number,
  valueStep: number
): Round {
  return {
    id: uid("r"),
    name,
    rows,
    cols,
    baseValue,
    valueStep,
    categories: Array.from({ length: cols }, (_, i) =>
      makeCategory(`Category ${i + 1}`, rows, baseValue, valueStep)
    ),
    usedTileIds: [],
  };
}

const seedCategories: { title: string; qa: { q: string; a: string }[] }[] = [
  {
    title: "WORLD CAPITALS",
    qa: [
      { q: "The capital of France.", a: "What is Paris?" },
      { q: "The capital of Japan.", a: "What is Tokyo?" },
      { q: "The capital of Australia.", a: "What is Canberra?" },
      { q: "The capital of Kenya.", a: "What is Nairobi?" },
      { q: "The capital of Bhutan.", a: "What is Thimphu?" },
    ],
  },
  {
    title: "SCIENCE",
    qa: [
      { q: "H2O is the chemical formula for this.", a: "What is water?" },
      { q: "The closest planet to the Sun.", a: "What is Mercury?" },
      { q: "This force keeps us on the ground.", a: "What is gravity?" },
      { q: "The powerhouse of the cell.", a: "What is the mitochondria?" },
      { q: "The speed of light in a vacuum, in km/s (rounded).", a: "What is 300,000?" },
    ],
  },
  {
    title: "MOVIES",
    qa: [
      { q: "Director of Jurassic Park.", a: "Who is Steven Spielberg?" },
      { q: "The highest grossing film of all time (2023).", a: "What is Avatar?" },
      { q: "Actor who played Iron Man.", a: "Who is Robert Downey Jr.?" },
      { q: "Studio behind Toy Story.", a: "What is Pixar?" },
      { q: "Year the first Star Wars was released.", a: "What is 1977?" },
    ],
  },
  {
    title: "HISTORY",
    qa: [
      { q: "Year WWII ended.", a: "What is 1945?" },
      { q: "First president of the USA.", a: "Who is George Washington?" },
      { q: "Civilization that built Machu Picchu.", a: "Who are the Incas?" },
      { q: "Year the Berlin Wall fell.", a: "What is 1989?" },
      { q: "Pharaoh found by Howard Carter in 1922.", a: "Who is Tutankhamun?" },
    ],
  },
  {
    title: "POTPOURRI",
    qa: [
      { q: "Number of continents.", a: "What is 7?" },
      { q: "Largest ocean on Earth.", a: "What is the Pacific?" },
      { q: "Currency of the United Kingdom.", a: "What is the pound sterling?" },
      { q: "Tallest mammal.", a: "What is the giraffe?" },
      { q: "Language with the most native speakers.", a: "What is Mandarin Chinese?" },
    ],
  },
];

export function defaultRound(): Round {
  const baseValue = 100;
  const valueStep = 100;
  const rows = 5;
  const cols = 5;
  return {
    id: uid("r"),
    name: "Round 1",
    rows,
    cols,
    baseValue,
    valueStep,
    categories: seedCategories.map((c) => ({
      id: uid("cat"),
      title: c.title,
      questions: c.qa.map((qa, qi) => ({
        id: uid("q"),
        value: baseValue + valueStep * qi,
        question: qa.q,
        answer: qa.a,
        mediaType: "none" as const,
      })),
    })),
    usedTileIds: [],
  };
}

export function defaultRounds(): Round[] {
  return [defaultRound()];
}

// Legacy helpers (kept so other imports don't break)
export function defaultCategories(): Category[] {
  return defaultRound().categories;
}

export function defaultTeams(): Team[] {
  return [
    { id: "t-1", name: "Team 1", score: 0 },
    { id: "t-2", name: "Team 2", score: 0 },
  ];
}

/**
 * Resize a round to new (rows, cols) preserving existing content where possible.
 * New tiles get auto-filled values from baseValue/valueStep.
 */
export function resizeRound(
  round: Round,
  rows: number,
  cols: number,
  baseValue = round.baseValue,
  valueStep = round.valueStep
): Round {
  const newCategories: Category[] = Array.from({ length: cols }, (_, ci) => {
    const existing = round.categories[ci];
    const title = existing?.title ?? `Category ${ci + 1}`;
    const id = existing?.id ?? uid("cat");
    const questions: Question[] = Array.from({ length: rows }, (_, qi) => {
      const ex = existing?.questions[qi];
      const value = baseValue + valueStep * qi;
      if (ex) return { ...ex, value };
      return makeQuestion(value);
    });
    return { id, title, questions };
  });
  const newIds = new Set(newCategories.flatMap((c) => c.questions.map((q) => q.id)));
  return {
    ...round,
    rows,
    cols,
    baseValue,
    valueStep,
    categories: newCategories,
    usedTileIds: round.usedTileIds.filter((id) => newIds.has(id)),
  };
}

/**
 * Re-apply baseValue/valueStep across all tiles of a round.
 */
export function rescaleRoundValues(round: Round, baseValue: number, valueStep: number): Round {
  return {
    ...round,
    baseValue,
    valueStep,
    categories: round.categories.map((c) => ({
      ...c,
      questions: c.questions.map((q, qi) => ({ ...q, value: baseValue + valueStep * qi })),
    })),
  };
}
