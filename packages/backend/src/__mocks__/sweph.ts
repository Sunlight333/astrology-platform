/**
 * Mock Swiss Ephemeris module for testing.
 *
 * Implements the subset of the sweph API used by ephemeris.service.ts:
 * - swe_set_ephe_path
 * - swe_julday
 * - swe_calc_ut (planetary positions)
 * - swe_houses (house cusps)
 * - Constants: SE_SUN..SE_PLUTO, SEFLG_SPEED, SEFLG_MOSEPH, SE_GREG_CAL
 *
 * The Julian Day calculation uses the standard astronomical formula and is
 * accurate. Planetary positions are interpolated from reference data for
 * known dates, providing realistic but approximate values for testing.
 */

// ---------------------------------------------------------------------------
// Constants (matching sweph/constants.js)
// ---------------------------------------------------------------------------

export const SE_SUN = 0;
export const SE_MOON = 1;
export const SE_MERCURY = 2;
export const SE_VENUS = 3;
export const SE_MARS = 4;
export const SE_JUPITER = 5;
export const SE_SATURN = 6;
export const SE_URANUS = 7;
export const SE_NEPTUNE = 8;
export const SE_PLUTO = 9;

export const SEFLG_SPEED = 256;
export const SEFLG_MOSEPH = 4;

// ---------------------------------------------------------------------------
// Reference planetary data keyed by Julian Day
// ---------------------------------------------------------------------------

interface PlanetData {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
}

// Mean daily motions (approximate, degrees/day) for interpolation
const MEAN_DAILY_MOTION: Record<number, number> = {
  [SE_SUN]: 0.9856,
  [SE_MOON]: 13.176,
  [SE_MERCURY]: 1.383,
  [SE_VENUS]: 1.200,
  [SE_MARS]: 0.524,
  [SE_JUPITER]: 0.0831,
  [SE_SATURN]: 0.0335,
  [SE_URANUS]: 0.01176,
  [SE_NEPTUNE]: 0.006,
  [SE_PLUTO]: 0.004,
};

