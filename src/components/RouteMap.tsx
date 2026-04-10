import { WAYPOINTS } from "../game/route";

interface Props {
  progress: number;
}

const POINTS: [number, number][] = [
  [80, 440],   // Chamonix
  [100, 400],  // Les Houches
  [140, 340],  // Goûter Hut Trail
  [180, 280],  // Grand Couloir
  [220, 220],  // Goûter Hut
  [270, 170],  // Dôme du Goûter
  [300, 145],  // Vallot Shelter
  [340, 100],  // Bosses Ridge
  [370, 50],   // Summit
];

function pathD(): string {
  return POINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
}

function interpolate(progress: number): [number, number] {
  if (progress <= 0) return POINTS[0];
  if (progress >= 1) return POINTS[POINTS.length - 1];

  let lower = 0;
  for (let i = 1; i < WAYPOINTS.length; i++) {
    if (WAYPOINTS[i].progress >= progress) {
      lower = i - 1;
      break;
    }
  }
  const upper = lower + 1;
  const seg =
    (progress - WAYPOINTS[lower].progress) /
    (WAYPOINTS[upper].progress - WAYPOINTS[lower].progress || 1);
  const x = POINTS[lower][0] + seg * (POINTS[upper][0] - POINTS[lower][0]);
  const y = POINTS[lower][1] + seg * (POINTS[upper][1] - POINTS[lower][1]);
  return [x, y];
}

export default function RouteMap({ progress }: Props) {
  const [px, py] = interpolate(progress);

  return (
    <div className="route-map">
      <h2>Route Map</h2>
      <svg viewBox="0 0 450 500" className="map-svg">
        {/* mountain silhouette */}
        <polygon
          points="0,500 80,440 150,350 220,220 300,145 370,50 450,120 450,500"
          className="mountain-fill"
        />

        {/* route line */}
        <path d={pathD()} className="route-path" />

        {/* waypoint dots + labels */}
        {POINTS.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="5" className="waypoint-dot" />
            <text
              x={p[0] + 10}
              y={p[1] + 4}
              className="waypoint-label"
            >
              {WAYPOINTS[i].name}
            </text>
          </g>
        ))}

        {/* player marker */}
        <circle cx={px} cy={py} r="8" className="player-marker" />
        <circle cx={px} cy={py} r="12" className="player-pulse" />
      </svg>
    </div>
  );
}
