/**
 * Full Pipeline Accuracy Test
 *
 * Integration test that exercises the complete chart calculation pipeline:
 * timezone conversion -> Julian Day -> ephemeris -> house cusps -> aspects.
 *
 * Mocks only the database (Prisma) and geocoding. Uses real Swiss Ephemeris
 * calculations to verify end-to-end accuracy.
 */
import {
  dateToJulianDay,
  calculatePlanetaryPositions,
  calculateHouseCusps,
} from '../../services/ephemeris.service';
import { calculateAspects } from '../../services/aspect.service';
import { convertToUTC } from '../../utils/timezone';
import { PlanetaryPosition, HouseCusp, PLANETS } from '@star/shared';
import referenceCharts from '../../__fixtures__/reference-charts.json';

// ---------------------------------------------------------------------------
// Helper: Simulate the chart service pipeline without DB/geocoding
// ---------------------------------------------------------------------------

interface PipelineInput {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  timezone: string;   // IANA timezone ID
  latitude: number;
  longitude: number;
}

interface PipelineResult {
  julianDay: number;
  positions: PlanetaryPosition[];
  cusps: HouseCusp[];
  angles: { ascendant: number; mc: number; armc: number; vertex: number };
  aspects: ReturnType<typeof calculateAspects>;
}

function runPipeline(input: PipelineInput): PipelineResult {
  // Step 1: Convert local time to UTC and Julian Day
  const { julianDay } = convertToUTC(input.date, input.time, input.timezone);

  // Step 2: Calculate planetary positions
  const positions = calculatePlanetaryPositions(julianDay);

  // Step 3: Calculate house cusps
  const { cusps, angles } = calculateHouseCusps(
    julianDay,
    input.latitude,
    input.longitude,
    'P',
  );

  // Step 4: Calculate aspects
  const aspects = calculateAspects(positions);

  return { julianDay, positions, cusps, angles, aspects };
}

// ---------------------------------------------------------------------------
// Test: Full pipeline for a known birth profile
// ---------------------------------------------------------------------------

