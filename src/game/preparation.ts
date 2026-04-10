import type {
  PrepConfig,
  PrepModifiers,
  GearOption,
  FoodOption,
  RouteOption,
  DaysOption,
  TrainingOption,
  PartyOption,
  StartHourOption,
} from "./types";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── option metadata (labels, descriptions, modifiers) ────────

export interface OptionMeta {
  label: string;
  description: string;
  mods: Partial<PrepModifiers>;
}

export const GEAR_OPTIONS: Record<GearOption, OptionMeta> = {
  lightweight: {
    label: "Lightweight",
    description: "Fast but fragile. +5 stamina, -1 weather resistance.",
    mods: { staminaBonus: 5, weatherResistance: -1 },
  },
  standard: {
    label: "Standard",
    description: "Balanced kit. No modifiers.",
    mods: {},
  },
  alpine_pro: {
    label: "Alpine Pro",
    description: "Heavy but safe. -5 stamina, +2 weather resistance.",
    mods: { staminaBonus: -5, weatherResistance: 2 },
  },
};

export const FOOD_OPTIONS: Record<FoodOption, OptionMeta> = {
  energy_bars: {
    label: "Energy Bars",
    description: "Light and quick. +3 stamina, -5 hunger.",
    mods: { staminaBonus: 3, hungerBonus: -5 },
  },
  full_meals: {
    label: "Full Meals",
    description: "Hearty food, heavy pack. +8 stamina, +10 hunger, -0.005 speed.",
    mods: { staminaBonus: 8, hungerBonus: 10, baseSpeedBonus: -0.005 },
  },
  minimal: {
    label: "Minimal Rations",
    description: "Saves weight but risky. -5 stamina, -15 hunger.",
    mods: { staminaBonus: -5, hungerBonus: -15 },
  },
};

export const ROUTE_OPTIONS: Record<RouteOption, OptionMeta> = {
  gouter: {
    label: "Gouter Route (Normal)",
    description: "The classic route. Balanced difficulty.",
    mods: {},
  },
  three_monts: {
    label: "Three Monts Traverse",
    description: "Shorter but technical. +0.01 speed, -5 stamina, -1 weather resistance.",
    mods: { baseSpeedBonus: 0.01, staminaBonus: -5, weatherResistance: -1 },
  },
  grand_mulets: {
    label: "Grand Mulets Route",
    description: "Longer but sheltered. -0.005 speed, +1 weather resistance.",
    mods: { baseSpeedBonus: -0.005, weatherResistance: 1 },
  },
};

export const DAYS_OPTIONS: Record<DaysOption, OptionMeta> = {
  1: {
    label: "1-Day Push",
    description: "Aggressive pace. +0.01 speed, -10 stamina.",
    mods: { baseSpeedBonus: 0.01, staminaBonus: -10 },
  },
  2: {
    label: "2-Day Climb",
    description: "Standard schedule. No modifiers.",
    mods: {},
  },
  3: {
    label: "3-Day Expedition",
    description: "Slow and steady. -0.005 speed, +10 stamina.",
    mods: { baseSpeedBonus: -0.005, staminaBonus: 10 },
  },
};

export const TRAINING_OPTIONS: Record<TrainingOption, OptionMeta> = {
  "1week": {
    label: "1 Week",
    description: "Barely ready. -10 stamina.",
    mods: { staminaBonus: -10 },
  },
  "2weeks": {
    label: "2 Weeks",
    description: "Adequate preparation. No modifiers.",
    mods: {},
  },
  "1month": {
    label: "1 Month",
    description: "Well prepared. +10 stamina.",
    mods: { staminaBonus: 10 },
  },
  "3months": {
    label: "3 Months",
    description: "Peak fitness. +20 stamina, +1 weather resistance.",
    mods: { staminaBonus: 20, weatherResistance: 1 },
  },
};

