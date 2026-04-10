import type { GameState, Action } from "../game/types";
import { INLINE_CHOICE_LABELS } from "./ClimbOverview";

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
      <h2>Situation</h2>

      <div className="narrative">
        {state.narrative.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {state.currentEvents.length > 0 && (
        <div className="events-list">
          <h3>Events This Hour</h3>
          {state.currentEvents.map((ev) => (
            <div
              key={ev.id}
              className={`event-card event-${ev.polarity} event-${ev.size}`}
            >
              <strong>{ev.title}</strong>
              {ev.size === "major" && <span className="major-badge">MAJOR</span>}
              <p>{ev.description}</p>
            </div>
          ))}
        </div>
      )}

      {mainChoices.length > 0 && (
        <div className="choices">
          <h3>What do you do?</h3>
          {mainChoices.map(({ choice, index }) => (
            <button
              key={index}
              className="choice-btn"
              onClick={() => dispatch({ type: "CHOOSE", index })}
            >
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
