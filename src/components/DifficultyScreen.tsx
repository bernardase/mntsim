import type { Action, Difficulty } from "../game/types";

interface Props {
  dispatch: React.Dispatch<Action>;
}

const DIFFICULTIES: { key: Difficulty; title: string; icon: string; desc: string; details: string[] }[] = [
  {
    key: "easy",
    title: "Easy",
    icon: "🟢",
    desc: "Gentler drains and events.",
    details: [
      "50% slower stat drains",
      "50% less stamina cost",
      "Fewer bad events",
      "Extra starting stamina",
      "50% more food & water",
    ],
  },
  {
    key: "normal",
    title: "Normal",
    icon: "🟡",
    desc: "Default balance.",
    details: [
      "Standard stat drains",
      "Standard stamina cost",
      "Balanced event chance",
      "Normal starting stats",
      "Standard supplies",
    ],
  },
  {
    key: "hard",
    title: "Hard",
    icon: "🔴",
    desc: "Harsher drains and danger.",
    details: [
      "80% faster stat drains",
      "60% more stamina cost",
      "More frequent bad events",
      "Reduced starting stamina",
      "30% less food & water",
    ],
  },
];

export default function DifficultyScreen({ dispatch }: Props) {
  return (
    <div className="difficulty-screen">
      <div className="difficulty-container">
        <h1>Difficulty</h1>
        <div className="difficulty-cards">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`difficulty-card difficulty-${d.key}`}
              title={d.details.join(" · ")}
              onClick={() => dispatch({ type: "SET_DIFFICULTY", difficulty: d.key })}
            >
              <span className="difficulty-icon">{d.icon}</span>
              <h2>{d.title}</h2>
              <p className="difficulty-desc">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