export const PARTY_OPTIONS: Record<PartyOption, OptionMeta> = {
  1: {
    label: "Solo",
    description: "Just you. Fast but vulnerable — no one to help.",
    mods: { baseSpeedBonus: 0.005, staminaBonus: -5, weatherResistance: -1 },
  },
  2: {
    label: "Pair",
    description: "You and a partner. Good balance of speed and safety.",
    mods: {},
  },
  4: {
    label: "Small Team (4)",
    description: "Safer together. +5 stamina, +1 weather res, slightly slower.",
    mods: { baseSpeedBonus: -0.005, staminaBonus: 5, weatherResistance: 1 },
  },
  6: {
    label: "Large Expedition (6)",
    description: "Maximum safety but slow. +10 stamina, +2 weather res.",
    mods: { baseSpeedBonus: -0.01, staminaBonus: 10, weatherResistance: 2 },
  },
};

export const START_HOUR_OPTIONS: Record<StartHourOption, OptionMeta> = {
  3: {
    label: "3:00 AM",
    description: "Very cold and icy. Safest from avalanche but brutal conditions.",
    mods: {},
  },
  4: {
    label: "4:00 AM",
    description: "Cold and dark. Low avalanche risk, hard frozen terrain.",
    mods: {},
  },
  5: {
    label: "5:00 AM",
    description: "Classic alpine start. Good balance of cold and safety.",
    mods: {},
  },
  6: {
    label: "6:00 AM",
    description: "Dawn start. Warming up, ice begins to soften.",
    mods: {},
  },
  7: {
    label: "7:00 AM",
    description: "Late start. Warmer but rising avalanche risk.",
    mods: {},
  },
  8: {
    label: "8:00 AM",
    description: "Very late. Warm, soft snow, high avalanche and dehydration risk.",
    mods: {},
  },
};

// ── supply computation ──────────────────────────────────────

const BASE_FOOD_MEALS: Record<FoodOption, number> = {
  energy_bars: 8,
  full_meals: 12,
  minimal: 5,
};

const BASE_WATER_L = 4;

export function computeStartingFoodSupply(config: PrepConfig): number {
  return BASE_FOOD_MEALS[config.food] * config.days;
}

export function computeStartingWaterSupply(config: PrepConfig): number {
  return BASE_WATER_L * config.days;
}

export function mealCostPerEat(partySize: number): number {
  return Math.ceil(partySize / 2);
}

export function waterCostPerDrink(partySize: number): number {
  return +(partySize * 0.2).toFixed(1);
}

// ── computation ──────────────────────────────────────────────

function addMods(base: PrepModifiers, partial: Partial<PrepModifiers>): PrepModifiers {
  return {
    staminaBonus: base.staminaBonus + (partial.staminaBonus ?? 0),
    weatherResistance: base.weatherResistance + (partial.weatherResistance ?? 0),
    baseSpeedBonus: base.baseSpeedBonus + (partial.baseSpeedBonus ?? 0),
    hungerBonus: base.hungerBonus + (partial.hungerBonus ?? 0),
  };
}

export function computeModifiers(config: PrepConfig): PrepModifiers {
  let m: PrepModifiers = { staminaBonus: 0, weatherResistance: 0, baseSpeedBonus: 0, hungerBonus: 0 };
  m = addMods(m, GEAR_OPTIONS[config.gear].mods);
  m = addMods(m, FOOD_OPTIONS[config.food].mods);
  m = addMods(m, ROUTE_OPTIONS[config.route].mods);
  m = addMods(m, DAYS_OPTIONS[config.days].mods);
  m = addMods(m, TRAINING_OPTIONS[config.training].mods);
  m = addMods(m, PARTY_OPTIONS[config.party].mods);
  return m;
}

const BASE_STAMINA = 85;
const BASE_HUNGER = 100;

export function computeStartingStamina(mods: PrepModifiers): number {
  return clamp(BASE_STAMINA + mods.staminaBonus, 30, 100);
}

export function computeStartingHunger(mods: PrepModifiers): number {
  return clamp(BASE_HUNGER + mods.hungerBonus, 50, 100);
}
