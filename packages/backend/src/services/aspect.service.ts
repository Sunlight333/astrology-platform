import {
  Aspect,
  AspectType,
  PlanetaryPosition,
  ASPECT_TYPES,
  ASPECT_ANGLES,
  NATAL_ASPECT_ORBS,
} from '@star/shared';

/**
 * Compute the shortest angular distance between two ecliptic longitudes,
 * accounting for the 360-degree wrap-around.
 *
 * Returns a value in the range [0, 180].
 */
function circularDistance(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Calculate all aspects between every unique pair of planetary positions.
 *
 * For each pair, the smallest orb match wins (i.e. if a pair could qualify as
 * both a conjunction and a semisextile, the aspect with the tighter orb is
 * chosen). In practice, overlapping ranges are rare for standard natal orbs.
 *
 * The `isApplying` flag is determined by comparing the signed speed difference
 * of the two planets with the direction the angular separation is changing.
 * An aspect is *applying* when the separation is decreasing toward the exact
 * aspect angle, and *separating* when it is moving away.
 */
export function calculateAspects(positions: PlanetaryPosition[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];

      const separation = circularDistance(a.longitude, b.longitude);

      let bestAspect: {
        type: AspectType;
        orb: number;
        exactAngle: number;
      } | null = null;

      for (const aspectType of ASPECT_TYPES) {
        const exactAngle = ASPECT_ANGLES[aspectType];
        const maxOrb = NATAL_ASPECT_ORBS[aspectType];
        const orb = Math.abs(separation - exactAngle);

        if (orb <= maxOrb) {
          if (!bestAspect || orb < bestAspect.orb) {
            bestAspect = { type: aspectType, orb, exactAngle };
          }
        }
      }

      if (bestAspect) {
        // Determine applying vs separating:
        // Compute the signed angular separation and how it changes over time.
        // We use the raw difference (not the absolute circular distance) so
        // we can see the direction of change.
        let rawDiff = (b.longitude - a.longitude) % 360;
        if (rawDiff < 0) rawDiff += 360;
        if (rawDiff > 180) rawDiff -= 360;

        // Rate of change of the raw difference
        const speedDiff = b.speedInLongitude - a.speedInLongitude;

        // The separation is the absolute value of rawDiff. Its rate of change
        // depends on whether rawDiff is positive or negative.
        const separationRate = rawDiff >= 0 ? speedDiff : -speedDiff;

        // If the current separation is greater than the exact angle, the
        // aspect is applying when the separation is decreasing (rate < 0).
        // If the current separation is less than the exact angle, the aspect
        // is applying when the separation is increasing (rate > 0) toward
        // the exact angle. For conjunctions (angle 0), we only care about
        // whether the gap is closing.
        const isApplying =
          separation > bestAspect.exactAngle
            ? separationRate < 0
            : separationRate > 0;

        aspects.push({
          planetA: a.planet,
          planetB: b.planet,
          aspectType: bestAspect.type,
          angle: Math.round(separation * 100) / 100,
          orb: Math.round(bestAspect.orb * 100) / 100,
          isApplying,
        });
      }
    }
  }

  return aspects;
}
