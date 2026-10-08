// Game data for the calculator. Fill in values here as you collect them.

const MAX_LEVEL = 75;

// EXP required to go from level N to level N+1, keyed by N.
// Levels with no entry are treated as "unknown" and reported in the results.
const LEVEL_EXP = {
  61: 234278708,
  62: 7262639948,
  64: 12462690150,
  66: 46361207358,
};

// Max EXP a single monster kill can give, as a percent of the current
// level's EXP requirement. Each entry covers levels up to and including `maxLevel`.
const EXP_CAP_TABLE = [
  { maxLevel: 5, percent: 20 },
  { maxLevel: 10, percent: 18 },
  { maxLevel: 15, percent: 16 },
  { maxLevel: 20, percent: 14 },
  { maxLevel: 25, percent: 12 },
  { maxLevel: 30, percent: 10 },
  { maxLevel: 35, percent: 8 },
  { maxLevel: 40, percent: 6 },
  { maxLevel: 47, percent: 5 },
  { maxLevel: 49, percent: 3.5 },
  { maxLevel: 55, percent: 2 },
  { maxLevel: 61, percent: 0.2 },
  { maxLevel: 64, percent: 0.02 },
  { maxLevel: Infinity, percent: 0.01 },
];

// Grind zones. `expPerMob` is the base EXP per kill before buffs.
const ZONES = [
  { id: "test", name: "Test Area", expPerMob: 88000 },
];

// Combat EXP buffs. Percents are additive with each other.
// These are placeholders: check the values before relying on them.
const BUFFS = [
  { id: "scroll", name: "Combat EXP Scroll", percent: 100 },
  { id: "book", name: "Book of Combat", percent: 50 },
  { id: "guild", name: "Guild Combat EXP Buff", percent: 10 },
  { id: "pet", name: "Pet Combat EXP Skill", percent: 5 },
];
