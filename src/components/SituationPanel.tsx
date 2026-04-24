import type { GameState, Action } from "../game/types";
import { INLINE_CHOICE_LABELS } from "./ClimbOverview";

const ACTION_ICONS: Record<string, string> = {
  "Push Forward": "🥾",
  "Rest & Recover": "☕",
  "Slow Down": "🐢",
  "Normal Pace": "👟",
  "Speed Up": "⚡",
  "Eat a Meal": "🍽️",
  "Drink Water": "💧",
  "Sleep in Hut": "🏠",
  "Sleep in Tent": "⛺",
  "Shelter in Place": "🛡️",
  "Descend": "⬇️",
  "Save Teammate": "🤝",
  Reroute: "🔀",
  "Resume main line": "➡️",
};

interface Props {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

export default function SituationPanel({ state, dispatch }: Props) {
  const mainChoices = state.choices
    .map((c, i) => ({ choice: c, index: i }))
    .filter(({ choice }) => !INLINE_CHOICE_LABELS.has(choice.label));

  return (
    <div className="situation-panel">
      <div className="narrative">
        {state.narrative.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {state.currentEvents.length > 0 && (
        <div className="events-list">
          {state.currentEvents.map((ev) => (
            <div
              key={ev.id}
              className={`event-card event-${ev.polarity} event-${ev.size}`}
              title={ev.description}
            >
              <strong>{ev.title}</strong>
              {ev.size === "major" && <span className="major-badge">MAJOR</span>}
            </div>
          ))}
        </div>
      )}

      {mainChoices.length > 0 && (
        <div className="choices">
          {mainChoices.map(({ choice, index }) => (
            <button
              key={index}
              type="button"
              className={`choice-btn${choice.label === "Reroute" ? " choice-reroute" : ""}`}
              title={choice.description}
              onClick={() => dispatch({ type: "CHOOSE", index })}
              disabled={state.mainActionsThisHour >= 1}
            >
              <strong>
                {ACTION_ICONS[choice.label] && (
                  <span className="choice-icon">{ACTION_ICONS[choice.label]}</span>
                )}
                {choice.label}
              </strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
