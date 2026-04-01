import { prisma } from '../lib/prisma';
import { NatalChart, PlanetaryPosition, HouseCusp, Aspect, Planet, PLANETS } from '@star/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterpretationEntry {
  title: string;
  body: string | null;
  comingSoon: boolean;
}

export interface PlanetInterpretation {
  planet: string;
  sign: string;
  house: number;
  signInterpretation: InterpretationEntry;
  houseInterpretation: InterpretationEntry;
}

export interface AspectInterpretation {
  planetA: string;
  planetB: string;
  aspectType: string;
  interpretation: InterpretationEntry;
}

export interface ChartInterpretation {
  summary: {
    sunSign: { sign: string; interpretation: InterpretationEntry };
    moonSign: { sign: string; interpretation: InterpretationEntry };
    ascendant: { sign: string; degree: number; interpretation: InterpretationEntry };
  };
  planets: PlanetInterpretation[];
  aspects: AspectInterpretation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMING_SOON: InterpretationEntry = {
  title: 'Interpretação em breve',
  body: null,
  comingSoon: true,
};

/**
 * Determine which house (1-12) a given ecliptic longitude falls in,
 * based on the house cusp longitudes.
 *
 * House N spans from cusp[N] to cusp[N+1] (wrapping around 360).
 */
function determineHouse(longitude: number, houseCusps: HouseCusp[]): number {
  // Sort cusps by house number to ensure correct ordering (1-12)
  const sorted = [...houseCusps].sort((a, b) => a.house - b.house);

  for (let i = 0; i < sorted.length; i++) {
    const currentCusp = sorted[i].longitude;
    const nextCusp = sorted[(i + 1) % sorted.length].longitude;

    if (nextCusp > currentCusp) {
      // Normal case: no wrap-around
      if (longitude >= currentCusp && longitude < nextCusp) {
        return sorted[i].house;
      }
    } else {
      // Wrap-around across 0 degrees
      if (longitude >= currentCusp || longitude < nextCusp) {
        return sorted[i].house;
      }
    }
  }

  // Fallback (should not happen with valid cusps)
  return 1;
}

/**
 * Find the ascendant sign from planetary positions or house cusps.
 * The ascendant is the sign on the 1st house cusp.
 */
function getAscendantInfo(houseCusps: HouseCusp[]): { sign: string; degree: number } {
  const firstHouse = houseCusps.find((c) => c.house === 1);
  if (firstHouse) {
    return { sign: firstHouse.sign, degree: firstHouse.degree };
  }
  return { sign: 'Aries', degree: 0 };
}

function findPlanet(positions: PlanetaryPosition[], planet: Planet): PlanetaryPosition | undefined {
  return positions.find((p) => p.planet === planet);
}

// ---------------------------------------------------------------------------
// Database lookups
// ---------------------------------------------------------------------------

async function lookupPlanetSign(planet: string, sign: string): Promise<InterpretationEntry> {
  const row = await prisma.interpretiveText.findFirst({
    where: { category: 'planet_sign', planet, sign },
  });
  if (!row) return COMING_SOON;
  return { title: row.title, body: row.body, comingSoon: false };
}

async function lookupPlanetHouse(planet: string, house: number): Promise<InterpretationEntry> {
  const row = await prisma.interpretiveText.findFirst({
    where: { category: 'planet_house', planet, house },
  });
  if (!row) return COMING_SOON;
  return { title: row.title, body: row.body, comingSoon: false };
}

async function lookupAspect(
  planetA: string,
  planetB: string,
  aspectType: string,
): Promise<InterpretationEntry> {
  // Aspects are bidirectional: check both orderings
  const row = await prisma.interpretiveText.findFirst({
    where: {
      category: 'aspect',
      aspectType,
      OR: [
        { planet: planetA, transitPlanet: planetB },
        { planet: planetB, transitPlanet: planetA },
      ],
    },
  });
  if (!row) return COMING_SOON;
  return { title: row.title, body: row.body, comingSoon: false };
}

// ---------------------------------------------------------------------------
// Main assembly function
// ---------------------------------------------------------------------------

/**
 * Assemble a complete interpretation for a natal chart by looking up
 * all relevant interpretive texts from the database.
 */
export async function assembleInterpretation(chart: NatalChart): Promise<ChartInterpretation> {
  const { planetaryPositions, houseCusps, aspects } = chart;

  // Build planet interpretations in parallel
  const planetPromises: Promise<PlanetInterpretation>[] = PLANETS.map(async (planetName) => {
    const position = findPlanet(planetaryPositions, planetName);

    if (!position) {
      return {
        planet: planetName,
        sign: 'Unknown',
        house: 0,
        signInterpretation: COMING_SOON,
        houseInterpretation: COMING_SOON,
      };
    }

    const house = determineHouse(position.longitude, houseCusps);
    const [signInterpretation, houseInterpretation] = await Promise.all([
      lookupPlanetSign(planetName, position.sign),
      lookupPlanetHouse(planetName, house),
    ]);

    return {
      planet: planetName,
      sign: position.sign,
      house,
      signInterpretation,
      houseInterpretation,
    };
  });

  // Build aspect interpretations in parallel
  const aspectPromises: Promise<AspectInterpretation>[] = aspects.map(
    async (aspect: Aspect) => {
      const interpretation = await lookupAspect(
        aspect.planetA,
        aspect.planetB,
        aspect.aspectType,
      );

      return {
        planetA: aspect.planetA,
        planetB: aspect.planetB,
        aspectType: aspect.aspectType,
        interpretation,
      };
    },
  );

  const [planets, aspectResults] = await Promise.all([
    Promise.all(planetPromises),
    Promise.all(aspectPromises),
  ]);

  // Extract summary data
  const sunData = planets.find((p) => p.planet === 'Sun');
  const moonData = planets.find((p) => p.planet === 'Moon');
  const ascendantInfo = getAscendantInfo(houseCusps);

  const ascendantInterpretation = await lookupPlanetSign('Ascendant', ascendantInfo.sign);

  return {
    summary: {
      sunSign: {
        sign: sunData?.sign ?? 'Unknown',
        interpretation: sunData?.signInterpretation ?? COMING_SOON,
      },
      moonSign: {
        sign: moonData?.sign ?? 'Unknown',
        interpretation: moonData?.signInterpretation ?? COMING_SOON,
      },
      ascendant: {
        sign: ascendantInfo.sign,
        degree: ascendantInfo.degree,
        interpretation: ascendantInterpretation,
      },
    },
    planets,
    aspects: aspectResults,
  };
}
