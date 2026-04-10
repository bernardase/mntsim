import { useReducer } from "react";
import { INITIAL_STATE } from "./game/types";
import { gameReducer } from "./game/reducer";
import ClimbOverview from "./components/ClimbOverview";
import RouteMap from "./components/RouteMap";
import SituationPanel from "./components/SituationPanel";
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
          <p className="tagline">
            4,808 m &middot; The highest peak in the Alps.
            <br />
            Will you reach the top?
          </p>
          <button
            className="start-btn"
            onClick={() => dispatch({ type: "START_PREP" })}
          >
            Begin Climb
          </button>
        </div>
      </div>
    );
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

  if (state.phase === "summit" || state.phase === "failed") {
    return (
      <div className="end-screen">
        <div className={`end-card ${state.phase}`}>
          <h1>{state.phase === "summit" ? "Summit Reached!" : "Climb Failed"}</h1>
          <div className="narrative">
            {state.narrative.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="end-stats">
            <span>Hours Hiked: {state.hoursHiked}</span>
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
        <RouteMap progress={state.progress} />
      </main>
      <aside className="col col-right">
        <SituationPanel state={state} dispatch={dispatch} />
      </aside>
    </div>
  );
}