// Reference data at known Julian Days (from Swiss Ephemeris)
// Key: Julian Day, Value: map of planet ID to PlanetData
const REFERENCE_DATA: Record<number, Record<number, PlanetData>> = {
  // J2000.0 - Jan 1 2000 12:00 UTC
  2451545.0: {
    [SE_SUN]:     { longitude: 280.37,  latitude: 0.0001, distance: 0.9833, longitudeSpeed: 1.0195 },
    [SE_MOON]:    { longitude: 218.47,  latitude: -4.85,  distance: 0.0025, longitudeSpeed: 13.54 },
    [SE_MERCURY]: { longitude: 271.19,  latitude: -1.57,  distance: 1.4115, longitudeSpeed: 1.27 },
    [SE_VENUS]:   { longitude: 241.31,  latitude: 1.37,   distance: 1.5464, longitudeSpeed: 1.24 },
    [SE_MARS]:    { longitude: 327.04,  latitude: 1.05,   distance: 1.8505, longitudeSpeed: 0.56 },
    [SE_JUPITER]: { longitude: 25.25,   latitude: -0.68,  distance: 4.3797, longitudeSpeed: 0.13 },
    [SE_SATURN]:  { longitude: 40.09,   latitude: -0.93,  distance: 8.6570, longitudeSpeed: 0.07 },
    [SE_URANUS]:  { longitude: 314.75,  latitude: -0.49,  distance: 20.097, longitudeSpeed: 0.02 },
    [SE_NEPTUNE]: { longitude: 303.19,  latitude: 0.54,   distance: 31.007, longitudeSpeed: 0.01 },
    [SE_PLUTO]:   { longitude: 251.34,  latitude: 12.74,  distance: 30.782, longitudeSpeed: 0.01 },
  },

  // Apr 15 1975 12:00 UTC
  2442520.0: {
    [SE_SUN]:     { longitude: 25.30,   latitude: 0.0001, distance: 1.005,  longitudeSpeed: 0.9682 },
    [SE_MOON]:    { longitude: 264.90,  latitude: -3.20,  distance: 0.0024, longitudeSpeed: 12.80 },
    [SE_MERCURY]: { longitude: 5.39,    latitude: 2.30,   distance: 0.7200, longitudeSpeed: 1.85 },
    [SE_VENUS]:   { longitude: 22.36,   latitude: -0.60,  distance: 1.5000, longitudeSpeed: 1.19 },
    [SE_MARS]:    { longitude: 336.95,  latitude: -0.60,  distance: 2.1000, longitudeSpeed: 0.47 },
    [SE_JUPITER]: { longitude: 15.57,   latitude: -0.36,  distance: 5.5000, longitudeSpeed: -0.05 },
    [SE_SATURN]:  { longitude: 100.96,  latitude: 1.17,   distance: 9.3000, longitudeSpeed: 0.06 },
    [SE_URANUS]:  { longitude: 210.47,  latitude: -0.11,  distance: 18.700, longitudeSpeed: -0.02 },
    [SE_NEPTUNE]: { longitude: 251.08,  latitude: 1.30,   distance: 30.900, longitudeSpeed: -0.01 },
    [SE_PLUTO]:   { longitude: 187.38,  latitude: 16.63,  distance: 31.500, longitudeSpeed: 0.02 },
  },

  // Jul 4 1990 12:00 UTC
  2448077.0: {
    [SE_SUN]:     { longitude: 102.41,  latitude: 0.0001, distance: 1.0167, longitudeSpeed: 0.9530 },
    [SE_MOON]:    { longitude: 290.89,  latitude: 2.40,   distance: 0.0027, longitudeSpeed: 14.15 },
    [SE_MERCURY]: { longitude: 84.19,   latitude: -1.96,  distance: 0.5100, longitudeSpeed: 2.10 },
    [SE_VENUS]:   { longitude: 117.08,  latitude: -0.38,  distance: 0.4800, longitudeSpeed: 1.16 },
    [SE_MARS]:    { longitude: 30.19,   latitude: 0.85,   distance: 2.4000, longitudeSpeed: 0.38 },
    [SE_JUPITER]: { longitude: 103.83,  latitude: -0.80,  distance: 6.2000, longitudeSpeed: -0.10 },
    [SE_SATURN]:  { longitude: 290.90,  latitude: -0.53,  distance: 9.9000, longitudeSpeed: -0.04 },
    [SE_URANUS]:  { longitude: 278.13,  latitude: -0.26,  distance: 19.500, longitudeSpeed: -0.01 },
    [SE_NEPTUNE]: { longitude: 283.56,  latitude: 0.83,   distance: 30.400, longitudeSpeed: -0.004 },
    [SE_PLUTO]:   { longitude: 224.80,  latitude: 15.50,  distance: 29.800, longitudeSpeed: 0.02 },
  },

  // Mar 20 2024 12:00 UTC
  2460389.0: {
    [SE_SUN]:     { longitude: 0.11,    latitude: 0.0001, distance: 0.9959, longitudeSpeed: 0.9917 },
    [SE_MOON]:    { longitude: 194.80,  latitude: 1.98,   distance: 0.0026, longitudeSpeed: 12.01 },
    [SE_MERCURY]: { longitude: 347.70,  latitude: -1.06,  distance: 1.2700, longitudeSpeed: 0.68 },
    [SE_VENUS]:   { longitude: 340.60,  latitude: 0.89,   distance: 1.4500, longitudeSpeed: 1.22 },
    [SE_MARS]:    { longitude: 319.82,  latitude: -1.44,  distance: 1.7500, longitudeSpeed: 0.72 },
    [SE_JUPITER]: { longitude: 16.50,   latitude: -0.75,  distance: 5.2000, longitudeSpeed: 0.20 },
    [SE_SATURN]:  { longitude: 342.38,  latitude: -1.39,  distance: 11.000, longitudeSpeed: 0.06 },
    [SE_URANUS]:  { longitude: 50.30,   latitude: -0.33,  distance: 20.700, longitudeSpeed: 0.02 },
    [SE_NEPTUNE]: { longitude: 357.40,  latitude: -1.22,  distance: 30.400, longitudeSpeed: 0.01 },
    [SE_PLUTO]:   { longitude: 301.44,  latitude: -22.51, distance: 34.900, longitudeSpeed: 0.01 },
  },

  // Dec 21 1950 12:00 UTC
  2433620.0: {
    [SE_SUN]:     { longitude: 269.10,  latitude: 0.0001, distance: 0.9837, longitudeSpeed: 1.0192 },
    [SE_MOON]:    { longitude: 107.72,  latitude: -4.10,  distance: 0.0025, longitudeSpeed: 13.21 },
    [SE_MERCURY]: { longitude: 257.05,  latitude: -0.76,  distance: 0.9100, longitudeSpeed: 1.44 },
    [SE_VENUS]:   { longitude: 289.72,  latitude: 0.24,   distance: 1.6400, longitudeSpeed: 1.25 },
    [SE_MARS]:    { longitude: 330.66,  latitude: -0.12,  distance: 1.4000, longitudeSpeed: 0.76 },
    [SE_JUPITER]: { longitude: 332.40,  latitude: -0.95,  distance: 4.8000, longitudeSpeed: 0.18 },
    [SE_SATURN]:  { longitude: 177.80,  latitude: 2.30,   distance: 9.1000, longitudeSpeed: -0.06 },
    [SE_URANUS]:  { longitude: 103.20,  latitude: 0.35,   distance: 18.600, longitudeSpeed: 0.04 },
    [SE_NEPTUNE]: { longitude: 198.44,  latitude: 1.15,   distance: 29.800, longitudeSpeed: -0.01 },
    [SE_PLUTO]:   { longitude: 140.30,  latitude: 13.90,  distance: 31.000, longitudeSpeed: 0.02 },
  },
};

