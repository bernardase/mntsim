import type { GameState, Action } from "../game/types";
import { WEATHER_SEVERITY, INLINE_ACTION_LABELS, formatTime, formatTrailElapsed } from "../game/types";
import { ROCKY_PROGRESS } from "../game/events";
import {
  altitudeAtProgress,
  currentWaypoint,
  temperatureAt,
  effectiveTemperature,
  icinessAtProgress,
  terrainLabel,
  timeOfDayIcinessMod,
} from "../game/route";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

const WEATHER_ICON: Record<string, string> = {
  clear: "\u2600\uFE0F",
  cloudy: "\u26C5",
  wind: "\uD83D\uDCA8",
  snow: "\u2744\uFE0F",
  storm: "\u26A1",
};

export const INLINE_CHOICE_LABELS = INLINE_ACTION_LABELS;

interface Props {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

export default function ClimbOverview({ state, dispatch }: Props) {
  const alt = altitudeAtProgress(state.progress);
  const wp = currentWaypoint(state.progress);
  const pct = Math.round(state.progress * 100);
  const severity = WEATHER_SEVERITY[state.weather];
  const ambientTemp = temperatureAt(alt, state.weather, state.timeOfDay);
  const effTemp = effectiveTemperature(ambientTemp, state.layers);
  const iciness = clamp(icinessAtProgress(state.progress) + timeOfDayIcinessMod(state.timeOfDay), 0, 1);
  const terrain = terrainLabel(iciness);
  const showRiskHint = state.progress >= ROCKY_PROGRESS;

  function choiceIndex(label: string): number {
    return state.choices.findIndex((c) => c.label === label);
  }

  function renderInlineBtn(label: string, short: string) {
    const idx = choiceIndex(label);
    if (idx < 0) return null;
    return (
      <button
        className="inline-action-btn"
        onClick={() => dispatch({ type: "CHOOSE", index: idx })}
        title={state.choices[idx].description}
      >
        {short}
      </button>
    );
  }

  return (
    <div className="climb-overview">
      <h2>Status</h2>

      {showRiskHint && (
        <p className="map-risk-hint">Avalanche and rockfall readout on the map.</p>
      )}

      <div className="stat-group">
        <label>Time</label>
        <span className="stat-value">{formatTime(state.timeOfDay)}</span>
      </div>

      <div className="stat-group">
        <label>On trail</label>
        <span className="stat-value">{formatTrailElapsed(state.hoursHiked)}</span>
      </div>

      <div className="stat-group">
        <label>Location</label>
        <span className="stat-value">{wp.name}</span>
      </div>

      <div className="stat-group">
        <label>Altitude</label>
        <span className="stat-value">{alt.toLocaleString()} m</span>
      </div>

      <div className="stat-group">
        <label>Party</label>
        <span className="stat-value">
          {state.partySize === 1 ? "Solo" : `${state.partySize} climbers`}
        </span>
      </div>

      <div className="stat-group">
        <label>Progress</label>
        <div className="bar-track">
          <div className="bar-fill bar-progress" style={{ width: `${pct}%` }} />
        </div>
        <span className="bar-label">{pct}%</span>
      </div>

      <div className="stat-group">
        <label>Stamina</label>
        <div className="bar-track">
          <div
            className={`bar-fill bar-stamina ${state.stamina < 25 ? "bar-danger" : ""}`}
            style={{ width: `${state.stamina}%` }}
          />
        </div>
        <span className="bar-label">{Math.round(state.stamina)} / 100</span>
      </div>

      <div className="stat-group">
        <label>Hunger</label>
        <div className="bar-track">
          <div
            className={`bar-fill bar-hunger ${state.hunger < 25 ? "bar-danger" : ""}`}
            style={{ width: `${state.hunger}%` }}
          />
        </div>
        <span className="bar-label">{Math.round(state.hunger)} / 100</span>
      </div>

      <div className="stat-group">
        <label>Hydration</label>
        <div className="bar-track">
          <div
            className={`bar-fill bar-water ${state.water < 25 ? "bar-danger" : ""}`}
            style={{ width: `${state.water}%` }}
          />
        </div>
        <span className="bar-label">{Math.round(state.water)} / 100</span>
      </div>

      <div className="stat-group">
        <label>Sleep</label>
        <div className="bar-track">
          <div
            className={`bar-fill bar-sleep ${state.sleep < 25 ? "bar-danger" : ""}`}
            style={{ width: `${state.sleep}%` }}
          />
        </div>
        <span className="bar-label">{Math.round(state.sleep)} / 100</span>
      </div>

      <div className="supply-divider" />

      <div className="stat-group">
        <label>Food</label>
        <span className={`stat-value supply-value ${state.foodSupply <= 2 ? "supply-critical" : ""}`}>
          {state.foodSupply} meal{state.foodSupply !== 1 ? "s" : ""}
        </span>
        <div className="inline-actions">
          {renderInlineBtn("Eat a Meal", "🍽️ Eat")}
        </div>
      </div>

      <div className="stat-group">
        <label>Water</label>
        <span className={`stat-value supply-value ${state.waterSupply <= 0.5 ? "supply-critical" : ""}`}>
          {state.waterSupply.toFixed(1)} L
        </span>
        <div className="inline-actions">
          {renderInlineBtn("Drink Water", "💧 Drink")}
        </div>
      </div>

      <div className="supply-divider" />

      <div className="stat-group">
        <label>Terrain</label>
        <span className={`stat-value terrain-tag terrain-${terrain.toLowerCase().replace(/\s+/g, "")}`}>
          {terrain}
          {iciness >= 0.5 && !state.crampons && (
            <span className="gear-warn"> — crampons!</span>
          )}
          {iciness >= 0.5 && !state.iceAxe && (
            <span className="gear-warn"> — axe!</span>
          )}
        </span>
      </div>

      <div className="stat-group">
        <label>Equipment</label>
        <div className="gear-row">
          <span className={`gear-badge ${state.crampons ? "gear-on" : "gear-off"}`}>
            Crampons {state.crampons ? "on" : "off"}
          </span>
          <span className={`gear-badge ${state.iceAxe ? "gear-on" : "gear-off"}`}>
            Axe {state.iceAxe ? "out" : "stowed"}
          </span>
        </div>
        <div className="inline-actions">
          {renderInlineBtn("Put On Crampons", "Equip Crampons")}
          {renderInlineBtn("Take Off Crampons", "Remove Crampons")}
          {renderInlineBtn("Ready Ice Axe", "Ready Axe")}
          {renderInlineBtn("Stow Ice Axe", "Stow Axe")}
        </div>
      </div>

      <div className="stat-group">
        <label>Pace</label>
        <span className={`stat-value pace-indicator pace-${state.pace}`}>
          {state.pace === "slow" ? "Slow" : state.pace === "fast" ? "Fast" : "Normal"}
        </span>
      </div>

      <div className="stat-group">
        <label>Temperature</label>
        <span
          className={`stat-value temp-ambient ${effTemp < -5 ? "temp-cold" : effTemp > 15 ? "temp-hot" : ""}`}
          title={`Feels ${effTemp}°C with ${state.layers} layer${state.layers !== 1 ? "s" : ""}`}
        >
          {ambientTemp}°C
        </span>
      </div>

      <div className="stat-group">
        <label>Layers</label>
        <span className="stat-value layers-indicator">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`layer-dot ${i < state.layers ? "layer-active" : ""}`} />
          ))}
          <span className="layers-text">{state.layers} / 3</span>
        </span>
        <div className="inline-actions">
          {renderInlineBtn("Add a Layer", "+ Layer")}
          {renderInlineBtn("Remove a Layer", "- Layer")}
        </div>
      </div>

      <div className="stat-group">
        <label>Weather</label>
        <span className="stat-value">
          {WEATHER_ICON[state.weather]} {state.weather}
          {severity >= 3 && <span className="weather-warn"> — rough</span>}
        </span>
      </div>

      {state.doubleDistance && (
        <div className="buff-badge">Next: 2× distance</div>
      )}
    </div>
  );
}
