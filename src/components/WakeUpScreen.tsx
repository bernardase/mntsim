import type { GameState, Action, StartHourOption } from "../game/types";
import { formatTime } from "../game/types";
import { currentWaypoint } from "../game/route";
import { waterCostPerDrink } from "../game/preparation";

interface Props {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const WAKE_HOURS: StartHourOption[] = [3, 4, 5, 6, 7, 8];

function tradeoffDesc(hour: StartHourOption): string {
  switch (hour) {
    case 3: return "Very cold and icy. Hardest conditions but safest from avalanche.";
    case 4: return "Cold and dark. Low avalanche risk, hard frozen terrain.";
    case 5: return "Classic alpine start. Good balance of safety and temperature.";
    case 6: return "Dawn start. Warmer, ice softening, moderate risk.";
    case 7: return "Late start. Warm, rising avalanche risk.";
    case 8: return "Very late. Warm and soft snow, high avalanche and dehydration risk.";
  }
}

export default function WakeUpScreen({ state, dispatch }: Props) {
  const ps = state.pendingSleep;
  if (!ps) return null;

  const wp = currentWaypoint(state.progress);
  const drinkCost = waterCostPerDrink(state.partySize);
  const waterPerHour = +(drinkCost * 0.3).toFixed(2);

  function sleepHours(wakeHour: number): number {
    let d = wakeHour - state.timeOfDay;
    if (d <= 0) d += 24;
    return d;
  }

  return (
    <div className="wakeup-screen">
      <div className="wakeup-container">
        <div className="wakeup-header">
          <h1>Choose Wake-Up Time</h1>
          <p className="wakeup-subtitle">
            You're sleeping in a <strong>{ps.type === "hut" ? "mountain hut" : "tent"}</strong> at{" "}
            <strong>{wp.name}</strong>. It's currently <strong>{formatTime(state.timeOfDay)}</strong>.
          </p>
        </div>

        <div className="wakeup-options">
          {WAKE_HOURS.map((wh) => {
            const hours = sleepHours(wh);
            const waterUsed = +(waterPerHour * hours).toFixed(1);
            return (
              <button
                key={wh}
                className="wakeup-tile"
                onClick={() => dispatch({ type: "WAKE_UP", wakeHour: wh })}
              >
                <span className="wakeup-time">{formatTime(wh)}</span>
                <span className="wakeup-hours">{hours}h sleep</span>
                <span className="wakeup-tradeoff">{tradeoffDesc(wh)}</span>
                <span className="wakeup-cost">
                  Cost: {ps.mealCost} meal{ps.mealCost > 1 ? "s" : ""}, {waterUsed}L water
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
