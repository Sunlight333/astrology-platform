/**
 * Aspect Service - Unit Tests
 *
 * Tests aspect detection logic with controlled mock positions, verifying
 * correct identification of aspect types, applying/separating status,
 * circular distance wrapping, and absence of false positives.
 */
import { calculateAspects } from '../../services/aspect.service';
import { PlanetaryPosition, Planet, ZodiacSign } from '@star/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal PlanetaryPosition for testing aspects.
 * Only longitude and speed matter for aspect calculation.
 */
function mockPosition(
  planet: Planet,
  longitude: number,
  speed: number = 1.0,
): PlanetaryPosition {
  const signIndex = Math.floor(longitude / 30) % 12;
  const signs: ZodiacSign[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  return {
    planet,
    longitude,
    latitude: 0,
    distance: 1,
    speedInLongitude: speed,
    sign: signs[signIndex],
    degree: Math.floor(longitude % 30),
    minute: 0,
    isRetrograde: speed < 0,
  };
}

// ---------------------------------------------------------------------------
// Aspect Detection - Basic
// ---------------------------------------------------------------------------

describe('calculateAspects', () => {
  describe('basic aspect detection', () => {
    it('should detect an exact conjunction (0 degrees)', () => {
      const positions = [
        mockPosition('Sun', 100),
        mockPosition('Moon', 100),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('conjunction');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect an exact opposition (180 degrees)', () => {
      const positions = [
        mockPosition('Sun', 10),
        mockPosition('Moon', 190),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('opposition');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect an exact trine (120 degrees)', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 120),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('trine');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect an exact square (90 degrees)', () => {
      const positions = [
        mockPosition('Sun', 45),
        mockPosition('Moon', 135),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('square');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect an exact sextile (60 degrees)', () => {
      const positions = [
        mockPosition('Sun', 30),
        mockPosition('Moon', 90),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('sextile');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect a quincunx (150 degrees)', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 150),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('quincunx');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect a semisextile (30 degrees)', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 30),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('semisextile');
      expect(aspects[0].orb).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Orb Handling
  // ---------------------------------------------------------------------------

  describe('orb handling', () => {
    it('should detect conjunction within orb (5 deg separation, orb limit 8)', () => {
      const positions = [
        mockPosition('Sun', 100),
        mockPosition('Moon', 105),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeDefined();
      expect(conj!.orb).toBe(5);
    });

    it('should detect opposition within orb (7 deg off exact)', () => {
      const positions = [
        mockPosition('Sun', 10),
        mockPosition('Moon', 183), // 173 deg separation, 7 off opposition
      ];
      const aspects = calculateAspects(positions);
      const opp = aspects.find((a) => a.aspectType === 'opposition');
      expect(opp).toBeDefined();
      expect(opp!.orb).toBe(7);
    });

    it('should NOT detect conjunction beyond orb (9 deg separation, orb limit 8)', () => {
      const positions = [
        mockPosition('Sun', 100),
        mockPosition('Moon', 109),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeUndefined();
    });

    it('should NOT report any aspect for planets 14 degrees apart (dead zone)', () => {
      // 14 degrees is not close to any standard aspect angle within normal orbs
      const positions = [
        mockPosition('Sun', 100),
        mockPosition('Moon', 114), // 14 degrees apart - not near any standard aspect
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(0);
    });

    it('should report the correct orb value (rounded to 2 decimal places)', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 92.37), // square with 2.37 deg orb
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('square');
      expect(aspects[0].orb).toBe(2.37);
    });
  });

  // ---------------------------------------------------------------------------
  // Circular Distance / Wrap-around
  // ---------------------------------------------------------------------------

  describe('circular distance and 360-degree wrapping', () => {
    it('should NOT detect conjunction for 355 and 5 (10 deg exceeds 8 deg orb)', () => {
      const positions = [
        mockPosition('Sun', 355),
        mockPosition('Moon', 5),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      // 10 degrees apart exceeds the conjunction orb of 8 degrees
      expect(conj).toBeUndefined();
    });

    it('should correctly compute circular distance (355 and 5 = 10 deg, not 350)', () => {
      // Even though no conjunction is found (orb exceeded), the distance
      // calculation itself must use the shortest arc (10 degrees, not 350).
      const positions = [
        mockPosition('Sun', 355),
        mockPosition('Moon', 5),
      ];
      const aspects = calculateAspects(positions);
      // A semisextile is at 30 deg +/- 2; semisquare at 45 +/- 2
      // 10 degrees is only near conjunction (0 +/- 8) but outside orb.
      // No aspect should match at 10 degrees separation.
      expect(aspects).toHaveLength(0);
    });

    it('should detect conjunction across 0/360 boundary (355 and 1 = 6 deg)', () => {
      const positions = [
        mockPosition('Sun', 355),
        mockPosition('Moon', 1),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeDefined();
      expect(conj!.angle).toBe(6);
      expect(conj!.orb).toBe(6);
    });

    it('should detect conjunction across 0/360 boundary (358 and 2 = 4 deg)', () => {
      const positions = [
        mockPosition('Sun', 358),
        mockPosition('Moon', 2),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeDefined();
      expect(conj!.angle).toBe(4);
      expect(conj!.orb).toBe(4);
    });

    it('should detect opposition across 0/360 boundary (5 and 185)', () => {
      const positions = [
        mockPosition('Sun', 5),
        mockPosition('Moon', 185),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('opposition');
      expect(aspects[0].orb).toBe(0);
    });

    it('should detect trine across 0/360 boundary (350 and 110 = 120 deg)', () => {
      const positions = [
        mockPosition('Sun', 350),
        mockPosition('Moon', 110),
      ];
      const aspects = calculateAspects(positions);
      // Circular distance: |350-110| = 240, 360-240 = 120. Trine.
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('trine');
      expect(aspects[0].orb).toBe(0);
    });

    it('should compute shortest arc (not the long way around)', () => {
      // Planets at 10 and 350: shortest distance is 20, not 340
      const positions = [
        mockPosition('Sun', 10),
        mockPosition('Moon', 350),
      ];
      const aspects = calculateAspects(positions);
      // 20 degrees is in a dead zone, no aspects expected
      expect(aspects).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Applying vs Separating
  // ---------------------------------------------------------------------------

  describe('applying vs separating', () => {
    it('should detect separating conjunction when faster planet is ahead and pulling away', () => {
      // Moon at 105 moving at 13 deg/day, Sun at 100 moving at 1 deg/day.
      // Moon is ahead and pulling away from Sun => separating from conjunction.
      const positions = [
        mockPosition('Sun', 100, 1.0),
        mockPosition('Moon', 105, 13.0),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeDefined();
      expect(conj!.isApplying).toBe(false); // separating
    });

    it('should detect applying conjunction when faster planet approaches slower from behind', () => {
      // Moon at 95, Sun at 100. Moon is behind but faster - closing the gap
      const positions = [
        mockPosition('Sun', 100, 1.0),
        mockPosition('Moon', 95, 13.0),
      ];
      const aspects = calculateAspects(positions);
      const conj = aspects.find((a) => a.aspectType === 'conjunction');
      expect(conj).toBeDefined();
      expect(conj!.isApplying).toBe(true);
    });

    it('should detect applying trine when separation is closing toward exact angle', () => {
      // Sun at 0 moving at 1 deg/day, Mars at 121 moving at 0.5 deg/day.
      // Gap is 121 deg (>120 trine). Mars is slower so gap is closing toward 120.
      const positions = [
        mockPosition('Sun', 0, 1.0),
        mockPosition('Mars', 121, 0.5),
      ];
      const aspects = calculateAspects(positions);
      const trine = aspects.find((a) => a.aspectType === 'trine');
      expect(trine).toBeDefined();
      expect(trine!.isApplying).toBe(true);
    });

    it('should handle retrograde planet applying to aspect', () => {
      // Mercury retrograde at 92 degrees, Sun at 0 degrees: 92 deg sep (square = 90 +/- 7)
      // Mercury going backward (negative speed), approaching the exact square at 90
      const positions = [
        mockPosition('Sun', 0, 1.0),
        mockPosition('Mercury', 92, -1.2), // retrograde
      ];
      const aspects = calculateAspects(positions);
      const square = aspects.find((a) => a.aspectType === 'square');
      expect(square).toBeDefined();
      expect(square!.isApplying).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Planets
  // ---------------------------------------------------------------------------

  describe('multiple planet pairs', () => {
    it('should find aspects between all unique pairs', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 90),      // square to Sun
        mockPosition('Mercury', 180),  // opposition to Sun, square to Moon
      ];
      const aspects = calculateAspects(positions);
      // Sun-Moon: 90 deg square
      // Sun-Mercury: 180 deg opposition
      // Moon-Mercury: 90 deg square
      expect(aspects).toHaveLength(3);

      const sunMoon = aspects.find(
        (a) => a.planetA === 'Sun' && a.planetB === 'Moon',
      );
      expect(sunMoon?.aspectType).toBe('square');

      const sunMerc = aspects.find(
        (a) => a.planetA === 'Sun' && a.planetB === 'Mercury',
      );
      expect(sunMerc?.aspectType).toBe('opposition');

      const moonMerc = aspects.find(
        (a) => a.planetA === 'Moon' && a.planetB === 'Mercury',
      );
      expect(moonMerc?.aspectType).toBe('square');
    });

    it('should not duplicate aspects (A-B and B-A)', () => {
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 120),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].planetA).toBe('Sun');
      expect(aspects[0].planetB).toBe('Moon');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle empty position array', () => {
      const aspects = calculateAspects([]);
      expect(aspects).toEqual([]);
    });

    it('should handle single planet (no pairs)', () => {
      const aspects = calculateAspects([mockPosition('Sun', 100)]);
      expect(aspects).toEqual([]);
    });

    it('should prefer tighter aspect when two aspect types could match', () => {
      // 31 degrees: semisextile (30 +/- 2) orb=1 wins
      const positions = [
        mockPosition('Sun', 0),
        mockPosition('Moon', 31),
      ];
      const aspects = calculateAspects(positions);
      expect(aspects).toHaveLength(1);
      expect(aspects[0].aspectType).toBe('semisextile');
      expect(aspects[0].orb).toBe(1);
    });
  });
});