// ---------------------------------------------------------------------------
// Julian Day calculation (standard astronomical algorithm)
// ---------------------------------------------------------------------------

export function swe_julday(
  year: number,
  month: number,
  day: number,
  hour: number,
  gregflag: number,
): number {
  // Meeus algorithm for Gregorian calendar Julian Day
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = gregflag === 1 ? 2 - A + Math.floor(A / 4) : 0;
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    hour / 24 +
    B -
    1524.5
  );
}

// ---------------------------------------------------------------------------
// Planetary position calculation
// ---------------------------------------------------------------------------

function findNearestReference(jd: number): { refJd: number; data: Record<number, PlanetData> } | null {
  const refJds = Object.keys(REFERENCE_DATA).map(Number);
  if (refJds.length === 0) return null;

  let nearest = refJds[0];
  let minDist = Math.abs(jd - nearest);

  for (const rjd of refJds) {
    const dist = Math.abs(jd - rjd);
    if (dist < minDist) {
      minDist = dist;
      nearest = rjd;
    }
  }

  return { refJd: nearest, data: REFERENCE_DATA[nearest] };
}

export function swe_calc_ut(
  julianDay: number,
  planetId: number,
  _flags: number,
): {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
} {
  const ref = findNearestReference(julianDay);
  if (!ref || !ref.data[planetId]) {
    // Fallback: return a simple estimate
    return {
      longitude: 0,
      latitude: 0,
      distance: 1,
      longitudeSpeed: MEAN_DAILY_MOTION[planetId] ?? 1,
      latitudeSpeed: 0,
      distanceSpeed: 0,
    };
  }

  const planetData = ref.data[planetId];
  const dayOffset = julianDay - ref.refJd;

  // Interpolate longitude using stored speed
  let lng = planetData.longitude + planetData.longitudeSpeed * dayOffset;
  // Normalize to 0-360
  lng = ((lng % 360) + 360) % 360;

  return {
    longitude: lng,
    latitude: planetData.latitude,
    distance: planetData.distance,
    longitudeSpeed: planetData.longitudeSpeed,
    latitudeSpeed: 0,
    distanceSpeed: 0,
  };
}

