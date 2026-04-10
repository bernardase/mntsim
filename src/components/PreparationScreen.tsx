import type { PrepConfig, PrepModifiers, Action } from "../game/types";
import {
  GEAR_OPTIONS,
  FOOD_OPTIONS,
  ROUTE_OPTIONS,
  DAYS_OPTIONS,
  TRAINING_OPTIONS,
  PARTY_OPTIONS,
  START_HOUR_OPTIONS,
  computeStartingStamina,
  computeStartingHunger,
  computeStartingFoodSupply,
  computeStartingWaterSupply,
} from "../game/preparation";
import type { OptionMeta } from "../game/preparation";

interface Props {
  config: PrepConfig;
  modifiers: PrepModifiers;
  dispatch: React.Dispatch<Action>;
}

function OptionGroup<K extends string | number>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: Record<K, OptionMeta>;
  selected: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="prep-group">
      <h3>{title}</h3>
      <div className="prep-options">
        {(Object.keys(options) as K[]).map((key) => {
          const opt = options[key];
          const active = key === selected || String(key) === String(selected);
          return (
            <button
              key={String(key)}
              className={`prep-tile ${active ? "prep-tile-active" : ""}`}
              onClick={() => onSelect(key)}
            >
              <strong>{opt.label}</strong>
              <span>{opt.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PreparationScreen({ config, modifiers, dispatch }: Props) {
  function update(patch: Partial<PrepConfig>) {
    dispatch({ type: "SET_PREP", config: { ...config, ...patch } });
  }

  const stamina = computeStartingStamina(modifiers);
  const hunger = computeStartingHunger(modifiers);
  const speed = 0.04 + modifiers.baseSpeedBonus;
  const foodSupply = computeStartingFoodSupply(config);
  const waterSupply = computeStartingWaterSupply(config);

  return (
    <div className="prep-screen">
      <div className="prep-container">
        <div className="prep-header">
          <h1>Prepare Your Climb</h1>
          <p className="prep-subtitle">
            Choose your gear, food, route, schedule, training, party size, and start time.
            Each decision affects your stats, supplies, and chances on the mountain.
          </p>
        </div>

        <div className="prep-body">
          <div className="prep-categories">
            <OptionGroup
              title="Gear"
              options={GEAR_OPTIONS}
              selected={config.gear}
              onSelect={(v) => update({ gear: v })}
            />
            <OptionGroup
              title="Food"
              options={FOOD_OPTIONS}
              selected={config.food}
              onSelect={(v) => update({ food: v })}
            />
            <OptionGroup
              title="Route"
              options={ROUTE_OPTIONS}
              selected={config.route}
              onSelect={(v) => update({ route: v })}
            />
            <OptionGroup
              title="Days Planned"
              options={DAYS_OPTIONS}
              selected={config.days}
              onSelect={(v) => update({ days: Number(v) as PrepConfig["days"] })}
            />
            <OptionGroup
              title="Training Duration"
              options={TRAINING_OPTIONS}
              selected={config.training}
              onSelect={(v) => update({ training: v })}
            />
            <OptionGroup
              title="Party Size"
              options={PARTY_OPTIONS}
              selected={config.party}
              onSelect={(v) => update({ party: Number(v) as PrepConfig["party"] })}
            />
            <OptionGroup
              title="Start Time"
              options={START_HOUR_OPTIONS}
              selected={config.startHour}
              onSelect={(v) => update({ startHour: Number(v) as PrepConfig["startHour"] })}
            />
          </div>

          <div className="prep-preview">
            <h3>Stats Preview</h3>

            <div className="preview-stat">
              <label>Starting Stamina</label>
              <div className="bar-track">
                <div
                  className={`bar-fill bar-stamina ${stamina < 50 ? "bar-danger" : ""}`}
                  style={{ width: `${stamina}%` }}
                />
              </div>
              <span className="bar-label">{stamina} / 100</span>
            </div>

            <div className="preview-stat">
              <label>Starting Hunger</label>
              <div className="bar-track">
                <div
                  className={`bar-fill bar-hunger ${hunger < 60 ? "bar-danger" : ""}`}
                  style={{ width: `${hunger}%` }}
                />
              </div>
              <span className="bar-label">{hunger} / 100</span>
            </div>

            <div className="preview-stat">
              <label>Weather Resistance</label>
              <span className="preview-value">
                {modifiers.weatherResistance > 0 && "+"}
                {modifiers.weatherResistance}
              </span>
            </div>

            <div className="preview-stat">
              <label>Speed Modifier</label>
              <span className="preview-value">
                {speed.toFixed(3)} / move
                {modifiers.baseSpeedBonus !== 0 && (
                  <span className={modifiers.baseSpeedBonus > 0 ? "mod-good" : "mod-bad"}>
                    {" "}({modifiers.baseSpeedBonus > 0 ? "+" : ""}{(modifiers.baseSpeedBonus * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>

            <div className="supply-divider" />
            <h3>Supplies</h3>

            <div className="preview-stat">
              <label>Food</label>
              <span className="preview-value">{foodSupply} meals</span>
            </div>

            <div className="preview-stat">
              <label>Water</label>
              <span className="preview-value">{waterSupply.toFixed(1)} L</span>
            </div>

            <div className="preview-stat">
              <label>Party</label>
              <span className="preview-value">
                {config.party === 1 ? "Solo" : `${config.party} climbers`}
              </span>
            </div>

            <div className="preview-stat">
              <label>Start Time</label>
              <span className="preview-value">
                {config.startHour}:00 AM
              </span>
            </div>

            <button
              className="start-btn prep-start"
              onClick={() => dispatch({ type: "CONFIRM_PREP" })}
            >
              Start Climb
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
