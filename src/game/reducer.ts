import type { Action, GameState } from "./types";
import { INITIAL_STATE, DEFAULT_PREP } from "./types";
import {
  rollHourlyEvents,
  applyEvents,
  generateChoices,
  buildNarrative,
} from "./events";
import {
  currentWaypoint,
  altitudeAtProgress,
  temperatureAt,
  effectiveTemperature,
} from "./route";
import {
  computeModifiers,
  computeStartingStamina,
  computeStartingHunger,
  computeStartingFoodSupply,
  computeStartingWaterSupply,
  waterCostPerDrink,
} from "./preparation";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_PREP": {
      return {
        ...INITIAL_STATE,
        phase: "preparation",
        prepConfig: DEFAULT_PREP,
        prepModifiers: computeModifiers(DEFAULT_PREP),
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
      const mods = state.prepModifiers;
      const stamina = computeStartingStamina(mods);
      const hunger = computeStartingHunger(mods);
      const foodSupply = computeStartingFoodSupply(state.prepConfig);
      const waterSupply = computeStartingWaterSupply(state.prepConfig);
      const wp = currentWaypoint(0);
      const partySize = state.prepConfig.party;
      const startHour = state.prepConfig.startHour;
      const partyLine = partySize === 1
        ? "You set out alone."
        : `Your group of ${partySize} sets out together.`;
      const startState: GameState = {
        ...INITIAL_STATE,
        phase: "climbing",
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
        narrative:
          wp.narrative +
          "\n\nThe sky is clear and blue. Perfect climbing conditions.\n\n" +
          partyLine +
          ` You carry ${foodSupply} meals and ${waterSupply.toFixed(1)}L of water.` +
          ` It's ${startHour}:00 AM.`,
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

      const events = rollHourlyEvents(state);
      let next = applyEvents(state, events);

      const alt = altitudeAtProgress(next.progress);
      const ambientTemp = temperatureAt(alt, next.weather, next.timeOfDay);
      const effTemp = effectiveTemperature(ambientTemp, next.layers);

      let waterDrain = 3;
      if (effTemp > 10) waterDrain += 2;
      if (effTemp > 15) waterDrain += 2;

      const tod = next.timeOfDay;
      if (tod >= 10 && tod <= 15) waterDrain += 2;

      let coldDrain = 0;
      if (effTemp < -5) coldDrain = 4;
      else if (effTemp < 0) coldDrain = 2;

      next = {
        ...next,
        hoursHiked: state.hoursHiked + 1,
        timeOfDay: (state.timeOfDay + 1) % 24,
        hunger: clamp(next.hunger - 5, 0, 100),
        sleep: clamp(next.sleep - 4, 0, 100),
        water: clamp(next.water - waterDrain, 0, 100),
        stamina: clamp(next.stamina - coldDrain, 0, 100),
        currentEvents: events,
        log: [...state.log, { hour: state.hoursHiked, events }],
      };

      if (next.water <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, events) +
            "\n\nYou have no water left. Severe dehydration takes hold — you can't go on.",
          choices: [],
        };
      }

      if (next.hunger <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, events) +
            "\n\nYou have no food left. Starved and exhausted, you cannot take another step.",
          choices: [],
        };
      }

      if (next.sleep <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, events) +
            "\n\nYou haven't slept in too long. Your vision blurs and your legs buckle. You collapse from exhaustion.",
          choices: [],
        };
      }

      if (next.stamina <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative:
            buildNarrative(next, events) +
            "\n\nYour body gives out. You cannot continue. The mountain wins today.",
          choices: [],
        };
      }

      if (next.progress >= 1) {
        return {
          ...next,
          phase: "summit",
          progress: 1,
          narrative:
            buildNarrative(next, events) +
            "\n\nYou stand on the summit of Mont Blanc. 4,808 metres. The world stretches below you.",
          choices: [],
        };
      }

      const narrative = buildNarrative(next, events);
      const choices = generateChoices(next);
      return { ...next, narrative, choices };
    }

    case "CHOOSE": {
      if (state.phase !== "climbing") return state;
      const choice = state.choices[action.index];
      if (!choice) return state;

      const patch = choice.apply(state);
      let next: GameState = {
        ...state,
        ...patch,
        log: state.log.map((l, i) =>
          i === state.log.length - 1 ? { ...l, choiceMade: choice.label } : l,
        ),
      };

      if (next.phase === "waking" && next.pendingSleep) {
        return next;
      }

      if (next.water <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative: "Completely dehydrated. Your body seizes up.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      if (next.hunger <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative: "You have nothing left to eat. Starved and broken, you collapse.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      if (next.sleep <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative: "You can't keep your eyes open. You collapse from exhaustion.\nThe mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      if (next.stamina <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative:
            "Your strength is spent. You collapse in the snow.\nThe mountain wins today.",
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

      return gameReducer(next, { type: "ADVANCE_HOUR" });
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

      let next: GameState = {
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
      };

      if (next.hunger <= 0 || next.stamina <= 0 || next.water <= 0 || next.sleep <= 0) {
        return {
          ...next,
          phase: "failed",
          narrative: "You wake too weak to continue. The mountain wins today.",
          choices: [],
          currentEvents: [],
        };
      }

      const narrative = buildNarrative(next, []);
      const choices = generateChoices(next);
      return { ...next, narrative, choices, currentEvents: [] };
    }

    default:
      return state;
  }
}
