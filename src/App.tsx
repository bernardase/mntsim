import { useReducer } from "react";
import { INITIAL_STATE, formatTrailElapsed } from "./game/types";
import { gameReducer } from "./game/reducer";
import ClimbOverview from "./components/ClimbOverview";
import RouteMap from "./components/RouteMap";
import SituationPanel from "./components/SituationPanel";
import DifficultyScreen from "./components/DifficultyScreen";
import PreparationScreen from "./components/PreparationScreen";
import WakeUpScreen from "./components/WakeUpScreen";
import "./App.css";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  if (state.phase === "title") {
    return (
      <div className="title-screen">
        <div className="title-card">
          <h1>Mont Blanc</h1>
          <p className="subtitle">Summit Simulator</p>
          <p className="tagline">4,808 m — Alps summit simulator.</p>
          <button
            className="start-btn"
            onClick={() => dispatch({ type: "START_GAME" })}
          >
            Begin Climb
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === "difficulty") {
    return <DifficultyScreen dispatch={dispatch} />;
  }

  if (state.phase === "preparation") {
    return (
      <PreparationScreen
        config={state.prepConfig}
        modifiers={state.prepModifiers}
        dispatch={dispatch}
      />
    );
  }

  if (state.phase === "waking") {
    return <WakeUpScreen state={state} dispatch={dispatch} />;
  }

  if (state.phase === "summit") {
    return (
      <div className="end-screen">
        <div className="end-card summit">
          <h1>Summit Reached!</h1>
          <div className="narrative">
            {state.narrative.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="end-stats">
            <span>On trail: {formatTrailElapsed(state.hoursHiked)}</span>
            <span>Stamina: {Math.round(state.stamina)}</span>
          </div>
          <div className="summit-actions">
            <button
              className="start-btn"
              onClick={() => dispatch({ type: "BEGIN_DESCENT" })}
            >
              Begin Descent
            </button>
            <button
              className="start-btn secondary-btn"
              onClick={() => dispatch({ type: "START_PREP" })}
            >
              New Climb
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "failed") {
    return (
      <div className="end-screen">
        <div className="end-card failed">
          <h1>Climb Failed</h1>
          <div className="narrative">
            {state.narrative.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="end-stats">
            <span>On trail: {formatTrailElapsed(state.hoursHiked)}</span>
            <span>Stamina: {Math.round(state.stamina)}</span>
            <span>Progress: {Math.round(state.progress * 100)}%</span>
          </div>
          <button
            className="start-btn"
            onClick={() => dispatch({ type: "START_PREP" })}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      <aside className="col col-left">
        <ClimbOverview state={state} dispatch={dispatch} />
      </aside>
      <main className="col col-center">
        <RouteMap state={state} />
      </main>
      <aside className="col col-right">
        <SituationPanel state={state} dispatch={dispatch} />
      </aside>
    </div>
  );
}
