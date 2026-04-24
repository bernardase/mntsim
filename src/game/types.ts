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
  /** If true, this event ends the climb when it occurs (after effects apply). */
  lethal?: boolean;
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
  hoursHiked: number;       // cumulative hours on trail (fractional ok)
  timeOfDay: number;        // clock 0–24 (fractional hours; advances each main action)
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
  mainActionsThisHour: number;    // max 1 per clock step (each main action)
  currentEvents: GameEvent[];
  choices: Choice[];
  narrative: string;
  log: HourLog[];
  prepConfig: PrepConfig;
  prepModifiers: PrepModifiers;
  /** Safer line above the ice zone: slower progress, lower rockfall/avalanche event weight. */
  detourAvoidingExposure: boolean;
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
  detourAvoidingExposure: false,
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
  /** Advances game clock one step (not a full real hour). */
  | { type: "ADVANCE_HOUR" }
  | { type: "CHOOSE"; index: number }
  | { type: "WAKE_UP"; wakeHour: number }
  | { type: "BEGIN_DESCENT" };

/** Wall-clock advance per main action (20 minutes). */
export const GAME_CLOCK_STEP_HOURS = 20 / 60;

/** Stat-drain multiplier per main action (unchanged from prior tuning). */
export const GAME_STAT_STEP_MULT = 2;

/** Chance hourly roll returns no events (restful / quiet step). */
export const ROLL_NO_EVENT_CHANCE = 0.38;

export function formatTime(clockHours: number): string {
  const hRaw = ((clockHours % 24) + 24) % 24;
  const totalMinutes = Math.round(hRaw * 60) % (24 * 60);
  const h24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const displayH = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${displayH}:${mins.toString().padStart(2, "0")} ${period}`;
}

/** Cumulative trail time for UI (e.g. "2 h 20 min"). */
export function formatTrailElapsed(trailHours: number): string {
  const m = Math.round(trailHours * 60);
  if (m <= 0) return "0 min";
  if (m < 60) return `${m} min`;
  const hr = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hr} h` : `${hr} h ${rem} min`;
}
