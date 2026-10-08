// Game data for the calculator. Fill in values here as you collect them.

const MAX_LEVEL = 75;

// EXP required to go from level N to level N+1, keyed by N.
// Levels with no entry are treated as "unknown" and reported in the results.
const LEVEL_EXP = {
  61: 234278708,
  62: 7262639948,
  63: 9441431932,
  64: 12462690150,
  66: 46361207358,
  69: 84179249590,
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

// Grind zones. `level` is the zone's level, shown before its name.
// `mobs` lists each monster that spawns there with its base EXP per kill (before buffs).
// Mark a mob `elite: true` to leave it out of the zone average, which is used
// when no kills per hour are entered.
const ZONES = [
  {
    id: "aphrodon", level: 71, name: "Aphrodon",
    mobs: [
      { name: "Goldfield Scarecrow", exp: 88695 },
      { name: "Goldfield Harvester", exp: 88695 },
      { name: "Goldfield Tiller", exp: 88695 },
      { name: "Goldfield Keeper", exp: 85147 },
      { name: "Goldfield Sower", exp: 88695 },
      { name: "Blessed Goldfield Scarecrow", exp: 106434, elite: true },
      { name: "Rapture Blessed Scarecrow", exp: 133042, elite: true },
    ],
  },
  {
    id: "hermesia", level: 72, name: "Hermesia",
    mobs: [
      { name: "Markthanan's Daughter", exp: 159045, elite: true },
      { name: "Enslaved Overseer", exp: 111331 },
      { name: "Enslaved Miner", exp: 106030 },
      { name: "Enslaved Porter", exp: 100728 },
      { name: "Markthanan's Servant", exp: 212060, elite: true },
    ],
  },
  {
    id: "magaia", level: 73, name: "Magaia",
    mobs: [
      { name: "Sinner of Accusation", exp: 82555 },
      { name: "Sinner of Incitement", exp: 82555 },
      { name: "Aetos", exp: 82555 },
      { name: "Sinner of Blind Faith", exp: 86901 },
      { name: "Sinner of Rejection", exp: 86901 },
      { name: "Sinner of Invasion", exp: 86901 },
      { name: "Priest of the End", exp: 173802, elite: true },
      { name: "Knight of Famine", exp: 104281, elite: true },
      { name: "Knight of Conquest", exp: 104281, elite: true },
      { name: "Knight of War", exp: 104281, elite: true },
    ],
  },
  {
    id: "aresion", level: 74, name: "Aresion",
    mobs: [
      { name: "Curved Blade", exp: 161240 },
      { name: "Tempered Spear", exp: 161240 },
      { name: "Steadfast Arrow", exp: 161240 },
      { name: "Herald of Flame", exp: 161240 },
      { name: "Reforged Curved Blade", exp: 177364, elite: true },
      { name: "Reforged Tempered Spear", exp: 177364, elite: true },
      { name: "Reforged Steadfast Arrow", exp: 177364, elite: true },
      { name: "Reforged Herald of Flame", exp: 177364, elite: true },
    ],
  },
  {
    id: "scales-of-judgment", level: 74, name: "Scales of Judgment",
    mobs: [
      { name: "Chaos Elion's Resentment", exp: 332580, elite: true },
      { name: "Keeper Aetos", exp: 149661 },
      { name: "Sinner of Accusation", exp: 161301 },
      { name: "Sinner of Incitement", exp: 161301 },
      { name: "Aetos", exp: 149661 },
      { name: "Sinner of Blind Faith", exp: 166290 },
      { name: "Sinner of Rejection", exp: 166290 },
      { name: "Sinner of Invasion", exp: 166290 },
      { name: "Witness Priest of the End", exp: 249435, elite: true },
      // Individual names are cut off in-game; every variant gives the same EXP.
      { name: "Follower of Justice Sinners", exp: 157975 },
      { name: "Follower of Vengeance Sinners", exp: 157975 },
    ],
  },
  {
    id: "event-horizon", level: 75, name: "Event Horizon",
    mobs: [
      { name: "Despairbringer", exp: 175259, elite: true },
      { name: "Shadow Ibedor", exp: 238990, elite: true },
      { name: "Despair-Consumed Knight", exp: 156140 },
      { name: "Despair-Consumed Valkyrie", exp: 156140 },
      { name: "Despair-Consumed Blader", exp: 157733 },
      { name: "Despair-Consumed Mercenary", exp: 157733 },
      { name: "Despair-Consumed Archer", exp: 154547 },
      { name: "Despair-Consumed Sorceress", exp: 154547 },
      { name: "Despair-Consumed Successor", exp: 154547 },
      { name: "Despair-Consumed Mermaid", exp: 152953 },
      { name: "Despair-Consumed Pirate", exp: 152953 },
    ],
  },
];

// Combat EXP buffs. Percents are additive with each other.
// These are placeholders: check the values before relying on them.
const BUFFS = [
  { id: "scroll", name: "Combat EXP Scroll", percent: 100 },
  { id: "book", name: "Book of Combat", percent: 50 },
  { id: "guild", name: "Guild Combat EXP Buff", percent: 10 },
  { id: "pet", name: "Pet Combat EXP Skill", percent: 5 },
];
