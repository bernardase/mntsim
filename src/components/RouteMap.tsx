import type { RouteOption } from "../game/types";
import { ROUTE_DATA } from "../game/route";

interface Props {
  progress: number;
  route: RouteOption;
}

function pathD(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
}

function interpolate(progress: number, route: RouteOption): [number, number] {
  const { waypoints, points } = ROUTE_DATA[route];
  if (progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  let lower = 0;
  for (let i = 1; i < waypoints.length; i++) {
    if (waypoints[i].progress >= progress) {
      lower = i - 1;
      break;
    }
  }
  const upper = lower + 1;
  const seg =
    (progress - waypoints[lower].progress) /
    (waypoints[upper].progress - waypoints[lower].progress || 1);
  const x = points[lower][0] + seg * (points[upper][0] - points[lower][0]);
  const y = points[lower][1] + seg * (points[upper][1] - points[lower][1]);
  return [x, y];
}

export default function RouteMap({ progress, route }: Props) {
  const { waypoints, points } = ROUTE_DATA[route];
  const [px, py] = interpolate(progress, route);

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
        <path d={pathD(points)} className="route-path" />

        {/* waypoint dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            {waypoints[i].shelter === "hut" ? (
              <g transform={`translate(${p[0]}, ${p[1]})`}>
                <polygon points="-8,0 0,-10 8,0" className="hut-roof" />
                <rect x="-6" y="0" width="12" height="8" rx="1" className="hut-body" />
                <rect x="-2" y="3" width="4" height="5" className="hut-door" />
              </g>
            ) : (
              <circle cx={p[0]} cy={p[1]} r="5" className="waypoint-dot" />
            )}
            <text
              x={p[0] + 10}
              y={p[1] + 4}
              className={`waypoint-label${waypoints[i].shelter === "hut" ? " waypoint-hut-label" : ""}`}
            >
              {waypoints[i].name}
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
