export type Weather = "clear" | "cloudy" | "wind" | "snow" | "storm";

export const WEATHER_SEVERITY: Record<Weather, number> = {
  clear: 0,
  cloudy: 1,
  wind: 2,
  snow: 3,
  storm: 4,
};

export type EventSize = "small" | "major";
export type EventPolarity = "good" | "bad";

export interface GameEvent {
  id: string;
  size: EventSize;
  polarity: EventPolarity;
  title: string;
  description: string;
  effect: (state: GameState) => Partial<GameState>;
}

export interface Choice {
  label: string;
  description: string;
  apply: (state: GameState) => Partial<GameState>;
}

export interface HourLog {
  hour: number;
  events: GameEvent[];
  choiceMade?: string;
}

// ── preparation config ───────────────────────────────────────

export type Difficulty = "easy" | "normal" | "hard";

export interface DifficultyModifiers {
  drainMult: number;
  staminaCostMult: number;
  eventBadChanceMod: number;
  majorEventChanceMod: number;
  startingStaminaBonus: number;
  startingSupplyMult: number;
}

export const DIFFICULTY_MODS: Record<Difficulty, DifficultyModifiers> = {
  easy: {
    drainMult: 0.5,
    staminaCostMult: 0.5,
    eventBadChanceMod: -0.1,
    majorEventChanceMod: -0.1,
    startingStaminaBonus: 15,
    startingSupplyMult: 1.5,
  },
  normal: {
    drainMult: 1.0,
    staminaCostMult: 1.0,
    eventBadChanceMod: 0,
    majorEventChanceMod: 0,
    startingStaminaBonus: 0,
    startingSupplyMult: 1.0,
  },
  hard: {
    drainMult: 1.8,
    staminaCostMult: 1.6,
    eventBadChanceMod: 0.15,
    majorEventChanceMod: 0.15,
    startingStaminaBonus: -15,
    startingSupplyMult: 0.7,
  },
};

export type GearOption = "lightweight" | "standard" | "alpine_pro";
export type FoodOption = "energy_bars" | "full_meals" | "minimal";
export type RouteOption = "gouter" | "three_monts" | "grand_mulets";
export type DaysOption = 1 | 2 | 3;
export type TrainingOption = "1week" | "2weeks" | "1month" | "3months";
export type PartyOption = 1 | 2 | 4 | 6;
export type StartHourOption = 3 | 4 | 5 | 6 | 7 | 8;

export type Pace = "slow" | "normal" | "fast";

export const PACE_FACTORS: Record<Pace, { dist: number; stamina: number; hunger: number; water: number; badChance: number; damageMult: number }> = {
  slow:   { dist: 0.6, stamina: 0.6, hunger: 0.7, water: 0.7, badChance: 0.65, damageMult: 0.5 },
  normal: { dist: 1.0, stamina: 1.0, hunger: 1.0, water: 1.0, badChance: 0.70, damageMult: 1.0 },
  fast:   { dist: 1.5, stamina: 1.4, hunger: 1.3, water: 1.3, badChance: 0.80, damageMult: 1.5 },
};

export interface PrepConfig {
  gear: GearOption;
  food: FoodOption;
  route: RouteOption;
  days: DaysOption;
  training: TrainingOption;
  party: PartyOption;
  startHour: StartHourOption;
}

export interface PrepModifiers {
  staminaBonus: number;
  weatherResistance: number;
  baseSpeedBonus: number;
  hungerBonus: number;
}

export const DEFAULT_PREP: PrepConfig = {
  gear: "standard",
  food: "energy_bars",
  route: "gouter",
  days: 2,
  training: "2weeks",
  party: 2,
  startHour: 5,
};

export const ZERO_MODIFIERS: PrepModifiers = {
  staminaBonus: 0,
  weatherResistance: 0,
  baseSpeedBonus: 0,
  hungerBonus: 0,
};

export interface PendingSleep {
  type: "tent" | "hut";
  sleepBonus: number;
  staminaBonus: number;
  mealCost: number;
}

// ── game state ───────────────────────────────────────────────

export interface GameState {
  phase: "title" | "difficulty" | "preparation" | "climbing" | "waking" | "summit" | "failed";
  difficulty: Difficulty;
  hoursHiked: number;
  timeOfDay: number;        // 0–23
  progress: number;          // 0–1
  stamina: number;           // 0–100
  hunger: number;            // 0–100 (body fullness)
  sleep: number;             // 0–100
  water: number;             // 0–100 (body hydration)
  foodSupply: number;        // meals remaining in pack
  waterSupply: number;       // litres remaining in bottles
  partySize: number;         // number of climbers
  layers: number;            // 0–3 clothing layers worn
  crampons: boolean;
  iceAxe: boolean;
  pace: Pace;
  weather: Weather;
  doubleDistance: boolean;
  pendingSleep: PendingSleep | null;
  mainActionsThisHour: number;    // max 1 per hour
  currentEvents: GameEvent[];
  choices: Choice[];
  narrative: string;
  log: HourLog[];
  prepConfig: PrepConfig;
  prepModifiers: PrepModifiers;
}

export const INITIAL_STATE: GameState = {
  phase: "title",
  difficulty: "normal",
  hoursHiked: 0,
  timeOfDay: 5,
  progress: 0,
  stamina: 85,
  hunger: 100,
  sleep: 100,
  water: 100,
  foodSupply: 8,
  waterSupply: 4,
  partySize: 2,
  layers: 2,
  crampons: false,
  iceAxe: false,
  pace: "normal",
  weather: "clear",
  doubleDistance: false,
  pendingSleep: null,
  mainActionsThisHour: 0,
  currentEvents: [],
  choices: [],
  narrative: "",
  log: [],
  prepConfig: DEFAULT_PREP,
  prepModifiers: ZERO_MODIFIERS,
};

export const INLINE_ACTION_LABELS = new Set([
  "Add a Layer",
  "Remove a Layer",
  "Put On Crampons",
  "Take Off Crampons",
  "Ready Ice Axe",
  "Stow Ice Axe",
  "Eat a Meal",
  "Drink Water",
]);

export type Action =
  | { type: "START_GAME" }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty }
  | { type: "START_PREP" }
  | { type: "SET_PREP"; config: PrepConfig }
  | { type: "CONFIRM_PREP" }
  | { type: "ADVANCE_HOUR" }
  | { type: "CHOOSE"; index: number }
  | { type: "WAKE_UP"; wakeHour: number }
  | { type: "BEGIN_DESCENT" };

export function formatTime(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}
