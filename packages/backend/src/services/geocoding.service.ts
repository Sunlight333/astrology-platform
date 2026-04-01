import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { find as findTimezone } from 'geo-tz';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  timezoneId: string;
}

/**
 * Normalize a location query for consistent cache lookups.
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Provider: Google Maps Geocoding API
// ---------------------------------------------------------------------------

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
  }>;
  error_message?: string;
}

async function geocodeWithGoogle(
  query: string,
  apiKey: string,
): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    console.warn(`Google Geocoding API HTTP error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
    console.warn(`Google Geocoding API refused request: ${data.status} – ${data.error_message ?? ''}`);
    return null;
  }

  if (data.status !== 'OK' || data.results.length === 0) {
    return null;
  }

  const first = data.results[0];
  return {
    latitude: first.geometry.location.lat,
    longitude: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

// ---------------------------------------------------------------------------
// Provider: OpenCage Geocoding API
// ---------------------------------------------------------------------------

interface OpenCageResponse {
  status: { code: number; message: string };
  results: Array<{
    geometry: { lat: number; lng: number };
    formatted: string;
  }>;
}

async function geocodeWithOpenCage(
  query: string,
  apiKey: string,
): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> {
  const url = new URL('https://api.opencagedata.com/geocode/v1/json');
  url.searchParams.set('q', query);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('limit', '1');
  url.searchParams.set('no_annotations', '1');

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    console.warn(`OpenCage API HTTP error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as OpenCageResponse;

  if (data.status.code === 402 || data.status.code === 403) {
    console.warn(`OpenCage API refused request: ${data.status.code} – ${data.status.message}`);
    return null;
  }

  if (data.results.length === 0) {
    return null;
  }

  const first = data.results[0];
  return {
    latitude: first.geometry.lat,
    longitude: first.geometry.lng,
    formattedAddress: first.formatted,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Geocode a location string into coordinates, formatted address, and IANA
 * timezone identifier.
 *
 * Resolution order:
 *  1. Check the `GeocodingCache` table (normalized query).
 *  2. Try Google Maps Geocoding API (if key configured).
 *  3. Fall back to OpenCage API (if key configured).
 *  4. Resolve timezone from coordinates via the IANA tz database (`geo-tz`).
 *  5. Cache the result for future lookups.
 */
export async function geocodeLocation(query: string): Promise<GeocodingResult> {
  const normalized = normalizeQuery(query);

  if (normalized.length === 0) {
    throw new Error('Geocoding query must not be empty');
  }

  // ---- 1. Cache lookup ----
  const cached = await prisma.geocodingCache.findUnique({
    where: { queryNormalized: normalized },
  });

  if (cached) {
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      formattedAddress: cached.formattedAddress,
      timezoneId: cached.timezoneId,
    };
  }

  // ---- 2. Geocode via external providers ----
  let coords: { latitude: number; longitude: number; formattedAddress: string } | null = null;
  let provider = 'google';

  // Try Google first
  if (env.GOOGLE_MAPS_API_KEY) {
    try {
      coords = await geocodeWithGoogle(query, env.GOOGLE_MAPS_API_KEY);
    } catch (err) {
      console.warn('Google Geocoding API call failed:', err instanceof Error ? err.message : err);
    }
  }

  // Fall back to OpenCage
  if (!coords && env.OPENCAGE_API_KEY) {
    provider = 'opencage';
    try {
      coords = await geocodeWithOpenCage(query, env.OPENCAGE_API_KEY);
    } catch (err) {
      console.warn('OpenCage API call failed:', err instanceof Error ? err.message : err);
    }
  }

  if (!coords) {
    throw new Error(
      `Unable to geocode location "${query}". No provider returned results. ` +
        'Ensure at least one geocoding API key is configured (GOOGLE_MAPS_API_KEY or OPENCAGE_API_KEY).',
    );
  }

  // ---- 3. Resolve timezone ----
  const timezones = findTimezone(coords.latitude, coords.longitude);
  const timezoneId = timezones[0] ?? 'UTC';

  // ---- 4. Persist to cache ----
  const result: GeocodingResult = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    formattedAddress: coords.formattedAddress,
    timezoneId,
  };

  try {
    await prisma.geocodingCache.create({
      data: {
        queryNormalized: normalized,
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
        timezoneId: result.timezoneId,
        provider,
      },
    });
  } catch (err) {
    // A race condition (another request cached it first) is harmless – log and move on.
    console.warn('Failed to write geocoding cache entry:', err instanceof Error ? err.message : err);
  }

  return result;
}
