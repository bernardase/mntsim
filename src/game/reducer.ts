import type { Action, GameState, GameEvent, Weather } from "./types";
import {
  INITIAL_STATE,
  DEFAULT_PREP,
  INLINE_ACTION_LABELS,
  DIFFICULTY_MODS,
  GAME_CLOCK_STEP_HOURS,
  GAME_STAT_STEP_MULT,
} from "./types";
import {
  rollHourlyEvents,
  applyEvents,
  countCriticalBodyStats,
  generateChoices,
  buildNarrative,
} from "./events";
import {
  currentWaypoint,
  altitudeAtProgress,
  temperatureAt,
  effectiveTemperature,
  icinessAtProgress,
  timeOfDayIcinessMod,
  setActiveRoute,
} from "./route";
import {
  computeModifiers,
  computeStartingStamina,
  computeStartingHunger,
  computeStartingFoodSupply,
  computeStartingWaterSupply,
  waterCostPerDrink,
} from "./preparation";

function lethalFailureSuffix(events: GameEvent[]): string {
  const lethal = events.find((e) => e.lethal);
  if (!lethal) return "";
  if (lethal.title.includes("Avalanche")) {
    return "\n\nThe mass of snow and ice doesn't release you. The climb ends here.";
  }
  return "\n\nThe rockfall is catastrophic. You don't get back up.";
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

const WEATHER_ORDER: Weather[] = ["clear", "cloudy", "wind", "snow", "storm"];

function driftWeather(current: Weather, progress: number): Weather {
  const roll = Math.random();
  if (roll > 0.30) return current;

  const idx = WEATHER_ORDER.indexOf(current);
  const altBias = progress > 0.5 ? 0.1 : 0;
  if (Math.random() < 0.45 + altBias) {
    return WEATHER_ORDER[Math.min(idx + 1, WEATHER_ORDER.length - 1)];
  }
  return WEATHER_ORDER[Math.max(idx - 1, 0)];
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME": {
      return {
        ...INITIAL_STATE,
        phase: "difficulty",
      };
    }

    case "SET_DIFFICULTY": {
      return {
        ...state,
        difficulty: action.difficulty,
        phase: "preparation",
        prepConfig: DEFAULT_PREP,
        prepModifiers: computeModifiers(DEFAULT_PREP),
      };
    }

    case "START_PREP": {
      return {
        ...INITIAL_STATE,
        phase: "difficulty",
      };
    }

    case "SET_PREP": {
      const mods = computeModifiers(action.config);
      return {
        ...state,
        prepConfig: action.config,
        prepModifiers: mods,
      };
    }

    case "CONFIRM_PREP": {
      setActiveRoute(state.prepConfig.route);
      const mods = state.prepModifiers;
      const diff = DIFFICULTY_MODS[state.difficulty];
      const stamina = clamp(computeStartingStamina(mods) + diff.startingStaminaBonus, 30, 100);
      const hunger = computeStartingHunger(mods);
      const foodSupply = Math.round(computeStartingFoodSupply(state.prepConfig) * diff.startingSupplyMult);
      const waterSupply = +(computeStartingWaterSupply(state.prepConfig) * diff.startingSupplyMult).toFixed(1);
      const wp = currentWaypoint(0);
      const partySize = state.prepConfig.party;
      const startHour = state.prepConfig.startHour;
      const partyLine = partySize === 1
        ? "You set out alone."
        : `Your group of ${partySize} sets out together.`;
      const startState: GameState = {
        ...INITIAL_STATE,
        phase: "climbing",
        difficulty: state.difficulty,
        hoursHiked: 0,
        timeOfDay: startHour,
        stamina,
        hunger,
        sleep: 100,
        water: 100,
        foodSupply,
        waterSupply,
        partySize,
        layers: 2,
        pace: "normal",
        pendingSleep: null,
        prepConfig: state.prepConfig,
        prepModifiers: mods,
        detourAvoidingExposure: false,
        narrative:
          wp.narrative +
          `\n\nClear skies. ${partyLine} ${foodSupply} meals, ${waterSupply.toFixed(1)}L water. Start ${startHour}:00 AM.`,
        currentEvents: [],
        choices: [],
      };
      return {
        ...startState,
        choices: generateChoices(startState),
      };
    }

    case "ADVANCE_HOUR": {
      if (state.phase !== "climbing") return state;

      const diff = DIFFICULTY_MODS[state.difficulty];
      const events = rollHourlyEvents(state);
      let next = applyEvents(state, events);

      const alt = altitudeAtProgress(next.progress);
      const ambientTemp = temperatureAt(alt, next.weather, next.timeOfDay);
      const effTemp = effectiveTemperature(ambientTemp, next.layers);
      const iciness = clamp(icinessAtProgress(next.progress) + timeOfDayIcinessMod(next.timeOfDay), 0, 1);

      const terrainMult = 1.0 + iciness;
      const gearPenalty = iciness >= 0.5
        ? (next.crampons ? 0 : 3) + (next.iceAxe ? 0 : 2)
        : 0;

      let waterDrain = 3;
      if (effTemp > 10) waterDrain += 2;
      if (effTemp > 15) waterDrain += 2;

      const tod = next.timeOfDay;
      if (tod >= 10 && tod <= 15) waterDrain += 2;

      let coldDrain = 0;
      if (effTemp < -5) coldDrain = 4;
      else if (effTemp < 0) coldDrain = 2;

      const driftedWeather = driftWeather(next.weather, next.progress);

      const sm = GAME_STAT_STEP_MULT;
      const dm = diff.drainMult;
      const newClock = state.timeOfDay + GAME_CLOCK_STEP_HOURS;
      const timeOfDay = Math.round((((newClock % 24) + 24) % 24) * 1e4) / 1e4;

      next = {
        ...next,
        hoursHiked: Math.round((state.hoursHiked + GAME_CLOCK_STEP_HOURS) * 1e4) / 1e4,
        timeOfDay,
        weather: driftedWeather,
        hunger: clamp(next.hunger - Math.round(8 * terrainMult * dm) * sm, 0, 100),
        sleep: clamp(next.sleep - Math.round(6 * terrainMult * dm) * sm, 0, 100),
        water: clamp(next.water - Math.round(waterDrain * terrainMult * dm) * sm, 0, 100),
        stamina: clamp(next.stamina - (0.5 + coldDrain * 0.3 + gearPenalty * 0.3) * sm * terrainMult * dm, 0, 100),
        currentEvents: events,
        log: [...state.log, { hour: state.hoursHiked, events }],
      };

      const narrativeBase = buildNarrative(next, events);
      if (events.some((e) => e.lethal)) {
        return {
          ...next,
          phase: "failed",
          narrative: narrativeBase + lethalFailureSuffix(events),
          choices: [],
          currentEvents: events,
        };
      }
      if (countCriticalBodyStats(next) >= 2) {
        return {
          ...next,
          phase: "failed",
          narrative:
            narrativeBase +
            "\n\nStamina, fuel, sleep, and hydration have all crashed. You can't continue safely.",
          choices: [],
          currentEvents: events,
        };
      }

      if (next.progress >= 1) {
        return {
          ...next,
          phase: "summit",
          progress: 1,
          narrative:
            narrativeBase +
            "\n\nYou stand on the summit of Mont Blanc. 4,808 metres. The world stretches below you.",
          choices: [],
        };
      }

      const narrative = narrativeBase;
      const choices = generateChoices(next);
      return { ...next, narrative, choices };
    }

    case "CHOOSE": {
      if (state.phase !== "climbing") return state;
      const choice = state.choices[action.index];
      if (!choice) return state;

      const isInline = INLINE_ACTION_LABELS.has(choice.label);

      if (!isInline && state.mainActionsThisHour >= 1) return state;

      const patch = choice.apply(state);
      let next: GameState = {
        ...state,
        ...patch,
        mainActionsThisHour: isInline ? state.mainActionsThisHour : state.mainActionsThisHour + 1,
        log: state.log.map((l, i) =>
          i === state.log.length - 1 ? { ...l, choiceMade: choice.label } : l,
        ),
      };

      if (next.phase === "waking" && next.pendingSleep) {
        return next;
      }

      if (countCriticalBodyStats(next) >= 2) {
        return {
          ...next,
          phase: "failed",
          narrative:
            "Your body is shutting down on multiple fronts at once.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      if (next.progress >= 1) {
        return {
          ...next,
          phase: "summit",
          progress: 1,
          narrative:
            "You take the final steps and stand on the summit of Mont Blanc.\n4,808 metres. The roof of Western Europe.\n\nYou did it.",
          choices: [],
          currentEvents: [],
        };
      }

      if (!isInline) {
        next = { ...next, mainActionsThisHour: 0 };
        return gameReducer(next, { type: "ADVANCE_HOUR" });
      }

      if (countCriticalBodyStats(next) >= 2) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, []) +
            "\n\nYour body is shutting down on multiple fronts at once.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      const choices = generateChoices(next);
      return { ...next, choices };
    }

    case "WAKE_UP": {
      if (state.phase !== "waking" || !state.pendingSleep) return state;

      const ps = state.pendingSleep;
      const wakeHour = action.wakeHour;

      let sleepDuration = wakeHour - state.timeOfDay;
      if (sleepDuration <= 0) sleepDuration += 24;

      const scale = Math.min(sleepDuration / 8, 1);
      const sleepRestore = Math.round(ps.sleepBonus * scale);
      const staminaRestore = Math.round(ps.staminaBonus * scale);

      const drinkCost = waterCostPerDrink(state.partySize);
      const waterPerSleepHour = drinkCost * 0.3;
      const waterUsed = +(waterPerSleepHour * sleepDuration).toFixed(1);

      let next: GameState;

      if (ps.type === "hut") {
        const startFood = computeStartingFoodSupply(state.prepConfig);
        const startWater = computeStartingWaterSupply(state.prepConfig);
        next = {
          ...state,
          phase: "climbing",
          timeOfDay: wakeHour % 24,
          hoursHiked: state.hoursHiked + sleepDuration,
          stamina: Math.max(state.stamina, 90),
          hunger: Math.max(state.hunger, 90),
          sleep: Math.max(state.sleep, 90),
          water: Math.max(state.water, 90),
          foodSupply: startFood,
          waterSupply: startWater,
          pendingSleep: null,
          mainActionsThisHour: 0,
        };
      } else {
        next = {
          ...state,
          phase: "climbing",
          timeOfDay: wakeHour % 24,
          hoursHiked: state.hoursHiked + sleepDuration,
          sleep: clamp(state.sleep + sleepRestore, 0, 100),
          stamina: clamp(state.stamina + staminaRestore, 0, 100),
          hunger: clamp(state.hunger - 5 * Math.ceil(sleepDuration / 3), 0, 100),
          foodSupply: Math.max(0, state.foodSupply - ps.mealCost),
          waterSupply: Math.max(0, +(state.waterSupply - waterUsed).toFixed(1)),
          pendingSleep: null,
          mainActionsThisHour: 0,
        };
      }

      if (countCriticalBodyStats(next) >= 2) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, []) +
            "\n\nYou wake into a body that can't safely continue.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      const narrative = buildNarrative(next, []);
      const choices = generateChoices(next);
      return { ...next, narrative, choices, currentEvents: [] };
    }

    case "BEGIN_DESCENT": {
      if (state.phase !== "summit") return state;
      const next: GameState = {
        ...state,
        phase: "climbing",
        progress: 0.98,
        mainActionsThisHour: 0,
        detourAvoidingExposure: false,
      };
      const narrative = buildNarrative(next, []);
      const choices = generateChoices(next);
      return { ...next, narrative, choices, currentEvents: [] };
    }

    default:
      return state;
  }
}
