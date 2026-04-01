import { prisma } from '../lib/prisma';
import {
  NatalChart,
  PlanetaryPosition,
  HouseCusp,
  ChartAngles,
  HouseSystem,
} from '@star/shared';
import {
  calculatePlanetaryPositions,
  calculateHouseCusps,
} from './ephemeris.service';
import { geocodeLocation } from './geocoding.service';
import { convertToUTC } from '../utils/timezone';
import { calculateAspects } from './aspect.service';

// ---------------------------------------------------------------------------
// Swiss Ephemeris mutex
// ---------------------------------------------------------------------------
// The Swiss Ephemeris C library uses global mutable state (file handles, last-
// computed planet cache, etc.). Concurrent calls from different async contexts
// can corrupt that state and produce wrong results or segfaults.
//
// A full solution would run sweph in a dedicated worker thread (or use a
// BullMQ job queue). For now we use a lightweight promise-based mutex that
// serialises all sweph calls within the main thread. This is sufficient for
// moderate traffic; under high load the queue will grow linearly and a proper
// worker-pool / queue architecture should replace this.
// ---------------------------------------------------------------------------

let _lock: Promise<void> = Promise.resolve();

function withEphemerisMutex<T>(fn: () => T): Promise<T> {
  let release: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prev = _lock;
  _lock = next;
  return prev.then(() => {
    try {
      const result = fn();
      return result;
    } finally {
      release!();
    }
  });
}

// ---------------------------------------------------------------------------
// House placement helper
// ---------------------------------------------------------------------------

/**
 * Determine which house a planet occupies by comparing its ecliptic longitude
 * to the house cusp longitudes. A planet belongs to house N if its longitude
 * falls between cusp N and cusp N+1 (wrapping from house 12 back to house 1).
 */
function assignHouse(planetLongitude: number, cusps: HouseCusp[]): number {
  // cusps are sorted 1-12 by house number.
  for (let i = 0; i < 12; i++) {
    const cuspStart = cusps[i].longitude;
    const cuspEnd = cusps[(i + 1) % 12].longitude;

    if (cuspEnd > cuspStart) {
      // Normal case: cusp range does not cross 0 Aries
      if (planetLongitude >= cuspStart && planetLongitude < cuspEnd) {
        return cusps[i].house;
      }
    } else {
      // Cusp range wraps around 360/0
      if (planetLongitude >= cuspStart || planetLongitude < cuspEnd) {
        return cusps[i].house;
      }
    }
  }

  // Fallback (should not happen with valid cusps)
  return 1;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULT_HOUSE_SYSTEM: HouseSystem = 'P';

/**
 * Calculate a complete natal chart for the given birth profile.
 *
 * Steps:
 * 1. Load profile from DB.
 * 2. If geocoded data is missing, geocode & convert to UTC & update profile.
 * 3. Compute planetary positions and house cusps (serialised via mutex).
 * 4. Compute aspects.
 * 5. Determine house placement for each planet.
 * 6. Persist the chart to `natal_charts`.
 * 7. Return structured NatalChart.
 */
export async function calculateNatalChart(
  birthProfileId: string,
): Promise<NatalChart> {
  // 1. Load profile
  const profile = await prisma.birthProfile.findUnique({
    where: { id: birthProfileId },
  });

  if (!profile) {
    throw new Error(`Birth profile not found: ${birthProfileId}`);
  }

  // 2. Geocode if needed (latitude defaults to 0 when not yet set)
  let julianDay = profile.julianDay;
  let latitude = profile.birthLatitude;
  let longitude = profile.birthLongitude;

  if (!latitude && !longitude) {
    const geo = await geocodeLocation(profile.birthCity);
    latitude = geo.latitude;
    longitude = geo.longitude;

    const birthDate =
      profile.birthDate instanceof Date
        ? profile.birthDate.toISOString().slice(0, 10)
        : String(profile.birthDate).slice(0, 10);

    const { utcDate, julianDay: jd } = convertToUTC(
      birthDate,
      profile.birthTime,
      geo.timezoneId,
    );
    julianDay = jd;

    await prisma.birthProfile.update({
      where: { id: birthProfileId },
      data: {
        birthLatitude: latitude,
        birthLongitude: longitude,
        timezoneId: geo.timezoneId,
        utcDatetime: utcDate,
        julianDay,
      },
    });
  }

  // 3. Compute ephemeris data inside the mutex
  const { positions, cusps, angles } = await withEphemerisMutex(() => {
    const pos = calculatePlanetaryPositions(julianDay);
    const houseResult = calculateHouseCusps(
      julianDay,
      latitude,
      longitude,
      DEFAULT_HOUSE_SYSTEM,
    );
    return { positions: pos, cusps: houseResult.cusps, angles: houseResult.angles };
  });

  // 4. Calculate aspects
  const aspects = calculateAspects(positions);

  // 5. Annotate each planet with its house
  const positionsWithHouse: (PlanetaryPosition & { house: number })[] =
    positions.map((p) => ({
      ...p,
      house: assignHouse(p.longitude, cusps),
    }));

  // 6. Persist to DB
  const chartRecord = await prisma.natalChart.create({
    data: {
      birthProfileId,
      planetaryPositions: positionsWithHouse as any,
      houseCusps: { cusps, angles } as any,
      aspects: aspects as any,
      isPaid: false,
    },
  });

  // 7. Return structured result
  return {
    id: chartRecord.id,
    birthProfileId,
    planetaryPositions: positionsWithHouse,
    houseCusps: cusps,
    angles,
    aspects,
    houseSystem: DEFAULT_HOUSE_SYSTEM,
    calculatedAt: chartRecord.calculatedAt.toISOString(),
    isPaid: chartRecord.isPaid,
  };
}

/**
 * Retrieve a previously calculated natal chart by ID.
 */
export async function getChart(chartId: string): Promise<NatalChart | null> {
  const record = await prisma.natalChart.findUnique({
    where: { id: chartId },
  });

  if (!record) return null;

  const houseCuspsData = record.houseCusps as any;

  return {
    id: record.id,
    birthProfileId: record.birthProfileId,
    planetaryPositions: record.planetaryPositions as any,
    houseCusps: houseCuspsData.cusps ?? houseCuspsData,
    angles: houseCuspsData.angles ?? { ascendant: 0, mc: 0, armc: 0, vertex: 0 },
    aspects: record.aspects as any,
    houseSystem: DEFAULT_HOUSE_SYSTEM,
    calculatedAt: record.calculatedAt.toISOString(),
    isPaid: record.isPaid,
  };
}

/**
 * Retrieve the natal chart associated with a birth profile (if any).
 */
export async function getChartByBirthProfileId(
  birthProfileId: string,
): Promise<NatalChart | null> {
  const record = await prisma.natalChart.findFirst({
    where: { birthProfileId },
    orderBy: { calculatedAt: 'desc' },
  });

  if (!record) return null;

  const houseCuspsData = record.houseCusps as any;

  return {
    id: record.id,
    birthProfileId: record.birthProfileId,
    planetaryPositions: record.planetaryPositions as any,
    houseCusps: houseCuspsData.cusps ?? houseCuspsData,
    angles: houseCuspsData.angles ?? { ascendant: 0, mc: 0, armc: 0, vertex: 0 },
    aspects: record.aspects as any,
    houseSystem: DEFAULT_HOUSE_SYSTEM,
    calculatedAt: record.calculatedAt.toISOString(),
    isPaid: record.isPaid,
  };
}
