import { DateTime } from 'luxon';
import { dateToJulianDay } from '../services/ephemeris.service';

export interface UTCConversionResult {
  utcDate: Date;
  julianDay: number;
}

/**
 * Convert a local date, time, and IANA timezone into a UTC `Date` and a Julian
 * Day number suitable for ephemeris calculations.
 *
 * Historical timezone handling note:
 * Brazilian historical timezone data changed multiple times — notably the
 * abolition of daylight saving time (DST) in 2019 (Decree 9.772/2019). For
 * birth dates that fall within former DST periods, using the IANA tz database
 * (maintained by `geo-tz` for lookup and Luxon/ICU for conversion) is
 * essential because it encodes the full history of UTC offset changes,
 * including the many Brazilian DST rule revisions (e.g. 2008 extension, 2013
 * Acre change, 2019 abolition). This ensures correct UTC conversion regardless
 * of when the birth occurred.
 *
 * @param date - Local date in "YYYY-MM-DD" format.
 * @param time - Local time in "HH:mm" format (24-hour).
 * @param timezoneId - IANA timezone identifier (e.g. "America/Sao_Paulo").
 */
export function convertToUTC(date: string, time: string, timezoneId: string): UTCConversionResult {
  const [hourStr, minuteStr] = time.split(':');
  const [yearStr, monthStr, dayStr] = date.split('-');

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if ([year, month, day, hour, minute].some((v) => Number.isNaN(v))) {
    throw new Error(`Invalid date/time input: date="${date}", time="${time}"`);
  }

  const dt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0 },
    { zone: timezoneId },
  );

  if (!dt.isValid) {
    throw new Error(
      `Could not construct a valid DateTime: ${dt.invalidReason ?? 'unknown reason'} – ` +
        `date="${date}", time="${time}", timezone="${timezoneId}"`,
    );
  }

  const utcDate = dt.toUTC().toJSDate();
  const julianDay = dateToJulianDay(utcDate);

  return { utcDate, julianDay };
}
