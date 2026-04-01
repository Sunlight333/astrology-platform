import {
  TransitPosition,
  TransitAspect,
  TransitEvent,
  Planet,
  AspectType,
  ASPECT_ANGLES,
} from '@star/shared';
import {
  calculatePlanetaryPositions,
  dateToJulianDay,
} from './ephemeris.service';
import { getChartByBirthProfileId } from './chart.service';

// ---------------------------------------------------------------------------
// Swiss Ephemeris mutex (shared with chart.service.ts)
// ---------------------------------------------------------------------------
// Re-implement the same mutex pattern here. The sweph C library uses global
// mutable state and must not be called concurrently. Both chart.service and
// transit.service serialise access through identical promise-chain mutexes.
// In a production system these would share a single mutex instance via a
// dedicated module; for now we keep them co-located with their consumers.
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
// Transit-specific orbs (tighter than natal)
// ---------------------------------------------------------------------------

interface TransitOrb {
  outer: number; // Jupiter through Pluto
  inner: number; // Sun through Mars
}

const TRANSIT_ORBS: Partial<Record<AspectType, TransitOrb>> = {
  conjunction: { outer: 3, inner: 2 },
  opposition: { outer: 3, inner: 2 },
  square: { outer: 3, inner: 2 },
  trine: { outer: 3, inner: 2 },
  sextile: { outer: 2, inner: 1 },
};

const TRANSIT_ASPECT_TYPES = Object.keys(TRANSIT_ORBS) as AspectType[];

const OUTER_PLANETS: Set<Planet> = new Set([
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]);

function getTransitOrb(aspectType: AspectType, transitPlanet: Planet): number {
  const orb = TRANSIT_ORBS[aspectType];
  if (!orb) return 0;
  return OUTER_PLANETS.has(transitPlanet) ? orb.outer : orb.inner;
}

// ---------------------------------------------------------------------------
// Angular distance helper
// ---------------------------------------------------------------------------

/**
 * Shortest angular distance between two ecliptic longitudes (0-180).
 */
