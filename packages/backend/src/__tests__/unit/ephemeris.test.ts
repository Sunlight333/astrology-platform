/**
 * Ephemeris Service - Unit Tests
 *
 * Validates planetary position calculations against known Swiss Ephemeris
 * reference data. The reference values come from Astro.com / Swiss Ephemeris
 * published tables.
 */
import {
  dateToJulianDay,
  calculatePlanetaryPositions,
} from '../../services/ephemeris.service';
import { ZODIAC_SIGNS, PLANETS, Planet } from '@star/shared';
import referenceCharts from '../../__fixtures__/reference-charts.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type for a single reference chart entry. */
interface ReferenceChart {
  label: string;
  date: string;
  julianDay: number;
  planets: Record<string, { longitude: number; sign: string; degree: number }>;
}

const charts = referenceCharts as ReferenceChart[];

/** Parse the ISO date string from a reference chart into a JS Date. */
function parseRefDate(isoDate: string): Date {
  return new Date(isoDate);
}

// ---------------------------------------------------------------------------
// Julian Day Calculation
// ---------------------------------------------------------------------------

describe('dateToJulianDay', () => {
  it('should return 2451545.0 for J2000.0 (Jan 1, 2000, 12:00 UTC)', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const jd = dateToJulianDay(date);
    expect(jd).toBeCloseTo(2451545.0, 4);
  });

  it('should match the reference Julian Day for each fixture chart', () => {
    for (const chart of charts) {
      const date = parseRefDate(chart.date);
      const jd = dateToJulianDay(date);
      expect(jd).toBeCloseTo(chart.julianDay, 1);
    }
  });

  it('should handle midnight (0:00 UTC) correctly', () => {
    // J2000.0 minus 12 hours = Jan 1 2000 00:00 UTC => JD 2451544.5
    const date = new Date('2000-01-01T00:00:00Z');
    const jd = dateToJulianDay(date);
    expect(jd).toBeCloseTo(2451544.5, 4);
  });

  it('should handle fractional hours (6:30 AM UTC)', () => {
    // Jan 1, 2000, 06:30 UTC => JD 2451544.5 + 6.5/24 = 2451544.77083...
    const date = new Date('2000-01-01T06:30:00.000Z');
    const jd = dateToJulianDay(date);
    expect(jd).toBeCloseTo(2451544.77083, 3);
  });
});

// ---------------------------------------------------------------------------
// Sign Derivation
// ---------------------------------------------------------------------------

describe('sign derivation from longitude', () => {
  const signCases: [number, string][] = [
    [0, 'Aries'],
    [15, 'Aries'],
    [29.99, 'Aries'],
    [30, 'Taurus'],
    [59.99, 'Taurus'],
    [60, 'Gemini'],
    [90, 'Cancer'],
    [120, 'Leo'],
    [150, 'Virgo'],
    [180, 'Libra'],
    [210, 'Scorpio'],
    [240, 'Sagittarius'],
    [270, 'Capricorn'],
    [300, 'Aquarius'],
    [330, 'Pisces'],
    [359.99, 'Pisces'],
  ];

  it.each(signCases)(
    'longitude %.2f should map to %s',
    (longitude, expectedSign) => {
      const signIndex = Math.floor(longitude / 30) % 12;
      expect(ZODIAC_SIGNS[signIndex]).toBe(expectedSign);
    },
  );

  it('should correctly derive sign for all J2000.0 reference planets', () => {
    const j2000 = charts.find((c) => c.label === 'J2000.0')!;
    const positions = calculatePlanetaryPositions(j2000.julianDay);

    for (const pos of positions) {
      const ref = j2000.planets[pos.planet];
      if (ref) {
        expect(pos.sign).toBe(ref.sign);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Planetary Positions - Accuracy
// ---------------------------------------------------------------------------

describe('calculatePlanetaryPositions', () => {
  const TOLERANCE = 0.05; // degrees

  describe.each(charts)('$label', (chart) => {
    let positions: ReturnType<typeof calculatePlanetaryPositions>;

    beforeAll(() => {
      positions = calculatePlanetaryPositions(chart.julianDay);
    });

    it('should return positions for all 10 standard planets', () => {
      expect(positions).toHaveLength(10);
      const names = positions.map((p) => p.planet);
      for (const planet of PLANETS) {
        expect(names).toContain(planet);
      }
    });

    // Generate a test for each planet listed in this chart fixture
    for (const [planetName, ref] of Object.entries(chart.planets)) {
      it(`${planetName}: longitude should be within ${TOLERANCE} deg of ${ref.longitude}`, () => {
        const pos = positions.find((p) => p.planet === planetName)!;
        expect(pos).toBeDefined();
        expect(pos.longitude).toBeCloseTo(ref.longitude, 1);
        const diff = Math.abs(pos.longitude - ref.longitude);
        expect(diff).toBeLessThan(TOLERANCE);
      });

      it(`${planetName}: sign should be ${ref.sign}`, () => {
        const pos = positions.find((p) => p.planet === planetName)!;
        expect(pos.sign).toBe(ref.sign);
      });

      it(`${planetName}: degree-within-sign should be ${ref.degree}`, () => {
        const pos = positions.find((p) => p.planet === planetName)!;
        expect(pos.degree).toBe(ref.degree);
      });
    }
  });

  it('should include valid latitude, distance, and speed values', () => {
    const jd = 2451545.0;
    const positions = calculatePlanetaryPositions(jd);

    for (const pos of positions) {
      expect(typeof pos.latitude).toBe('number');
      expect(typeof pos.distance).toBe('number');
      expect(typeof pos.speedInLongitude).toBe('number');
      expect(Number.isFinite(pos.latitude)).toBe(true);
      expect(Number.isFinite(pos.distance)).toBe(true);
      expect(Number.isFinite(pos.speedInLongitude)).toBe(true);
      expect(pos.distance).toBeGreaterThan(0);
    }
  });

  it('minute should be between 0 and 59 for all positions', () => {
    const jd = 2451545.0;
    const positions = calculatePlanetaryPositions(jd);

    for (const pos of positions) {
      expect(pos.minute).toBeGreaterThanOrEqual(0);
      expect(pos.minute).toBeLessThan(60);
    }
  });
});

// ---------------------------------------------------------------------------
// Retrograde Detection
// ---------------------------------------------------------------------------

describe('retrograde detection', () => {
  it('should flag retrograde planets with negative speed', () => {
    const jd = 2451545.0;
    const positions = calculatePlanetaryPositions(jd);

    for (const pos of positions) {
      if (pos.speedInLongitude < 0) {
        expect(pos.isRetrograde).toBe(true);
      } else {
        expect(pos.isRetrograde).toBe(false);
      }
    }
  });

  it('Sun should never be retrograde', () => {
    const julianDays = charts.map((c) => c.julianDay);
    for (const jd of julianDays) {
      const positions = calculatePlanetaryPositions(jd);
      const sun = positions.find((p) => p.planet === 'Sun')!;
      expect(sun.isRetrograde).toBe(false);
      expect(sun.speedInLongitude).toBeGreaterThan(0);
    }
  });

  it('Moon should never be retrograde', () => {
    const julianDays = charts.map((c) => c.julianDay);
    for (const jd of julianDays) {
      const positions = calculatePlanetaryPositions(jd);
      const moon = positions.find((p) => p.planet === 'Moon')!;
      expect(moon.isRetrograde).toBe(false);
      expect(moon.speedInLongitude).toBeGreaterThan(0);
    }
  });
});