describe('full pipeline accuracy', () => {
  describe('Sao Paulo birth chart - Jan 1 2000, 09:00 local time', () => {
    let result: PipelineResult;

    beforeAll(() => {
      result = runPipeline({
        date: '2000-01-01',
        time: '09:00',
        timezone: 'America/Sao_Paulo',
        latitude: -23.55,
        longitude: -46.63,
      });
    });

    it('should correctly convert Sao Paulo DST time to UTC', () => {
      // Jan 2000 Sao Paulo was on DST (UTC-2), so local 09:00 => UTC 11:00
      // JD for Jan 1, 2000 12:00 UTC = 2451545.0
      // UTC 11:00 = 2451545.0 - 1/24 = ~2451544.958
      expect(result.julianDay).toBeCloseTo(2451544.9583, 2);
    });

    it('should return 10 planetary positions', () => {
      expect(result.positions).toHaveLength(10);
      for (const planet of PLANETS) {
        expect(result.positions.find((p) => p.planet === planet)).toBeDefined();
      }
    });

    it('Sun should be in Capricorn (around 280 degrees)', () => {
      const sun = result.positions.find((p) => p.planet === 'Sun')!;
      expect(sun.sign).toBe('Capricorn');
      // At UTC 11:00, Sun should be very close to its J2000 noon position
      expect(sun.longitude).toBeCloseTo(280.37, 0);
    });

    it('should return 12 house cusps', () => {
      expect(result.cusps).toHaveLength(12);
    });

    it('Ascendant and MC should be valid', () => {
      expect(result.angles.ascendant).toBeGreaterThanOrEqual(0);
      expect(result.angles.ascendant).toBeLessThan(360);
      expect(result.angles.mc).toBeGreaterThanOrEqual(0);
      expect(result.angles.mc).toBeLessThan(360);
    });

    it('should produce at least some aspects', () => {
      expect(result.aspects.length).toBeGreaterThan(0);
    });

    it('every aspect should have valid structure', () => {
      for (const aspect of result.aspects) {
        expect(PLANETS).toContain(aspect.planetA);
        expect(PLANETS).toContain(aspect.planetB);
        expect(aspect.orb).toBeGreaterThanOrEqual(0);
        expect(typeof aspect.isApplying).toBe('boolean');
        expect(aspect.angle).toBeGreaterThanOrEqual(0);
        expect(aspect.angle).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('London birth chart - Jul 4 1990, 14:00 local (BST)', () => {
    let result: PipelineResult;

    beforeAll(() => {
      result = runPipeline({
        date: '1990-07-04',
        time: '14:00',
        timezone: 'Europe/London',
        latitude: 51.50,
        longitude: -0.12,
      });
    });

    it('should correctly convert BST to UTC (UTC+1 in summer)', () => {
      // Jul 4 1990: London is on BST (UTC+1), local 14:00 => UTC 13:00
      // JD for Jul 4 1990 12:00 UTC = 2448077.0
      // UTC 13:00 = 2448077.0 + 1/24 = ~2448077.0417
      expect(result.julianDay).toBeCloseTo(2448077.0417, 2);
    });

    it('Sun should be in Cancer', () => {
      const sun = result.positions.find((p) => p.planet === 'Sun')!;
      expect(sun.sign).toBe('Cancer');
      expect(sun.longitude).toBeCloseTo(102.45, 0);
    });

    it('all positions should have consistent sign/degree/longitude', () => {
      for (const pos of result.positions) {
        const expectedSignIndex = Math.floor(pos.longitude / 30) % 12;
        const signs = [
          'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
          'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
        ];
        expect(pos.sign).toBe(signs[expectedSignIndex]);
        expect(pos.degree).toBe(Math.floor(pos.longitude % 30));
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-validation: direct ephemeris vs pipeline
// ---------------------------------------------------------------------------

describe('cross-validation: direct ephemeris matches pipeline', () => {
  it('direct JD calculation should match timezone-converted JD for UTC input', () => {
    const directJd = dateToJulianDay(new Date('2000-01-01T12:00:00.000Z'));
    const { julianDay: pipelineJd } = convertToUTC('2000-01-01', '12:00', 'UTC');

    expect(directJd).toBeCloseTo(pipelineJd, 6);
  });

  it('planetary positions should be identical for same Julian Day', () => {
    const jd = 2451545.0;
    const pos1 = calculatePlanetaryPositions(jd);
    const pos2 = calculatePlanetaryPositions(jd);

    for (let i = 0; i < pos1.length; i++) {
      expect(pos1[i].longitude).toBe(pos2[i].longitude);
      expect(pos1[i].latitude).toBe(pos2[i].latitude);
      expect(pos1[i].speedInLongitude).toBe(pos2[i].speedInLongitude);
    }
  });

  it('aspects should be deterministic for same positions', () => {
    const jd = 2451545.0;
    const positions = calculatePlanetaryPositions(jd);
    const aspects1 = calculateAspects(positions);
    const aspects2 = calculateAspects(positions);

    expect(aspects1).toEqual(aspects2);
  });
});

// ---------------------------------------------------------------------------
// Reference chart validation across all fixture dates
// ---------------------------------------------------------------------------

describe('reference chart validation across all fixture dates', () => {
  const TOLERANCE = 0.05;

  interface RefChart {
    label: string;
    date: string;
    julianDay: number;
    planets: Record<string, { longitude: number; sign: string; degree: number }>;
  }

  const charts = referenceCharts as RefChart[];

  for (const chart of charts) {
    describe(chart.label, () => {
      it('all listed planets should match reference longitudes within tolerance', () => {
        const positions = calculatePlanetaryPositions(chart.julianDay);

        for (const [planetName, ref] of Object.entries(chart.planets)) {
          const pos = positions.find((p) => p.planet === planetName)!;
          expect(pos).toBeDefined();
          const diff = Math.abs(pos.longitude - ref.longitude);
          expect(diff).toBeLessThan(TOLERANCE);
        }
      });
    });
  }
});