function circularDistance(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// ---------------------------------------------------------------------------
// Date / Julian Day helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate planetary positions for a given date, returned as TransitPosition[].
 */
export async function calculateCurrentPositions(
  date: Date,
): Promise<TransitPosition[]> {
  const jd = dateToJulianDay(date);

  const positions = await withEphemerisMutex(() =>
    calculatePlanetaryPositions(jd),
  );

  return positions.map((p) => ({
    date: formatDate(date),
    planet: p.planet,
    longitude: p.longitude,
    latitude: p.latitude,
    speedInLongitude: p.speedInLongitude,
    sign: p.sign,
    degree: p.degree,
    isRetrograde: p.isRetrograde,
  }));
}

/**
 * Find the exact date when a transit aspect is exact by iterating in steps
 * and refining. Searches up to 60 days forward/backward from the reference date.
 *
 * Returns null if no exact date is found within the search window.
 */
async function findExactDate(
  transitPlanet: Planet,
  natalLongitude: number,
  aspectAngle: number,
  referenceDate: Date,
  isApplying: boolean,
): Promise<string | null> {
  // Search direction: forward if applying, backward if separating
  const direction = isApplying ? 1 : -1;
  const maxDays = 60;

  let bestDate: Date | null = null;
  let bestOrb = Infinity;

  // Coarse pass: 1-day steps
  for (let dayOffset = 0; dayOffset <= maxDays; dayOffset++) {
    const checkDate = addDays(referenceDate, dayOffset * direction);
    const jd = dateToJulianDay(checkDate);

    const positions = await withEphemerisMutex(() =>
      calculatePlanetaryPositions(jd),
    );
    const pos = positions.find((p) => p.planet === transitPlanet);
    if (!pos) continue;

    const separation = circularDistance(pos.longitude, natalLongitude);
    const orb = Math.abs(separation - aspectAngle);

    if (orb < bestOrb) {
      bestOrb = orb;
      bestDate = checkDate;
    }

    // If orb is growing and we already found a minimum, stop coarse search
    if (orb > bestOrb + 1 && bestOrb < 2) break;
  }

  if (!bestDate || bestOrb > 5) return null;

  // Fine pass: refine around bestDate with decreasing step sizes
  const steps = [0.5, 0.25, 0.1, 0.05, 0.01];

  for (const stepSize of steps) {
    let refinedBest = bestDate;
    let refinedBestOrb = bestOrb;

    for (let i = -5; i <= 5; i++) {
      const offsetMs = i * stepSize * 24 * 60 * 60 * 1000;
      const checkDate = new Date(bestDate.getTime() + offsetMs);
      const jd = dateToJulianDay(checkDate);

      const positions = await withEphemerisMutex(() =>
        calculatePlanetaryPositions(jd),
      );
      const pos = positions.find((p) => p.planet === transitPlanet);
      if (!pos) continue;

      const separation = circularDistance(pos.longitude, natalLongitude);
      const orb = Math.abs(separation - aspectAngle);

      if (orb < refinedBestOrb) {
        refinedBestOrb = orb;
        refinedBest = checkDate;
      }
    }

    bestDate = refinedBest;
    bestOrb = refinedBestOrb;

    // Good enough
    if (bestOrb < 0.01) break;
  }

  return bestDate.toISOString();
}

/**
 * Calculate all active transits for a birth profile on a given date.
 *
 * Loads the natal chart, computes current planetary positions, and compares
 * each transiting planet against each natal planet using transit-specific orbs.
 */
export async function calculateTransits(
  birthProfileId: string,
  date?: Date,
): Promise<TransitAspect[]> {
  const targetDate = date ?? new Date();

  // Load the natal chart
  const natalChart = await getChartByBirthProfileId(birthProfileId);
  if (!natalChart) {
    throw new Error(
      `No natal chart found for birth profile: ${birthProfileId}. ` +
        'Calculate a natal chart first.',
    );
  }

  // Calculate current planetary positions
  const jd = dateToJulianDay(targetDate);
  const transitPositions = await withEphemerisMutex(() =>
    calculatePlanetaryPositions(jd),
  );

  const aspects: TransitAspect[] = [];

  for (const transitPos of transitPositions) {
    for (const natalPos of natalChart.planetaryPositions) {
      const separation = circularDistance(
        transitPos.longitude,
        natalPos.longitude,
      );

      for (const aspectType of TRANSIT_ASPECT_TYPES) {
        const exactAngle = ASPECT_ANGLES[aspectType];
        const maxOrb = getTransitOrb(aspectType, transitPos.planet);
        const orb = Math.abs(separation - exactAngle);

        if (orb <= maxOrb) {
          // Determine applying vs separating
          // The transit planet is moving; the natal planet is fixed.
          // Compute the signed difference and see if the speed is closing the gap.
          let rawDiff =
            (transitPos.longitude - natalPos.longitude) % 360;
          if (rawDiff < 0) rawDiff += 360;
          if (rawDiff > 180) rawDiff -= 360;

          const absDiff = Math.abs(rawDiff);
          // Rate of change of the separation (natal speed is ~0 for transit purposes,
          // but we use the natal chart speed for inner planets like Moon)
          const separationRate =
            rawDiff >= 0
              ? transitPos.speedInLongitude
              : -transitPos.speedInLongitude;

          const isApplying =
            absDiff > exactAngle ? separationRate < 0 : separationRate > 0;

          aspects.push({
            transitPlanet: transitPos.planet,
            natalPlanet: natalPos.planet,
            aspectType,
            currentOrb: Math.round(orb * 100) / 100,
            isApplying,
            exactDate: null, // populated below
            transitLongitude: transitPos.longitude,
            natalLongitude: natalPos.longitude,
          });

          // Only take the tightest aspect for this pair
          break;
        }
      }
    }
  }

  // Sort by orb (tightest first) for downstream content gating
  aspects.sort((a, b) => a.currentOrb - b.currentOrb);

  // Find exact dates for the tightest transits (limit to avoid excessive computation)
  const MAX_EXACT_DATE_LOOKUPS = 20;
  const lookupPromises = aspects
    .slice(0, MAX_EXACT_DATE_LOOKUPS)
    .map(async (aspect) => {
      aspect.exactDate = await findExactDate(
        aspect.transitPlanet,
        aspect.natalLongitude,
        ASPECT_ANGLES[aspect.aspectType],
        targetDate,
        aspect.isApplying,
      );
    });

  await Promise.all(lookupPromises);

  return aspects;
}

/**
 * Calculate transit events over a date range (max 90 days).
 *
 * Steps through each day and computes active transits. Retrograde planets
 * that pass over the same natal point multiple times produce separate events
 * for each pass.
 */
export async function calculateTransitRange(
  birthProfileId: string,
  startDate: string,
  endDate: string,
): Promise<TransitEvent[]> {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  // Validate range
  const diffDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) {
    throw new Error('End date must be after start date');
  }
  if (diffDays > 90) {
    throw new Error('Date range cannot exceed 90 days');
  }

  // Load the natal chart once
  const natalChart = await getChartByBirthProfileId(birthProfileId);
  if (!natalChart) {
    throw new Error(
      `No natal chart found for birth profile: ${birthProfileId}. ` +
        'Calculate a natal chart first.',
    );
  }

  // Track previous-day transit states for retrograde pass detection.
  // Key: "transitPlanet-natalPlanet-aspectType"
  // Value: { wasActive, transitLongitude, isRetrograde }
  const previousState = new Map<
    string,
    { wasActive: boolean; longitude: number; isRetrograde: boolean; passCount: number }
  >();

  const events: TransitEvent[] = [];

  for (let dayOffset = 0; dayOffset <= diffDays; dayOffset++) {
    const currentDate = addDays(start, dayOffset);
    const jd = dateToJulianDay(currentDate);
    const dateStr = formatDate(currentDate);

    const transitPositions = await withEphemerisMutex(() =>
      calculatePlanetaryPositions(jd),
    );

    const dayTransits: TransitAspect[] = [];

    for (const transitPos of transitPositions) {
      for (const natalPos of natalChart.planetaryPositions) {
        const separation = circularDistance(
          transitPos.longitude,
          natalPos.longitude,
        );

        for (const aspectType of TRANSIT_ASPECT_TYPES) {
          const exactAngle = ASPECT_ANGLES[aspectType];
          const maxOrb = getTransitOrb(aspectType, transitPos.planet);
          const orb = Math.abs(separation - exactAngle);

          if (orb <= maxOrb) {
            const key = `${transitPos.planet}-${natalPos.planet}-${aspectType}`;
            const prev = previousState.get(key);

            // Detect retrograde pass: if the transit was previously inactive
            // and is now active again, or if retrograde status changed while
            // the transit remained active, count it as a new pass.
            let passCount = prev?.passCount ?? 1;
            if (prev) {
              const retrogradeChanged =
                prev.isRetrograde !== transitPos.isRetrograde;
              const wasInactive = !prev.wasActive;

              if (wasInactive || retrogradeChanged) {
                passCount = (prev.passCount ?? 0) + 1;
              }
            }

            previousState.set(key, {
              wasActive: true,
              longitude: transitPos.longitude,
              isRetrograde: transitPos.isRetrograde,
              passCount,
            });

            // Compute applying/separating
            let rawDiff =
              (transitPos.longitude - natalPos.longitude) % 360;
            if (rawDiff < 0) rawDiff += 360;
            if (rawDiff > 180) rawDiff -= 360;

            const absDiff = Math.abs(rawDiff);
            const separationRate =
              rawDiff >= 0
                ? transitPos.speedInLongitude
                : -transitPos.speedInLongitude;

            const isApplying =
              absDiff > exactAngle
                ? separationRate < 0
                : separationRate > 0;

            dayTransits.push({
              transitPlanet: transitPos.planet,
              natalPlanet: natalPos.planet,
              aspectType,
              currentOrb: Math.round(orb * 100) / 100,
              isApplying,
              exactDate: null,
              transitLongitude: transitPos.longitude,
              natalLongitude: natalPos.longitude,
            });

            // Only tightest aspect per pair
            break;
          }

          // If we checked all aspect types and none matched, mark inactive
          if (aspectType === TRANSIT_ASPECT_TYPES[TRANSIT_ASPECT_TYPES.length - 1]) {
            const key = `${transitPos.planet}-${natalPos.planet}-${aspectType}`;
            const prev = previousState.get(key);
            if (prev) {
              previousState.set(key, { ...prev, wasActive: false });
            }
          }
        }
      }
    }

    // Mark aspects that were active yesterday but not today as inactive
    for (const [key, state] of previousState.entries()) {
      const isStillActive = dayTransits.some((t) => {
        const k = `${t.transitPlanet}-${t.natalPlanet}-${t.aspectType}`;
        return k === key;
      });
      if (!isStillActive && state.wasActive) {
        previousState.set(key, { ...state, wasActive: false });
      }
    }

    if (dayTransits.length > 0) {
      // Sort by orb (tightest first)
      dayTransits.sort((a, b) => a.currentOrb - b.currentOrb);

      events.push({
        date: dateStr,
        transits: dayTransits,
      });
    }
  }

  return events;
}
