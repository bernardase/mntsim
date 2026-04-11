import type { RouteOption } from "./types";

export interface Waypoint {
  name: string;
  altitude: number;     // metres
  progress: number;     // 0–1 position along route
  narrative: string;
  shelter?: "hut" | "tent_only";
}

export interface RouteData {
  waypoints: Waypoint[];
  points: [number, number][];
}

const GOUTER_WAYPOINTS: Waypoint[] = [
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

const GOUTER_POINTS: [number, number][] = [
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

const THREE_MONTS_WAYPOINTS: Waypoint[] = [
  {
    name: "Chamonix",
    altitude: 1035,
    progress: 0,
    narrative:
      "You set off from Chamonix heading toward the Aiguille du Midi cable car. The Three Monts route awaits.",
  },
  {
    name: "Aiguille du Midi",
    altitude: 3842,
    progress: 0.15,
    narrative:
      "The cable car deposits you at 3,842 m. The air is thin and the cold hits immediately. The glacier drops away below.",
  },
  {
    name: "Col du Midi",
    altitude: 3532,
    progress: 0.25,
    narrative:
      "You descend onto the Col du Midi glacier. Crevasses line the route — rope up and stay alert.",
  },
  {
    name: "Mont Blanc du Tacul",
    altitude: 4248,
    progress: 0.4,
    narrative:
      "The steep face of Mont Blanc du Tacul rises ahead. A relentless 45° ice slope — crampon technique is everything.",
  },
  {
    name: "Col Maudit",
    altitude: 4035,
    progress: 0.55,
    narrative:
      "You cross the Col Maudit, a narrow saddle between seracs. Ice towers loom above, groaning in the sun.",
  },
  {
    name: "Mont Maudit",
    altitude: 4465,
    progress: 0.65,
    shelter: "hut",
    narrative:
      "The shoulder of Mont Maudit. A small bivouac shelter offers respite. The final pyramid of Mont Blanc fills the sky.",
  },
  {
    name: "Mur de la Côte",
    altitude: 4600,
    progress: 0.8,
    narrative:
      "The infamous Mur de la Côte — a brutal 40° ice wall. Your calves burn with every step. Don't look down.",
  },
  {
    name: "Summit Ridge",
    altitude: 4750,
    progress: 0.9,
    narrative:
      "The final snow ridge narrows to a blade. Wind rips across from both sides. The summit is just ahead.",
  },
  {
    name: "Summit — Mont Blanc",
    altitude: 4808,
    progress: 1.0,
    narrative:
      "The summit of Mont Blanc, 4,808 m. The roof of Western Europe. You did it.",
  },
];

const THREE_MONTS_POINTS: [number, number][] = [
  [80, 440],   // Chamonix
  [130, 380],  // Aiguille du Midi
  [170, 400],  // Col du Midi (descend)
  [210, 290],  // Mont Blanc du Tacul
  [250, 230],  // Col Maudit
  [280, 180],  // Mont Maudit
  [320, 120],  // Mur de la Côte
  [350, 80],   // Summit Ridge
  [370, 50],   // Summit
];

const GRAND_MULETS_WAYPOINTS: Waypoint[] = [
  {
    name: "Chamonix",
    altitude: 1035,
    progress: 0,
    narrative:
      "You set off from Chamonix toward the Plan de l'Aiguille. The Grand Mulets route — the original path up Mont Blanc.",
  },
  {
    name: "Plan de l'Aiguille",
    altitude: 2317,
    progress: 0.1,
    narrative:
      "You reach the Plan de l'Aiguille midstation. Below, the Bossons Glacier tumbles in a chaos of ice.",
  },
  {
    name: "Bossons Glacier",
    altitude: 2800,
    progress: 0.2,
    narrative:
      "You step onto the Bossons Glacier. Crevasses yawn open around you. The ice creaks and shifts underfoot.",
  },
  {
    name: "Jonction",
    altitude: 3300,
    progress: 0.35,
    narrative:
      "The Jonction — where the Bossons and Taconnaz glaciers meet in a chaotic jumble of seracs and crevasses.",
  },
  {
    name: "Grand Mulets Hut",
    altitude: 3051,
    progress: 0.45,
    shelter: "hut",
    narrative:
      "The historic Grand Mulets Hut perches on a rocky island amid the glacier. A welcome refuge from the ice.",
  },
  {
    name: "Petit Plateau",
    altitude: 3650,
    progress: 0.55,
    narrative:
      "The Petit Plateau — a deceptive flat area riddled with hidden crevasses. Move carefully and stay roped.",
  },
  {
    name: "Grand Plateau",
    altitude: 4000,
    progress: 0.7,
    narrative:
      "The vast Grand Plateau stretches before you. Avalanche debris litters the snow. The Corridor beckons above.",
  },
  {
    name: "The Corridor",
    altitude: 4400,
    progress: 0.85,
    shelter: "hut",
    narrative:
      "The Corridor — a steep gully channeling avalanches from above. Speed is survival here. A small emergency shelter marks the exit.",
  },
  {
    name: "Summit — Mont Blanc",
    altitude: 4808,
    progress: 1.0,
    narrative:
      "The summit of Mont Blanc, 4,808 m. The roof of Western Europe. You did it.",
  },
];

const GRAND_MULETS_POINTS: [number, number][] = [
  [80, 440],   // Chamonix
  [110, 390],  // Plan de l'Aiguille
  [150, 350],  // Bossons Glacier
  [190, 290],  // Jonction
  [220, 240],  // Grand Mulets Hut
  [260, 200],  // Petit Plateau
  [300, 150],  // Grand Plateau
  [340, 100],  // The Corridor
  [370, 50],   // Summit
];

export const ROUTE_DATA: Record<RouteOption, RouteData> = {
  gouter: { waypoints: GOUTER_WAYPOINTS, points: GOUTER_POINTS },
  three_monts: { waypoints: THREE_MONTS_WAYPOINTS, points: THREE_MONTS_POINTS },
  grand_mulets: { waypoints: GRAND_MULETS_WAYPOINTS, points: GRAND_MULETS_POINTS },
};

// Active route — set when the game starts, used by all route functions
let activeRoute: RouteOption = "gouter";

export function setActiveRoute(route: RouteOption) {
  activeRoute = route;
}

export function getActiveRouteData(): RouteData {
  return ROUTE_DATA[activeRoute];
}

export function getWaypoints(): Waypoint[] {
  return ROUTE_DATA[activeRoute].waypoints;
}

export function currentWaypoint(progress: number): Waypoint {
  const wps = getWaypoints();
  for (let i = wps.length - 1; i >= 0; i--) {
    if (progress >= wps[i].progress) return wps[i];
  }
  return wps[0];
}

export function nextWaypoint(progress: number): Waypoint | null {
  const wps = getWaypoints();
  for (const wp of wps) {
    if (wp.progress > progress) return wp;
  }
  return null;
}

/**
 * How icy/snowy the terrain is at a given progress (0–1).
 * Chamonix is easy trail. Les Houches onward is rocky scrambling.
 * From the Goûter Hut Trail (0.25) onward, ice and snow dominate.
 */
export function icinessAtProgress(progress: number): number {
  if (progress < 0.10) return 0;
  if (progress < 0.25) return 0.1;
  if (progress < 0.40) return 0.5;
  if (progress < 0.55) return 0.75;
  return 1.0;
}

export function terrainLabel(iciness: number): string {
  if (iciness <= 0) return "Trail";
  if (iciness <= 0.15) return "Rocky";
  if (iciness <= 0.55) return "Icy Rock";
  if (iciness <= 0.8) return "Snow";
  return "Ice";
}

export function timeOfDayTempMod(hour: number): number {
  const peak = 14;
  const rad = ((hour - peak) / 24) * 2 * Math.PI;
  return Math.round(4.5 * Math.cos(rad) + 0.5);
}

export function timeOfDayIcinessMod(hour: number): number {
  if (hour < 8) return 0.15;
  if (hour <= 10) return 0;
  return -0.15;
}

export function avalancheRiskMod(hour: number): number {
  if (hour < 9) return 0;
  if (hour <= 14) return 0.1;
  return 0.15;
}

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

export function effectiveTemperature(ambient: number, layers: number): number {
  return ambient + layers * 6;
}

export function altitudeAtProgress(progress: number): number {
  const wps = getWaypoints();
  if (progress <= 0) return wps[0].altitude;
  if (progress >= 1) return wps[wps.length - 1].altitude;

  let lower = wps[0];
  let upper = wps[1];
  for (let i = 1; i < wps.length; i++) {
    if (wps[i].progress >= progress) {
      upper = wps[i];
      lower = wps[i - 1];
      break;
    }
  }
  const t =
    (progress - lower.progress) / (upper.progress - lower.progress || 1);
  return Math.round(lower.altitude + t * (upper.altitude - lower.altitude));
}
