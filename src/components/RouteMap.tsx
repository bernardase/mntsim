import { useId } from "react";
import type { GameState, RouteOption } from "../game/types";
import { formatTime } from "../game/types";
import { ROUTE_DATA } from "../game/route";
import {
  altitudeAtProgress,
  temperatureAt,
  effectiveTemperature,
} from "../game/route";
import { computeTransmitRisks, transmitRiskOnFive, ROCKY_PROGRESS } from "../game/events";

const MOUNTAIN_POLY = "0,500 80,440 150,350 220,220 300,145 370,50 450,120 450,500";
const RIDGE_LINE = "80,440 150,350 220,220 300,145 370,50 450,120";

/** Progress boundaries aligned with `icinessAtProgress` in route.ts */
const ZONE_EDGES = [0, 0.1, 0.25, 0.4, 0.55, 1] as const;
const ZONE_CLASSES = [
  "map-zone-trail",
  "map-zone-rocky",
  "map-zone-icyrock",
  "map-zone-snow",
  "map-zone-ice",
] as const;

interface Props {
  state: GameState;
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

function bandRects(route: RouteOption): { x: number; width: number; className: string }[] {
  const out: { x: number; width: number; className: string }[] = [];
  for (let i = 0; i < ZONE_EDGES.length - 1; i++) {
    const t0 = ZONE_EDGES[i];
    const t1 = ZONE_EDGES[i + 1];
    const [x0] = interpolate(t0, route);
    const [x1] = interpolate(t1, route);
    const left = Math.min(x0, x1);
    const width = Math.abs(x1 - x0);
    out.push({ x: left, width, className: ZONE_CLASSES[i] });
  }
  return out;
}

export default function RouteMap({ state }: Props) {
  const uid = useId().replace(/:/g, "");
  const route = state.prepConfig.route;
  const { waypoints, points } = ROUTE_DATA[route];
  const [px, py] = interpolate(state.progress, route);
  const bands = bandRects(route);
  const snowLinePt = interpolate(0.38, route);

  const alt = altitudeAtProgress(state.progress);
  const amb = temperatureAt(alt, state.weather, state.timeOfDay);
  const eff = effectiveTemperature(amb, state.layers);
  const risks = computeTransmitRisks(state);
  const avy5 = transmitRiskOnFive(risks.avalanche);
  const rock5 = transmitRiskOnFive(risks.rockfall);
  const showTransmit = state.progress >= ROCKY_PROGRESS;
  const hazardStroke = showTransmit
    ? 2.2 + (Math.max(risks.avalanche, risks.rockfall) / 100) * 2.2
    : 3;

  const clipId = `${uid}-clip`;
  const skyGrad = `${uid}-sky`;
  const mtnGrad = `${uid}-mtn`;

  return (
    <div className="route-map">
      <h2 className="route-map-title">Route map</h2>
      <div className="map-svg-wrap">
        <svg viewBox="0 0 450 500" className="map-svg" aria-label="Elevation profile and route to summit">
          <defs>
            <linearGradient id={skyGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#243352" />
              <stop offset="45%" stopColor="#151c2e" />
              <stop offset="100%" stopColor="#0a0e18" />
            </linearGradient>
            <linearGradient id={mtnGrad} x1="0" y1="1" x2="0.85" y2="0">
              <stop offset="0%" stopColor="#141824" />
              <stop offset="35%" stopColor="#252d45" />
              <stop offset="70%" stopColor="#343f5c" />
              <stop offset="100%" stopColor="#4a5878" />
            </linearGradient>
            <clipPath id={clipId}>
              <polygon points={MOUNTAIN_POLY} />
            </clipPath>
          </defs>

          <rect width="450" height="500" fill={`url(#${skyGrad})`} className="map-sky" />

          <ellipse cx="225" cy="498" rx="200" ry="14" className="map-ground-shadow" />

          <polygon points={MOUNTAIN_POLY} fill={`url(#${mtnGrad})`} className="mountain-mass" />
          <polyline points={RIDGE_LINE} className="mountain-ridge" />

          <g clipPath={`url(#${clipId})`}>
            {bands.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={0}
                width={Math.max(b.width, 1)}
                height={500}
                className={b.className}
              />
            ))}
          </g>

          <path d={pathD(points)} className="route-path route-path-glow" />
          <path
            d={pathD(points)}
            className="route-path route-path-main"
            style={{ strokeWidth: hazardStroke }}
          />

          {points.map((p, i) => (
            <g key={i} className="waypoint-group">
              {waypoints[i].shelter === "hut" ? (
                <g transform={`translate(${p[0]}, ${p[1]})`} className="hut-marker">
                  <circle cx="0" cy="2" r="14" className="hut-halo" />
                  <polygon points="-8,0 0,-10 8,0" className="hut-roof" />
                  <rect x="-6" y="0" width="12" height="8" rx="1" className="hut-body" />
                  <rect x="-2" y="3" width="4" height="5" className="hut-door" />
                </g>
              ) : (
                <>
                  <circle cx={p[0]} cy={p[1]} r="8" className="waypoint-ring" />
                  <circle cx={p[0]} cy={p[1]} r="4.5" className="waypoint-core" />
                </>
              )}
              <text
                x={p[0] + 12}
                y={p[1] + 4}
                className={`waypoint-label${waypoints[i].shelter === "hut" ? " waypoint-hut-label" : ""}`}
              >
                {waypoints[i].name}
              </text>
            </g>
          ))}

          <g className="snow-line-group" transform={`translate(${snowLinePt[0]}, ${snowLinePt[1]})`}>
            <line x1="0" y1="-32" x2="0" y2="36" className="snow-line-mark" />
            <rect x="-42" y="-48" width="84" height="18" rx="4" className="snow-line-badge" />
            <text x="0" y="-35" textAnchor="middle" className="snow-line-label">
              Snow line
            </text>
          </g>

          <g className="player-group" transform={`translate(${px}, ${py})`}>
            <circle r="14" className="player-glow" />
            <circle r="9" className="player-marker" />
            <circle r="12" className="player-pulse" />
          </g>
        </svg>

        {showTransmit && (
          <div
            className="map-transmitter"
            title={`Terrain & exposure zone · ${amb}°C feels ${eff}°C · ${state.weather}`}
          >
            <div className="map-transmitter-radio" aria-hidden>
              <div className="map-transmitter-antenna" />
              <div className="map-transmitter-body">
                <div className="map-transmitter-screen">
                  <div className="map-transmitter-row">
                    <span className="map-transmitter-k">Avalanche</span>
                    <span className="map-transmitter-v">
                      {avy5}/5
                    </span>
                  </div>
                  <div className="map-transmitter-row">
                    <span className="map-transmitter-k">Rockfall</span>
                    <span className="map-transmitter-v">
                      {rock5}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="map-transmitter-meta">
              {formatTime(state.timeOfDay)} · {state.weather} · {amb}°C / feels {eff}°C
            </div>
            {state.detourAvoidingExposure && (
              <div className="map-transmitter-reroute">Reroute active</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
