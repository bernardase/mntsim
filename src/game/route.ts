export interface Waypoint {
  name: string;
  altitude: number;     // metres
  progress: number;     // 0–1 position along route
  narrative: string;
  shelter?: "hut" | "tent_only";
}

export const WAYPOINTS: Waypoint[] = [
  {
    name: "Chamonix",
    altitude: 1035,
    progress: 0,
    narrative:
      "You set off from Chamonix, the bustling alpine town at the foot of Mont Blanc. The trail ahead winds through pine forests.",
  },
  {
    name: "Les Houches",
    altitude: 1800,
    progress: 0.1,
    narrative:
      "The path climbs steadily through Les Houches. Hikers pass you heading down, wishing you luck.",
  },
  {
    name: "Goûter Hut Trail",
    altitude: 2400,
    progress: 0.25,
    narrative:
      "You leave the tree line behind. The rocky trail toward the Goûter Hut stretches above you, exposed to rockfall.",
  },
  {
    name: "Grand Couloir",
    altitude: 3200,
    progress: 0.4,
    narrative:
      "The infamous Grand Couloir — a gully swept by rockfall. You cross quickly, heart pounding, eyes fixed on the far side.",
  },
  {
    name: "Goûter Hut",
    altitude: 3817,
    progress: 0.55,
    shelter: "hut",
    narrative:
      "You reach the Goûter Hut, a steel refuge perched on the ridge. Climbers rest here before the summit push. The air is thin.",
  },
  {
    name: "Dôme du Goûter",
    altitude: 4304,
    progress: 0.7,
    narrative:
      "The broad snow dome stretches ahead. Every step is an effort at this altitude. Winds rake the exposed ridge.",
  },
  {
    name: "Vallot Shelter",
    altitude: 4362,
    progress: 0.8,
    shelter: "hut",
    narrative:
      "The small emergency Vallot bivouac appears through the mist. Only for dire emergencies — the summit is close.",
  },
  {
    name: "Bosses Ridge",
    altitude: 4700,
    progress: 0.9,
    narrative:
      "The final airy ridge. A knife-edge of snow with dizzying drops on both sides. One foot in front of the other.",
  },
  {
    name: "Summit — Mont Blanc",
    altitude: 4808,
    progress: 1.0,
    narrative:
      "The summit of Mont Blanc, 4,808 m. The roof of Western Europe. You did it.",
  },
];

export function currentWaypoint(progress: number): Waypoint {
  for (let i = WAYPOINTS.length - 1; i >= 0; i--) {
    if (progress >= WAYPOINTS[i].progress) return WAYPOINTS[i];
  }
  return WAYPOINTS[0];
}

export function nextWaypoint(progress: number): Waypoint | null {
  for (const wp of WAYPOINTS) {
    if (wp.progress > progress) return wp;
  }
  return null;
}

/**
 * How icy/snowy the terrain is at a given progress (0–1).
 * Lower sections are rocky trails; above the Grand Couloir it's mostly snow and ice.
 */
export function icinessAtProgress(progress: number): number {
  if (progress < 0.15) return 0;
  if (progress < 0.30) return 0.15;
  if (progress < 0.45) return 0.4;
  if (progress < 0.60) return 0.7;
  return 1.0;
}

export function terrainLabel(iciness: number): string {
  if (iciness <= 0) return "Trail";
  if (iciness <= 0.2) return "Rocky";
  if (iciness <= 0.5) return "Mixed";
  if (iciness <= 0.8) return "Snow";
  return "Ice";
}

/**
 * Temperature swing across the day: coldest at 4 AM (-4), warmest at 14 (2 PM) (+5).
 * Uses a cosine curve shifted so the minimum is at hour 4 and maximum at hour 14.
 */
export function timeOfDayTempMod(hour: number): number {
  const peak = 14;
  const rad = ((hour - peak) / 24) * 2 * Math.PI;
  return Math.round(4.5 * Math.cos(rad) + 0.5);
}

/**
 * Iciness modifier by time of day.
 * Early morning (before 8): frozen hard, +0.15.
 * Midday transition (8-10): 0.
 * Afternoon (after 12): melting, -0.15.
 */
export function timeOfDayIcinessMod(hour: number): number {
  if (hour < 8) return 0.15;
  if (hour <= 10) return 0;
  return -0.15;
}

/**
 * Avalanche risk modifier by time of day.
 * Before 9 AM: low (0).
 * 10-14: moderate (+0.1).
 * After 14: high (+0.15).
 */
export function avalancheRiskMod(hour: number): number {
  if (hour < 9) return 0;
  if (hour <= 14) return 0.1;
  return 0.15;
}

/**
 * Ambient temperature in °C based on altitude, weather, and time of day.
 * Uses a standard lapse rate of ~6.5°C per 1000m from a base of 18°C at Chamonix.
 */
export function temperatureAt(altitude: number, weather: string, timeOfDay?: number): number {
  const base = 18 - (altitude - 1035) * 0.0065;
  const weatherMod: Record<string, number> = {
    clear: 3,
    cloudy: 0,
    wind: -3,
    snow: -8,
    storm: -12,
  };
  const timeMod = timeOfDay != null ? timeOfDayTempMod(timeOfDay) : 0;
  return Math.round(base + (weatherMod[weather] ?? 0) + timeMod);
}

/**
 * Effective temperature felt by the climber, accounting for clothing layers.
 * Each layer adds ~6°C of warmth.
 */
export function effectiveTemperature(ambient: number, layers: number): number {
  return ambient + layers * 6;
}

export function altitudeAtProgress(progress: number): number {
  if (progress <= 0) return WAYPOINTS[0].altitude;
  if (progress >= 1) return WAYPOINTS[WAYPOINTS.length - 1].altitude;

  let lower = WAYPOINTS[0];
  let upper = WAYPOINTS[1];
  for (let i = 1; i < WAYPOINTS.length; i++) {
    if (WAYPOINTS[i].progress >= progress) {
      upper = WAYPOINTS[i];
      lower = WAYPOINTS[i - 1];
      break;
    }
  }
  const t =
    (progress - lower.progress) / (upper.progress - lower.progress || 1);
  return Math.round(lower.altitude + t * (upper.altitude - lower.altitude));
}