// ---------------------------------------------------------------------------
// House cusp calculation (simplified Placidus approximation)
// ---------------------------------------------------------------------------

// Reference house data for known locations/times
interface HouseRef {
  cusps: number[];   // 13 elements, index 0 unused, 1-12 are house cusps
  ascmc: number[];   // [ASC, MC, ARMC, Vertex, ...]
}

const HOUSE_REFERENCES: Record<string, HouseRef> = {
  // Sao Paulo, J2000.0
  '2451545.0_-23.55_-46.63_P': {
    cusps: [0, 234.73, 256.97, 283.87, 314.13, 344.66, 13.44,
               54.73, 76.97, 103.87, 134.13, 164.66, 193.44],
    ascmc: [234.73, 134.13, 134.13, 40.0, 0, 0, 0, 0, 0],
  },
  // London, Jul 4 1990
  '2448077.0_51.5_-0.12_P': {
    cusps: [0, 201.86, 224.45, 253.71, 286.52, 317.22, 343.26,
               21.86, 44.45, 73.71, 106.52, 137.22, 163.26],
    ascmc: [201.86, 106.52, 106.52, 315.0, 0, 0, 0, 0, 0],
  },
  // Reykjavik, J2000.0
  '2451545.0_64.13_-21.9_P': {
    cusps: [0, 33.50, 78.00, 111.00, 131.00, 152.00, 178.00,
               213.50, 258.00, 291.00, 311.00, 332.00, 358.00],
    ascmc: [33.50, 131.00, 131.00, 225.0, 0, 0, 0, 0, 0],
  },
};

function makeHouseKey(jd: number, lat: number, lng: number, sys: string): string {
  return `${jd}_${lat}_${lng}_${sys}`;
}

/**
 * Compute approximate Placidus houses. Uses stored reference data for known
 * inputs, or falls back to a simple equal-house approximation.
 */
export function swe_houses(
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: string,
): { cusps: number[]; ascmc: number[] } {
  const key = makeHouseKey(julianDay, latitude, longitude, houseSystem);

  if (HOUSE_REFERENCES[key]) {
    return HOUSE_REFERENCES[key];
  }

  // Try with rounded values
  const roundedKey = makeHouseKey(
    Math.round(julianDay * 10) / 10,
    Math.round(latitude * 100) / 100,
    Math.round(longitude * 100) / 100,
    houseSystem,
  );
  if (HOUSE_REFERENCES[roundedKey]) {
    return HOUSE_REFERENCES[roundedKey];
  }

  // Fallback: compute approximate equal houses based on local sidereal time
  // LST = GMST + longitude / 15 (in hours)
  // GMST at J2000 = 18.697374558 + 24.06570982441908 * D (D in Julian centuries)
  const D = julianDay - 2451545.0;
  const T = D / 36525;
  let gmst = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;
  const lst = ((gmst + longitude) % 360 + 360) % 360;

  // Approximate MC = LST, ASC = LST + 90 adjusted for latitude
  const mc = lst;
  // Simplified ASC calculation
  const obliquity = 23.4393; // approximate
  const radLat = latitude * Math.PI / 180;
  const radObl = obliquity * Math.PI / 180;
  const radLst = lst * Math.PI / 180;

  let asc = Math.atan2(
    -Math.cos(radLst),
    Math.sin(radLst) * Math.cos(radObl) + Math.tan(radLat) * Math.sin(radObl),
  );
  asc = asc * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;

  // Generate equal-spaced cusps from ASC
  const cusps = [0]; // index 0 unused
  for (let i = 0; i < 12; i++) {
    cusps.push(((asc + i * 30) % 360 + 360) % 360);
  }

  return {
    cusps,
    ascmc: [asc, mc, mc, asc + 180, 0, 0, 0, 0, 0],
  };
}

// ---------------------------------------------------------------------------
// No-op stubs
// ---------------------------------------------------------------------------

export function swe_set_ephe_path(_path: string): void {
  // No-op in mock
}
