import type { Action, Difficulty } from "../game/types";

interface Props {
  dispatch: React.Dispatch<Action>;
}

const DIFFICULTIES: { key: Difficulty; title: string; icon: string; desc: string; details: string[] }[] = [
  {
    key: "easy",
    title: "Easy",
    icon: "🟢",
    desc: "A scenic hike for beginners.",
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
    desc: "The real Mont Blanc experience.",
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
    desc: "Only for seasoned alpinists.",
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
        <h1>Choose Your Difficulty</h1>
        <p className="difficulty-subtitle">
          This affects stat drains, stamina costs, event danger, and starting supplies.
        </p>
        <div className="difficulty-cards">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              className={`difficulty-card difficulty-${d.key}`}
              onClick={() => dispatch({ type: "SET_DIFFICULTY", difficulty: d.key })}
            >
              <span className="difficulty-icon">{d.icon}</span>
              <h2>{d.title}</h2>
              <p className="difficulty-desc">{d.desc}</p>
              <ul className="difficulty-details">
                {d.details.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
