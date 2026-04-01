/**
 * House Cusp Calculation - Unit Tests
 *
 * Validates Placidus house cusp calculations against reference data.
 * Uses approximate reference values with a 1.0 degree tolerance to account
 * for differences between ephemeris implementations.
 */
import {
  dateToJulianDay,
  calculateHouseCusps,
} from '../../services/ephemeris.service';
import referenceHouses from '../../__fixtures__/reference-houses.json';

// ---------------------------------------------------------------------------
// Types & Setup
// ---------------------------------------------------------------------------

interface ReferenceHouseChart {
  label: string;
  julianDay: number;
  latitude: number;
  longitude: number;
  houseSystem: string;
  ascendant: number;
  mc: number;
}

const charts = referenceHouses as ReferenceHouseChart[];
const TOLERANCE = 1.0; // degrees - approximate reference data

// ---------------------------------------------------------------------------
// Placidus House Cusps - Sao Paulo
// ---------------------------------------------------------------------------

describe('house cusps - Sao Paulo (Placidus)', () => {
  const ref = charts.find((c) => c.label === 'Sao Paulo J2000')!;
  let result: ReturnType<typeof calculateHouseCusps>;

  beforeAll(() => {
    result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');
  });

  it('should return exactly 12 house cusps', () => {
    expect(result.cusps).toHaveLength(12);
  });

  it('should number houses 1 through 12', () => {
    const houses = result.cusps.map((c) => c.house);
    expect(houses).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it(`Ascendant should be within ${TOLERANCE} deg of reference (${ref.ascendant})`, () => {
    const diff = Math.abs(result.angles.ascendant - ref.ascendant);
    const wrappedDiff = diff > 180 ? 360 - diff : diff;
    expect(wrappedDiff).toBeLessThan(TOLERANCE);
  });

  it(`MC should be within ${TOLERANCE} deg of reference (${ref.mc})`, () => {
    const diff = Math.abs(result.angles.mc - ref.mc);
    const wrappedDiff = diff > 180 ? 360 - diff : diff;
    expect(wrappedDiff).toBeLessThan(TOLERANCE);
  });

  it('Ascendant should equal cusp 1 longitude', () => {
    expect(result.angles.ascendant).toBeCloseTo(result.cusps[0].longitude, 4);
  });

  it('MC should equal cusp 10 longitude', () => {
    expect(result.angles.mc).toBeCloseTo(result.cusps[9].longitude, 4);
  });
});

// ---------------------------------------------------------------------------
// Placidus House Cusps - London
// ---------------------------------------------------------------------------

describe('house cusps - London (Placidus)', () => {
  const ref = charts.find((c) => c.label === 'London 1990')!;
  let result: ReturnType<typeof calculateHouseCusps>;

  beforeAll(() => {
    result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');
  });

  it('should return exactly 12 house cusps', () => {
    expect(result.cusps).toHaveLength(12);
  });

  it(`Ascendant should be within ${TOLERANCE} deg of reference (${ref.ascendant})`, () => {
    const diff = Math.abs(result.angles.ascendant - ref.ascendant);
    const wrappedDiff = diff > 180 ? 360 - diff : diff;
    expect(wrappedDiff).toBeLessThan(TOLERANCE);
  });

  it(`MC should be within ${TOLERANCE} deg of reference (${ref.mc})`, () => {
    const diff = Math.abs(result.angles.mc - ref.mc);
    const wrappedDiff = diff > 180 ? 360 - diff : diff;
    expect(wrappedDiff).toBeLessThan(TOLERANCE);
  });
});

// ---------------------------------------------------------------------------
// General House Cusp Properties
// ---------------------------------------------------------------------------

describe('house cusp general properties', () => {
  it('opposite houses should be approximately 180 degrees apart (cusp 1 vs 7)', () => {
    const ref = charts[0]; // Sao Paulo
    const result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');

    const cusp1 = result.cusps[0].longitude;
    const cusp7 = result.cusps[6].longitude;
    let diff = Math.abs(cusp1 - cusp7);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeCloseTo(180, 0);
  });

  it('cusp 10 (MC) and cusp 4 (IC) should be approximately 180 degrees apart', () => {
    const ref = charts[1]; // London
    const result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');

    const cusp4 = result.cusps[3].longitude;
    const cusp10 = result.cusps[9].longitude;
    let diff = Math.abs(cusp4 - cusp10);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeCloseTo(180, 0);
  });

  it('ARMC and Vertex should be finite numbers', () => {
    const ref = charts[0];
    const result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');

    expect(Number.isFinite(result.angles.armc)).toBe(true);
    expect(Number.isFinite(result.angles.vertex)).toBe(true);
  });

  it('all cusp longitudes should be in [0, 360) range', () => {
    const ref = charts[0];
    const result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');

    for (const cusp of result.cusps) {
      expect(cusp.longitude).toBeGreaterThanOrEqual(0);
      expect(cusp.longitude).toBeLessThan(360);
    }
  });

  it('cusps should have valid sign and degree fields', () => {
    const ref = charts[0];
    const result = calculateHouseCusps(ref.julianDay, ref.latitude, ref.longitude, 'P');

    for (const cusp of result.cusps) {
      expect(typeof cusp.sign).toBe('string');
      expect(cusp.sign.length).toBeGreaterThan(0);
      expect(cusp.degree).toBeGreaterThanOrEqual(0);
      expect(cusp.degree).toBeLessThan(30);
    }
  });
});
