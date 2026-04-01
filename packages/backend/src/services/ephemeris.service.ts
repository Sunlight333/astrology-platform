import { env } from '../config/env';
import {
  PlanetaryPosition,
  HouseCusp,
  ChartAngles,
  Planet,
  ZodiacSign,
  HouseSystem,
  ZODIAC_SIGNS,
  PLANETS,
} from '@star/shared';

// ---------------------------------------------------------------------------
// Lazy-load sweph – it's a native module that may not be compiled on all hosts.
// The app will start without it, but ephemeris calls will throw at runtime.
// ---------------------------------------------------------------------------

let sweph: any = null;

function getSweph(): any {
  if (!sweph) {
    try {
      sweph = require('sweph');
    } catch (e: any) {
      throw new Error(
        'Swiss Ephemeris native module (sweph) is not available. ' +
          'Install build tools (build-essential) and run "npm rebuild sweph". ' +
          `Original error: ${e.message}`,
      );
    }
  }
  return sweph;
}

// ---------------------------------------------------------------------------
// Planet ID mapping – sweph integer constants (standard values)
// ---------------------------------------------------------------------------

const PLANET_ID_MAP: Record<Planet, number> = {
  Sun: 0,      // SE_SUN
  Moon: 1,     // SE_MOON
  Mercury: 2,  // SE_MERCURY
  Venus: 3,    // SE_VENUS
  Mars: 4,     // SE_MARS
  Jupiter: 5,  // SE_JUPITER
  Saturn: 6,   // SE_SATURN
  Uranus: 7,   // SE_URANUS
  Neptune: 8,  // SE_NEPTUNE
  Pluto: 9,    // SE_PLUTO
};

const SEFLG_SPEED = 256;
const SEFLG_MOSEPH = 4;
const SE_GREG_CAL = 1;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const sw = getSweph();

  try {
    sw.swe_set_ephe_path(env.EPHEMERIS_PATH);
  } catch {
    console.warn(
      `[ephemeris] Could not set ephemeris path "${env.EPHEMERIS_PATH}". ` +
        'Falling back to built-in Moshier ephemeris.',
    );
  }

  initialized = true;
}

// ---------------------------------------------------------------------------
// Longitude → zodiac helpers
// ---------------------------------------------------------------------------

function longitudeToSign(longitude: number): ZodiacSign {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

function longitudeToDegree(longitude: number): number {
  return Math.floor(longitude % 30);
}

function longitudeToMinute(longitude: number): number {
  const fractionalDegree = (longitude % 30) - Math.floor(longitude % 30);
  return Math.floor(fractionalDegree * 60);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface HouseCuspsResult {
  cusps: HouseCusp[];
  angles: ChartAngles;
}

export function dateToJulianDay(utcDate: Date): number {
  ensureInitialized();
  const sw = getSweph();

  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
  const hour =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600 +
    utcDate.getUTCMilliseconds() / 3_600_000;

  return sw.swe_julday(year, month, day, hour, SE_GREG_CAL);
}

export function calculatePlanetaryPositions(
  julianDay: number,
): PlanetaryPosition[] {
  ensureInitialized();
  const sw = getSweph();

  const positions: PlanetaryPosition[] = [];

  for (const planet of PLANETS) {
    const planetId = PLANET_ID_MAP[planet];
    const result = sw.swe_calc_ut(julianDay, planetId, SEFLG_SPEED);

    if ((result as any).error) {
      console.warn(
        `[ephemeris] Error calculating ${planet}: ${(result as any).error}. Attempting Moshier fallback.`,
      );
      const fallback = sw.swe_calc_ut(julianDay, planetId, SEFLG_SPEED | SEFLG_MOSEPH);
      if ((fallback as any).error) {
        throw new Error(`Failed to calculate position for ${planet}: ${(fallback as any).error}`);
      }
      Object.assign(result, fallback);
    }

    const longitude: number = (result as any).longitude;
    const latitude: number = (result as any).latitude;
    const distance: number = (result as any).distance;
    const speedInLongitude: number = (result as any).longitudeSpeed;

    positions.push({
      planet,
      longitude,
      latitude,
      distance,
      speedInLongitude,
      sign: longitudeToSign(longitude),
      degree: longitudeToDegree(longitude),
      minute: longitudeToMinute(longitude),
      isRetrograde: speedInLongitude < 0,
    });
  }

  return positions;
}

export function calculateHouseCusps(
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem = 'P',
): HouseCuspsResult {
  ensureInitialized();
  const sw = getSweph();

  const result = sw.swe_houses(julianDay, latitude, longitude, houseSystem);

  const rawCusps: number[] = (result as any).cusps;
  const ascmc: number[] = (result as any).ascmc;

  const cusps: HouseCusp[] = [];
  for (let i = 1; i <= 12; i++) {
    const lng = rawCusps[i];
    cusps.push({
      house: i,
      sign: longitudeToSign(lng),
      degree: longitudeToDegree(lng),
      longitude: lng,
    });
  }

  const angles: ChartAngles = {
    ascendant: ascmc[0],
    mc: ascmc[1],
    armc: ascmc[2],
    vertex: ascmc[3],
  };

  return { cusps, angles };
}
