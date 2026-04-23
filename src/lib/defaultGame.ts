import { Category, Team } from "@/types/jeopardy";

const VALUES = [100, 200, 300, 400, 500];

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

export function defaultCategories(): Category[] {
  return seedCategories.map((c, ci) => ({
    id: `cat-${ci}`,
    title: c.title,
    questions: c.qa.map((qa, qi) => ({
      id: `q-${ci}-${qi}`,
      value: VALUES[qi],
      question: qa.q,
      answer: qa.a,
      mediaType: "none" as const,
    })),
  }));
}

export function defaultTeams(): Team[] {
  return [
    { id: "t-1", name: "Team 1", score: 0 },
    { id: "t-2", name: "Team 2", score: 0 },
  ];
}
