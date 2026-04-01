/**
 * Timezone Conversion - Unit Tests
 *
 * Critical tests for Brazilian timezone handling, including historical DST
 * periods and the 2019 DST abolition. Correct timezone conversion is
 * essential for accurate birth chart calculations.
 */
import { convertToUTC, UTCConversionResult } from '../../utils/timezone';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract UTC offset in hours from a conversion result. */
function getUtcOffsetHours(
  localTime: string,
  result: UTCConversionResult,
): number {
  const [hourStr, minuteStr] = localTime.split(':');
  const localTotalMinutes = Number(hourStr) * 60 + Number(minuteStr);
  const utcTotalMinutes =
    result.utcDate.getUTCHours() * 60 + result.utcDate.getUTCMinutes();

  // Handle day boundary crossing
  let diffMinutes = utcTotalMinutes - localTotalMinutes;
  if (diffMinutes > 720) diffMinutes -= 1440;
  if (diffMinutes < -720) diffMinutes += 1440;

  return diffMinutes / 60;
}

// ---------------------------------------------------------------------------
// Brazilian Timezone Tests
// ---------------------------------------------------------------------------

describe('convertToUTC - Brazil timezones', () => {
  describe('Sao Paulo (America/Sao_Paulo)', () => {
    it('should apply DST offset (UTC-2) during historical DST period (Jan 15, 1995)', () => {
      // Brazil observed DST in Jan 1995. Sao Paulo standard time is UTC-3,
      // DST shifts it to UTC-2.
      const result = convertToUTC('1995-01-15', '14:30', 'America/Sao_Paulo');

      // Local 14:30 with UTC-2 => UTC 16:30
      expect(result.utcDate.getUTCHours()).toBe(16);
      expect(result.utcDate.getUTCMinutes()).toBe(30);
      expect(result.utcDate.getUTCDate()).toBe(15);

      const offset = getUtcOffsetHours('14:30', result);
      expect(offset).toBe(2); // UTC = local + 2 hours
    });

    it('should use standard offset (UTC-3) after DST abolition (Jan 15, 2020)', () => {
      // Brazil abolished DST in 2019. Jan 2020 should be UTC-3.
      const result = convertToUTC('2020-01-15', '14:30', 'America/Sao_Paulo');

      // Local 14:30 with UTC-3 => UTC 17:30
      expect(result.utcDate.getUTCHours()).toBe(17);
      expect(result.utcDate.getUTCMinutes()).toBe(30);
      expect(result.utcDate.getUTCDate()).toBe(15);

      const offset = getUtcOffsetHours('14:30', result);
      expect(offset).toBe(3); // UTC = local + 3 hours
    });

    it('should use standard offset (UTC-3) in winter (Jul 15, 2000)', () => {
      // July is winter in Brazil - no DST, standard UTC-3
      const result = convertToUTC('2000-07-15', '10:00', 'America/Sao_Paulo');

      expect(result.utcDate.getUTCHours()).toBe(13);
      expect(result.utcDate.getUTCMinutes()).toBe(0);

      const offset = getUtcOffsetHours('10:00', result);
      expect(offset).toBe(3);
    });

    it('should handle midnight crossing correctly', () => {
      // Local 01:00 with UTC-3 => UTC 04:00
      const result = convertToUTC('2020-06-15', '01:00', 'America/Sao_Paulo');
      expect(result.utcDate.getUTCHours()).toBe(4);
      expect(result.utcDate.getUTCDate()).toBe(15);
    });

    it('should handle late evening crossing into next UTC day', () => {
      // Local 22:00 with UTC-3 => UTC 01:00 next day
      const result = convertToUTC('2020-06-15', '22:00', 'America/Sao_Paulo');
      expect(result.utcDate.getUTCHours()).toBe(1);
      expect(result.utcDate.getUTCDate()).toBe(16); // Next day in UTC
    });
  });

  describe('Manaus (America/Manaus)', () => {
    it('should always be UTC-4 (Jan 15, 2020)', () => {
      const result = convertToUTC('2020-01-15', '14:30', 'America/Manaus');

      // Local 14:30 with UTC-4 => UTC 18:30
      expect(result.utcDate.getUTCHours()).toBe(18);
      expect(result.utcDate.getUTCMinutes()).toBe(30);

      const offset = getUtcOffsetHours('14:30', result);
      expect(offset).toBe(4);
    });

    it('should be UTC-4 in both summer and winter', () => {
      const summer = convertToUTC('2020-01-15', '12:00', 'America/Manaus');
      const winter = convertToUTC('2020-07-15', '12:00', 'America/Manaus');

      expect(summer.utcDate.getUTCHours()).toBe(16);
      expect(winter.utcDate.getUTCHours()).toBe(16);
    });
  });
});

// ---------------------------------------------------------------------------
// Julian Day Consistency
// ---------------------------------------------------------------------------

describe('convertToUTC - Julian Day consistency', () => {
  it('should produce a Julian Day that matches the computed UTC date', () => {
    const result = convertToUTC('2000-01-01', '09:00', 'America/Sao_Paulo');

    // Sao Paulo in January 2000 was on DST (UTC-2), so local 09:00 => UTC 11:00
    // J2000.0 = 2451545.0 at Jan 1 2000 12:00 UTC
    // UTC 11:00 = 2451545.0 - 1/24 = 2451544.9583...
    expect(result.julianDay).toBeCloseTo(2451544.9583, 2);
  });

  it('should return consistent Julian Day for equivalent UTC times from different zones', () => {
    // All of these represent the same instant: Jan 1 2000 15:00 UTC
    const saoPaulo = convertToUTC('2000-01-01', '13:00', 'America/Sao_Paulo'); // UTC-2 (DST)
    const manaus = convertToUTC('2000-01-01', '11:00', 'America/Manaus');       // UTC-4

    // Both should produce the same Julian Day
    expect(saoPaulo.julianDay).toBeCloseTo(manaus.julianDay, 4);
  });
});

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

describe('convertToUTC - input validation', () => {
  it('should throw on invalid date string', () => {
    expect(() => convertToUTC('not-a-date', '12:00', 'America/Sao_Paulo')).toThrow();
  });

  it('should throw on invalid time string', () => {
    expect(() => convertToUTC('2000-01-01', 'bad', 'America/Sao_Paulo')).toThrow();
  });

  it('should throw on invalid timezone', () => {
    expect(() => convertToUTC('2000-01-01', '12:00', 'Not/A_Timezone')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Non-Brazilian Timezones (sanity checks)
// ---------------------------------------------------------------------------

describe('convertToUTC - other timezones', () => {
  it('should handle UTC correctly (zero offset)', () => {
    const result = convertToUTC('2000-01-01', '12:00', 'UTC');
    expect(result.utcDate.getUTCHours()).toBe(12);
    expect(result.utcDate.getUTCMinutes()).toBe(0);
  });

  it('should handle positive UTC offset (Asia/Tokyo = UTC+9)', () => {
    const result = convertToUTC('2000-01-01', '12:00', 'Asia/Tokyo');
    // Local 12:00 - 9h offset => UTC 03:00
    expect(result.utcDate.getUTCHours()).toBe(3);
  });
});
