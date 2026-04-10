import type { GameEvent, GameState, Weather, Choice, Pace } from "./types";
import { WEATHER_SEVERITY, PACE_FACTORS, formatTime } from "./types";
import {
  currentWaypoint as getWaypoint,
  altitudeAtProgress,
  temperatureAt,
  effectiveTemperature,
  icinessAtProgress,
  terrainLabel,
  timeOfDayIcinessMod,
  avalancheRiskMod,
} from "./route";
import { mealCostPerEat, waterCostPerDrink } from "./preparation";

// ── helpers ──────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function worsenWeather(w: Weather): Weather {
  const order: Weather[] = ["clear", "cloudy", "wind", "snow", "storm"];
  return order[Math.min(order.indexOf(w) + 1, order.length - 1)];
}

function improveWeather(w: Weather): Weather {
  const order: Weather[] = ["clear", "cloudy", "wind", "snow", "storm"];
  return order[Math.max(order.indexOf(w) - 1, 0)];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cramponSpeedMod(equipped: boolean, iciness: number): number {
  if (equipped) {
    return iciness >= 0.5 ? 0.01 : -0.01 * (1 - iciness);
  }
  return iciness >= 0.5 ? -0.02 * iciness : 0;
}

function cramponStaminaMod(equipped: boolean, iciness: number): number {
  if (equipped) {
    return iciness >= 0.5 ? -3 : 2 * (1 - iciness);
  }
  return iciness >= 0.5 ? 5 * iciness : 0;
}

function iceAxeSpeedMod(equipped: boolean, iciness: number): number {
  if (equipped) {
    return iciness >= 0.5 ? 0.005 : -0.005 * (1 - iciness);
  }
  return iciness >= 0.5 ? -0.01 * iciness : 0;
}

function iceAxeStaminaMod(equipped: boolean, iciness: number): number {
  if (equipped) {
    return iciness >= 0.5 ? -2 : 1;
  }
  return iciness >= 0.5 ? 3 * iciness : 0;
}

function adjustedIciness(progress: number, timeOfDay: number): number {
  return clamp(icinessAtProgress(progress) + timeOfDayIcinessMod(timeOfDay), 0, 1);
}

// ── event pools ──────────────────────────────────────────────

const SMALL_GOOD: Omit<GameEvent, "id">[] = [
  {
    size: "small",
    polarity: "good",
    title: "Second Wind",
    description: "A surge of energy — your legs feel lighter.",
    effect: (s) => ({ stamina: clamp(s.stamina + 10, 0, 100) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Trail Snack",
    description: "You find an energy bar in your pocket. Nice.",
    effect: (s) => ({ stamina: clamp(s.stamina + 5, 0, 100) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Tailwind",
    description: "The wind shifts behind you, pushing you uphill.",
    effect: () => ({ doubleDistance: true }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Clearing Skies",
    description: "The clouds part and sunshine warms you.",
    effect: (s) => ({ weather: improveWeather(s.weather) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Fellow Climber's Tip",
    description: "A descending climber points out a shortcut.",
    effect: (s) => ({ progress: clamp(s.progress + 0.02, 0, 1) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Hot Soup",
    description: "Another climber shares a thermos of hot soup.",
    effect: (s) => ({ hunger: clamp(s.hunger + 15, 0, 100) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Power Nap",
    description: "You find a sheltered spot and doze for 20 minutes.",
    effect: (s) => ({ sleep: clamp(s.sleep + 10, 0, 100) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Mountain Stream",
    description: "You find a trickle of meltwater and fill your bottles.",
    effect: (s) => ({ waterSupply: +(s.waterSupply + 1.0).toFixed(1) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Snow Melt",
    description: "You scoop clean snow into your bottle. It melts slowly.",
    effect: (s) => ({ waterSupply: +(s.waterSupply + 0.5).toFixed(1) }),
  },
  {
    size: "small",
    polarity: "good",
    title: "Team Morale",
    description: "Your group shares a laugh. Spirits lift.",
    effect: (s) => (s.partySize > 1
      ? { stamina: clamp(s.stamina + 8, 0, 100) }
      : { stamina: clamp(s.stamina + 3, 0, 100) }),
  },
];

const SMALL_BAD: Omit<GameEvent, "id">[] = [
  {
    size: "small",
    polarity: "bad",
    title: "Loose Rock",
    description: "A rock shifts under your boot. You stumble and bruise your knee.",
    effect: (s) => ({ stamina: clamp(s.stamina - 8 * PACE_FACTORS[s.pace].damageMult, 0, 100) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Headache",
    description: "The altitude presses on your temples. Each step throbs.",
    effect: (s) => ({ stamina: clamp(s.stamina - 6, 0, 100) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Worsening Weather",
    description: "Dark clouds roll in. The temperature drops sharply.",
    effect: (s) => ({ weather: worsenWeather(s.weather) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Slippery Ice",
    description: "A patch of black ice slows your pace.",
    effect: (s) => ({
      stamina: clamp(s.stamina - (s.crampons ? 2 : 6) * PACE_FACTORS[s.pace].damageMult, 0, 100),
      progress: clamp(s.progress - (s.crampons ? 0 : 0.01), 0, 1),
    }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Crampon Trouble",
    description: "A crampon strap loosens. You stop to fix it in the cold.",
    effect: (s) => s.crampons
      ? { stamina: clamp(s.stamina - 5, 0, 100), crampons: false }
      : {},
  },
  {
    size: "small",
    polarity: "bad",
    title: "Heavy Fog",
    description: "Visibility drops to metres. You slow to a crawl.",
    effect: (s) => ({ stamina: clamp(s.stamina - 3, 0, 100) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Spilled Rations",
    description: "Your pack tips and food scatters down the slope.",
    effect: (s) => ({ foodSupply: Math.max(0, s.foodSupply - 2) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Restless Night",
    description: "Howling wind keeps you from resting.",
    effect: (s) => ({ sleep: clamp(s.sleep - 10, 0, 100) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Leaky Bottle",
    description: "Your water bottle has a crack. Precious water seeps out.",
    effect: (s) => ({ waterSupply: Math.max(0, +(s.waterSupply - 0.8).toFixed(1)) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Dry Mouth",
    description: "The thin air parches your throat. You need water badly.",
    effect: (s) => ({ water: clamp(s.water - 8, 0, 100) }),
  },
  {
    size: "small",
    polarity: "bad",
    title: "Group Tension",
    description: "An argument breaks out. Tempers flare in the thin air.",
    effect: (s) => (s.partySize > 1
      ? { stamina: clamp(s.stamina - 6, 0, 100) }
      : { stamina: clamp(s.stamina - 2, 0, 100) }),
  },
];

const MAJOR_GOOD: Omit<GameEvent, "id">[] = [
  {
    size: "major",
    polarity: "good",
    title: "Rescue Helicopter Drop",
    description:
      "A rescue helicopter passes and drops supplies — fresh water, food, and a thermal blanket.",
    effect: (s) => ({
      stamina: clamp(s.stamina + 20, 0, 100),
      foodSupply: s.foodSupply + 4,
      waterSupply: +(s.waterSupply + 2.0).toFixed(1),
      weather: improveWeather(s.weather),
    }),
  },
];

const MAJOR_BAD: Omit<GameEvent, "id">[] = [
  {
    size: "major",
    polarity: "bad",
    title: "Avalanche!",
    description:
      "A wall of snow thunders down the slope. You dive behind a rock. Your gear is buried.",
    effect: (s) => ({
      stamina: clamp(s.stamina - 25 * PACE_FACTORS[s.pace].damageMult, 0, 100),
      foodSupply: Math.max(0, s.foodSupply - 3),
      waterSupply: Math.max(0, +(s.waterSupply - 1.0).toFixed(1)),
      progress: clamp(s.progress - 0.05, 0, 1),
    }),
  },
  {
    size: "major",
    polarity: "bad",
    title: "Whiteout Storm",
    description:
      "A violent storm engulfs the mountain. You can't see your own hand. All you can do is hunker down.",
    effect: (s) => ({
      stamina: clamp(s.stamina - 15, 0, 100),
      weather: "storm" as Weather,
    }),
  },
  {
    size: "major",
    polarity: "bad",
    title: "Crevasse Fall",
    description:
      "The snow gives way beneath you and you plunge into a hidden crevasse. You fight to climb out.",
    effect: (s) => ({
      stamina: clamp(s.stamina - (s.iceAxe ? 12 : 25) * PACE_FACTORS[s.pace].damageMult, 0, 100),
      progress: clamp(s.progress - (s.iceAxe ? 0.01 : 0.04), 0, 1),
    }),
  },
];

// ── rolling logic ────────────────────────────────────────────

let eventCounter = 0;

function sampleFromPool(
  pool: Omit<GameEvent, "id">[],
): GameEvent {
  const template = pick(pool);
  return { ...template, id: `evt-${++eventCounter}` };
}

export function rollHourlyEvents(state: GameState): GameEvent[] {
  const n = Math.floor(Math.random() * 5) + 1;
  const events: GameEvent[] = [];

  const baseMajorChance = 0.25 + WEATHER_SEVERITY[state.weather] * 0.05;
  const majorChance = baseMajorChance + avalancheRiskMod(state.timeOfDay);
  const hasMajor = Math.random() < majorChance;

  if (hasMajor) {
    const pool = Math.random() < 0.8 ? MAJOR_BAD : MAJOR_GOOD;
    events.push(sampleFromPool(pool));
  }

  const badChance = PACE_FACTORS[state.pace].badChance;
  const smallCount = Math.min(n - events.length, 4);
  for (let i = 0; i < smallCount; i++) {
    const pool = Math.random() < badChance ? SMALL_BAD : SMALL_GOOD;
    events.push(sampleFromPool(pool));
  }

  return events;
}

export function applyEvents(
  state: GameState,
  events: GameEvent[],
): GameState {
  let next = { ...state };
  for (const ev of events) {
    const patch = ev.effect(next);
    next = { ...next, ...patch };
  }
  return next;
}

// ── choices ──────────────────────────────────────────────────

export function generateChoices(state: GameState): Choice[] {
  const choices: Choice[] = [];

  const speedBonus = state.prepModifiers?.baseSpeedBonus ?? 0;
  const weatherRes = state.prepModifiers?.weatherResistance ?? 0;
  const wp = getWaypoint(state.progress);
  const alt = altitudeAtProgress(state.progress);
  const ambientTemp = temperatureAt(alt, state.weather, state.timeOfDay);
  const effTemp = effectiveTemperature(ambientTemp, state.layers);
  const iciness = adjustedIciness(state.progress, state.timeOfDay);
  const terrain = terrainLabel(iciness);
  const paceFactor = PACE_FACTORS[state.pace];

  const mealCost = mealCostPerEat(state.partySize);
  const drinkCost = waterCostPerDrink(state.partySize);

  const fatigueExtra =
    (state.hunger < 25 ? 4 : 0) +
    (state.sleep < 25 ? 4 : 0) +
    (state.water < 25 ? 3 : 0);
  const sleepPenalty = state.sleep < 25;
  const layerWeight = Math.max(0, state.layers - 1) * 2;

  const cSpd = cramponSpeedMod(state.crampons, iciness);
  const cStam = cramponStaminaMod(state.crampons, iciness);
  const aSpd = iceAxeSpeedMod(state.iceAxe, iciness);
  const aStam = iceAxeStaminaMod(state.iceAxe, iciness);

  const gearSpeedTotal = cSpd + aSpd;
  const gearStamTotal = cStam + aStam;

  const warnings: string[] = [];
  if (state.hunger < 25) warnings.push("starving");
  if (state.sleep < 25) warnings.push("exhausted");
  if (state.water < 25) warnings.push("dehydrated");
  if (effTemp < -5) warnings.push("freezing");
  if (effTemp > 15) warnings.push("overheating");
  if (iciness >= 0.5 && !state.crampons) warnings.push("no crampons on ice");
  if (iciness >= 0.5 && !state.iceAxe) warnings.push("no ice axe");
  const warningTag = warnings.length > 0
    ? ` (${warnings.join(", ")}!)`
    : "";

  const partyLabel = state.partySize > 1 ? ` your group of ${state.partySize}` : "";

  // ── Push Forward ──
  {
    const totalExtra = fatigueExtra + Math.max(0, Math.round(gearStamTotal));
    const gearHints: string[] = [];
    if (iciness >= 0.5 && !state.crampons)
      gearHints.push("slipping without crampons");
    if (iciness >= 0.5 && !state.iceAxe)
      gearHints.push("unsteady without ice axe");
    if (iciness < 0.3 && state.crampons)
      gearHints.push("crampons awkward on rock");

    let desc = "Spend stamina to cover more ground.";
    if (gearHints.length > 0 || fatigueExtra > 0)
      desc = `${terrain} terrain. ${[...gearHints, ...(fatigueExtra > 0 ? [`you're ${warnings.filter(w => !w.includes("crampon") && !w.includes("axe")).join(" & ")}`] : [])].join(", ")}${totalExtra > 0 ? " — extra stamina cost." : "."}`;
    if (state.pace !== "normal")
      desc += ` ${state.pace === "fast" ? "Moving fast — higher cost." : "Moving cautiously — lower cost."}`;

    choices.push({
      label: "Push Forward",
      description: desc,
      apply: (s) => {
        const baseDist = (0.04 + speedBonus + gearSpeedTotal) * paceFactor.dist;
        let dist = Math.max(0.005, s.doubleDistance ? baseDist * 2 : baseDist);
        if (sleepPenalty) dist *= 0.5;
        const effectiveSeverity = Math.max(0, WEATHER_SEVERITY[s.weather] - weatherRes);
        const cost = (effectiveSeverity * 3 + 8 + fatigueExtra + layerWeight + Math.max(0, Math.round(gearStamTotal))) * paceFactor.stamina;
        return {
          progress: clamp(s.progress + dist, 0, 1),
          stamina: clamp(s.stamina - cost, 0, 100),
          hunger: clamp(s.hunger - 3 * paceFactor.hunger, 0, 100),
          water: clamp(s.water - 2 * paceFactor.water, 0, 100),
          doubleDistance: false,
        };
      },
    });
  }

  // ── Rest & Recover ──
  choices.push({
    label: "Rest & Recover",
    description: fatigueExtra > 0
      ? `You need this${warningTag}. Less distance but some recovery.`
      : "Catch your breath. Less distance but more stamina.",
    apply: (s) => {
      const baseRest = (0.015 + speedBonus * 0.5) * paceFactor.dist;
      let dist = s.doubleDistance ? baseRest * 2 : baseRest;
      if (sleepPenalty) dist *= 0.5;
      const recovery = Math.max(0, (s.weather === "storm" ? 2 : 8) - fatigueExtra);
      return {
        progress: clamp(s.progress + dist, 0, 1),
        stamina: clamp(s.stamina + recovery, 0, 100),
        hunger: clamp(s.hunger - 2, 0, 100),
        water: clamp(s.water - 1, 0, 100),
        doubleDistance: false,
      };
    },
  });

  // ── Pace changes ──
  const paceOptions: { pace: Pace; label: string; desc: string }[] = [
    {
      pace: "slow",
      label: "Slow Down",
      desc: iciness >= 0.5
        ? "Move carefully on this icy terrain. Less distance, but conserves energy and reduces fall risk."
        : "Take it easy. Less progress but lower stamina drain and safer.",
    },
    {
      pace: "normal",
      label: "Normal Pace",
      desc: "Return to a standard hiking pace. Balanced speed and energy use.",
    },
    {
      pace: "fast",
      label: "Speed Up",
      desc: iciness >= 0.5
        ? "Push hard on treacherous terrain. Much faster but high injury risk and drains resources quickly."
        : "Pick up the pace. More ground covered but higher stamina, food, and water cost.",
    },
  ];
  for (const po of paceOptions) {
    if (state.pace !== po.pace) {
      choices.push({
        label: po.label,
        description: po.desc,
        apply: () => ({ pace: po.pace, doubleDistance: false }),
      });
    }
  }

  // ── Equip Crampons ──
  if (!state.crampons) {
    const icy = iciness >= 0.5;
    choices.push({
      label: "Put On Crampons",
      description: icy
        ? `The ${terrain.toLowerCase()} terrain is treacherous. Strap on crampons for grip and safety.`
        : `The ground here is mostly rock. Crampons will slow you down but you'll be ready for ice ahead.`,
      apply: () => ({ crampons: true, doubleDistance: false }),
    });
  }

  // ── Remove Crampons ──
  if (state.crampons) {
    const rocky = iciness < 0.3;
    choices.push({
      label: "Take Off Crampons",
      description: rocky
        ? "The trail is rocky here — removing crampons will let you move faster."
        : `You're on ${terrain.toLowerCase()} terrain. Removing crampons is risky but saves stamina.`,
      apply: () => ({ crampons: false, doubleDistance: false }),
    });
  }

  // ── Equip Ice Axe ──
  if (!state.iceAxe) {
    const icy = iciness >= 0.5;
    choices.push({
      label: "Ready Ice Axe",
      description: icy
        ? "You need the axe in hand for self-arrest on this steep ice. Essential for safety."
        : "Carrying the axe ready adds weight, but you'll be prepared for steeper terrain.",
      apply: () => ({ iceAxe: true, doubleDistance: false }),
    });
  }

  // ── Stow Ice Axe ──
  if (state.iceAxe) {
    const rocky = iciness < 0.3;
    choices.push({
      label: "Stow Ice Axe",
      description: rocky
        ? "No ice here — stow the axe and free your hands for scrambling."
        : `On this ${terrain.toLowerCase()} terrain, stowing saves effort but removes your self-arrest ability.`,
      apply: () => ({ iceAxe: false, doubleDistance: false }),
    });
  }

  // ── Add a Layer ──
  if (state.layers < 3) {
    const freezing = effTemp < -5;
    choices.push({
      label: "Add a Layer",
      description: freezing
        ? "You're dangerously cold. Put on another layer before hypothermia sets in."
        : effTemp < 5
          ? `It's ${ambientTemp}°C out. An extra layer will keep you warm but adds weight.`
          : `You're warm enough, but an extra layer adds wind protection. Adds weight.`,
      apply: (s) => ({ layers: s.layers + 1, doubleDistance: false }),
    });
  }

  // ── Remove a Layer ──
  if (state.layers > 0) {
    const overheating = effTemp > 15;
    choices.push({
      label: "Remove a Layer",
      description: overheating
        ? "You're overheating and sweating through water fast. Strip a layer to cool down."
        : `You're wearing ${state.layers} layer${state.layers > 1 ? "s" : ""}. Removing one lightens your load.`,
      apply: (s) => ({ layers: s.layers - 1, doubleDistance: false }),
    });
  }

  // ── Eat a Meal ──
  if (state.hunger < 70 && state.foodSupply >= mealCost) {
    const urgent = state.hunger < 30;
    choices.push({
      label: "Eat a Meal",
      description: urgent
        ? `You're running on empty — feed${partyLabel} now. Uses ${mealCost} meal${mealCost > 1 ? "s" : ""} (${state.foodSupply} left).`
        : `Refuel from your pack. Uses ${mealCost} meal${mealCost > 1 ? "s" : ""} (${state.foodSupply} left).`,
      apply: (s) => ({
        hunger: clamp(s.hunger + 30, 0, 100),
        foodSupply: Math.max(0, s.foodSupply - mealCost),
        sleep: clamp(s.sleep - 2, 0, 100),
        doubleDistance: false,
      }),
    });
  }

  // ── Drink Water ──
  if (state.water < 70 && state.waterSupply >= drinkCost) {
    const urgent = state.water < 30;
    choices.push({
      label: "Drink Water",
      description: urgent
        ? `Your mouth is dry as chalk — hydrate${partyLabel} now. Uses ${drinkCost}L (${state.waterSupply.toFixed(1)}L left).`
        : `Take a long drink. Uses ${drinkCost}L (${state.waterSupply.toFixed(1)}L left).`,
      apply: (s) => ({
        water: clamp(s.water + 25, 0, 100),
        waterSupply: Math.max(0, +(s.waterSupply - drinkCost).toFixed(1)),
        doubleDistance: false,
      }),
    });
  }

  // ── Sleep in Hut (sets pendingSleep, transitions to waking phase) ──
  if (wp.shelter === "hut") {
    const sleepMealCost = mealCost;
    if (state.foodSupply >= sleepMealCost) {
      choices.push({
        label: "Sleep in Hut",
        description: state.sleep < 25
          ? `You can barely stand. The hut bunks are your only chance. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`
          : state.sleep < 60
            ? `Find a bunk in the mountain hut. Warm and safe. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`
            : `Rest in the hut. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`,
        apply: () => ({
          pendingSleep: { type: "hut" as const, sleepBonus: 50, staminaBonus: 12, mealCost: sleepMealCost },
          phase: "waking" as const,
          doubleDistance: false,
        }),
      });
    }
  }

  // ── Sleep in Tent (sets pendingSleep, transitions to waking phase) ──
  {
    const sleepMealCost = mealCost;
    if (state.foodSupply >= sleepMealCost) {
      choices.push({
        label: "Sleep in Tent",
        description: state.sleep < 25
          ? `You're swaying on your feet. You must sleep now. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`
          : state.sleep < 60
            ? `Pitch your tent for a few hours of rest. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`
            : `Set up camp and get some sleep. Costs ${sleepMealCost} meal${sleepMealCost > 1 ? "s" : ""}.`,
        apply: () => ({
          pendingSleep: { type: "tent" as const, sleepBonus: 35, staminaBonus: 5, mealCost: sleepMealCost },
          phase: "waking" as const,
          doubleDistance: false,
        }),
      });
    }
  }

  // ── Shelter in Place ──
  if (WEATHER_SEVERITY[state.weather] >= 3) {
    choices.push({
      label: "Shelter in Place",
      description: state.weather === "storm"
        ? "The storm is too dangerous to move in. Hunker down and wait it out."
        : "Wait for the weather to pass. No progress but safe.",
      apply: (s) => ({
        stamina: clamp(s.stamina + 3, 0, 100),
        weather: improveWeather(s.weather),
        doubleDistance: false,
      }),
    });
  }

  // ── Retreat Downhill ──
  if (state.stamina < 30 && state.progress > 0.1) {
    choices.push({
      label: "Retreat Downhill",
      description: "You're too weak to keep going. Fall back to recover — you'll lose progress.",
      apply: (s) => ({
        progress: clamp(s.progress - 0.05, 0, 1),
        stamina: clamp(s.stamina + 15, 0, 100),
        weather: improveWeather(s.weather),
        doubleDistance: false,
      }),
    });
  }

  return choices;
}

// ── narrative ────────────────────────────────────────────────

export function buildNarrative(
  state: GameState,
  events: GameEvent[],
): string {
  const wp = getWaypoint(state.progress);
  const alt = altitudeAtProgress(state.progress);
  const ambientTemp = temperatureAt(alt, state.weather, state.timeOfDay);
  const effTemp = effectiveTemperature(ambientTemp, state.layers);
  const iciness = adjustedIciness(state.progress, state.timeOfDay);
  const terrain = terrainLabel(iciness);
  const weatherLine = weatherDescription(state.weather);

  const clockLine = `Time: ${formatTime(state.timeOfDay)} (${state.hoursHiked} hour${state.hoursHiked !== 1 ? "s" : ""} hiked)`;

  const tod = state.timeOfDay;
  let timeContext = "";
  if (tod < 5) timeContext = "The pre-dawn darkness envelops the mountain. Headlamps cut thin beams in the black.";
  else if (tod < 7) timeContext = "The first grey light of dawn creeps across the peaks.";
  else if (tod < 10) timeContext = "Morning light illuminates the route ahead.";
  else if (tod < 14) timeContext = "The midday sun beats down, softening the snow.";
  else if (tod < 17) timeContext = "The afternoon sun hangs low, shadows lengthening across the slopes.";
  else if (tod < 20) timeContext = "Evening approaches. The light turns golden on the snow.";
  else timeContext = "Darkness falls over the mountain. The temperature drops fast.";

  const tempLine = `Temperature: ${ambientTemp}°C (feels like ${effTemp}°C with ${state.layers} layer${state.layers !== 1 ? "s" : ""}).`;

  const terrainLine = `Terrain: ${terrain}${iciness >= 0.5 ? " — crampons and ice axe recommended." : "."}`;

  const gearParts: string[] = [];
  gearParts.push(state.crampons ? "Crampons: on" : "Crampons: off");
  gearParts.push(state.iceAxe ? "Ice axe: ready" : "Ice axe: stowed");
  const gearLine = gearParts.join(" | ");

  const supplyLine = `Supplies: ${state.foodSupply} meal${state.foodSupply !== 1 ? "s" : ""}, ${state.waterSupply.toFixed(1)}L water.`;

  const paceDesc = state.pace === "slow" ? "You're moving at a cautious pace."
    : state.pace === "fast" ? "You're pushing hard and fast."
    : "";

  const statusWarnings: string[] = [];
  if (state.water < 30) statusWarnings.push("You're dangerously dehydrated.");
  if (state.hunger < 30) statusWarnings.push("Your stomach aches with hunger.");
  if (state.sleep < 30) statusWarnings.push("Your eyelids are heavy — you need sleep.");
  if (effTemp < -5) statusWarnings.push("The cold is biting through your clothes.");
  if (effTemp > 15) statusWarnings.push("You're sweating heavily in the heat.");
  if (state.foodSupply <= 2) statusWarnings.push("Food supplies are critically low.");
  if (state.waterSupply <= 0.5) statusWarnings.push("Water supplies are almost gone.");
  if (iciness >= 0.5 && !state.crampons) statusWarnings.push("Your boots slip on the ice — you need crampons.");
  if (iciness >= 0.5 && !state.iceAxe) statusWarnings.push("Without an ice axe, a fall here could be fatal.");
  const statusLine = statusWarnings.length > 0 ? statusWarnings.join(" ") : "";

  const eventLines = events
    .map((e) => `\u2022 ${e.title}: ${e.description}`)
    .join("\n");

  const parts = [wp.narrative, clockLine, timeContext, weatherLine, tempLine, terrainLine, gearLine, supplyLine];
  if (paceDesc) parts.push(paceDesc);
  if (statusLine) parts.push(statusLine);
  parts.push(eventLines);

  return parts.join("\n\n");
}

function weatherDescription(w: Weather): string {
  switch (w) {
    case "clear":
      return "The sky is clear and blue. Perfect climbing conditions.";
    case "cloudy":
      return "Clouds gather around the peaks, but visibility is decent.";
    case "wind":
      return "Strong gusts batter the ridge. You lean into the wind.";
    case "snow":
      return "Snow falls steadily, muffling sound and covering the trail.";
    case "storm":
      return "A ferocious storm rages. Survival is the only priority.";
  }
}
