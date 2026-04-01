import * as sweph from 'sweph';
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
// Planet ID mapping – sweph integer constants
// ---------------------------------------------------------------------------

const PLANET_IDS: Record<Planet, number> = {
  Sun: sweph.SE_SUN,
  Moon: sweph.SE_MOON,
  Mercury: sweph.SE_MERCURY,
  Venus: sweph.SE_VENUS,
  Mars: sweph.SE_MARS,
  Jupiter: sweph.SE_JUPITER,
  Saturn: sweph.SE_SATURN,
  Uranus: sweph.SE_URANUS,
  Neptune: sweph.SE_NEPTUNE,
  Pluto: sweph.SE_PLUTO,
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let initialized = false;

/**
 * Initialise the Swiss Ephemeris engine.
 *
 * Attempts to load data files from the configured EPHEMERIS_PATH. If the path
 * is missing or unreadable the library automatically falls back to the built-in
 * Moshier analytical ephemeris, which is accurate to ~1 arc-second for modern
 * dates – perfectly acceptable for astrological work.
 */
function ensureInitialized(): void {
  if (initialized) return;

  try {
    sweph.swe_set_ephe_path(env.EPHEMERIS_PATH);
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

/**
 * Determine the zodiac sign for an ecliptic longitude (0-360).
 */
function longitudeToSign(longitude: number): ZodiacSign {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

/**
 * Extract the whole degree within a sign (0-29) from an ecliptic longitude.
 */
function longitudeToDegree(longitude: number): number {
  return Math.floor(longitude % 30);
}

/**
 * Extract the arc-minute component from an ecliptic longitude.
 */
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

/**
 * Convert a JavaScript `Date` (assumed UTC) to a Julian Day number suitable
 * for use with `swe_calc_ut`.
 */
export function dateToJulianDay(utcDate: Date): number {
  ensureInitialized();

  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
  const hour =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600 +
    utcDate.getUTCMilliseconds() / 3_600_000;

  // SE_GREG_CAL = 1 (Gregorian calendar)
  return sweph.swe_julday(year, month, day, hour, 1);
}

/**
 * Calculate ecliptic positions for the ten standard astrological planets.
 *
 * Uses `SEFLG_SPEED` so the result includes daily speed in longitude – this
 * is needed to determine retrograde status.
 *
 * If the Swiss Ephemeris data files are not found at runtime the library
 * transparently falls back to the Moshier analytical model.
 */
export function calculatePlanetaryPositions(
  julianDay: number,
): PlanetaryPosition[] {
  ensureInitialized();

  const flags = sweph.SEFLG_SPEED;
  const positions: PlanetaryPosition[] = [];

  for (const planet of PLANETS) {
    const planetId = PLANET_IDS[planet];
    const result = sweph.swe_calc_ut(julianDay, planetId, flags);

    // swe_calc_ut may return an error string as the `error` property.
    if ((result as any).error) {
      console.warn(
        `[ephemeris] Error calculating ${planet}: ${(result as any).error}. ` +
          'Attempting Moshier fallback.',
      );
      // Retry with Moshier flag (SEFLG_MOSEPH = 4)
      const fallback = sweph.swe_calc_ut(
        julianDay,
        planetId,
        flags | sweph.SEFLG_MOSEPH,
      );
      if ((fallback as any).error) {
        throw new Error(
          `Failed to calculate position for ${planet}: ${(fallback as any).error}`,
        );
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

/**
 * Calculate house cusps and chart angles for a given Julian Day and
 * geographic location.
 *
 * @param julianDay  Julian Day in Universal Time
 * @param latitude   Geographic latitude (north positive)
 * @param longitude  Geographic longitude (east positive)
 * @param houseSystem  One-character house system code (default Placidus "P")
 */
export function calculateHouseCusps(
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem = 'P',
): HouseCuspsResult {
  ensureInitialized();

  const result = sweph.swe_houses(
    julianDay,
    latitude,
    longitude,
    houseSystem,
  );

  const rawCusps: number[] = (result as any).cusps;
  const ascmc: number[] = (result as any).ascmc;

  // rawCusps is 1-indexed in most sweph bindings (index 0 is unused or equal
  // to cusp 1). We normalise to a clean 1-12 array.
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
