import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Orders pending longer than this are marked expired. */
const PENDING_ORDER_TTL_HOURS = 24;

/** Run cleanup every hour (in milliseconds). */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Recalculate daily transits at midnight UTC (checked every minute). */
const TRANSIT_CHECK_INTERVAL_MS = 60 * 1000;

// ---------------------------------------------------------------------------
// cleanupExpiredOrders
// ---------------------------------------------------------------------------

/**
 * Find all orders with status "pending" that are older than 24 hours and
 * mark them as "expired". This prevents stale checkout sessions from
 * cluttering the database and gives users a clear signal that they need
 * to start a new checkout.
 */
export async function cleanupExpiredOrders(): Promise<number> {
  const cutoff = new Date(
    Date.now() - PENDING_ORDER_TTL_HOURS * 60 * 60 * 1000,
  );

  try {
    const result = await prisma.order.updateMany({
      where: {
        status: 'pending',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'expired',
      },
    });

    if (result.count > 0) {
      console.info(
        `[cleanup] Expired ${result.count} pending order(s) older than ${PENDING_ORDER_TTL_HOURS}h`,
      );
    }

    return result.count;
  } catch (err) {
    console.error('[cleanup] Failed to expire stale orders:', err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// recalculateDailyTransits
// ---------------------------------------------------------------------------

/**
 * Placeholder for daily transit position caching.
 *
 * In a production system this would:
 * 1. Calculate planetary positions for the current date.
 * 2. Store them in a Redis cache or dedicated DB table for fast lookups.
 * 3. Pre-compute transit aspects for active subscribers.
 *
 * This is intended to run once daily at midnight UTC.
 */
export async function recalculateDailyTransits(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  console.info(
    `[transits] Daily transit recalculation triggered for ${today}`,
  );

  // TODO: Implement actual transit caching logic:
  // 1. Calculate current planetary positions via ephemeris.service
  // 2. Store in Redis or a transit_cache table
  // 3. Optionally pre-compute aspects for users with active subscriptions
  // 4. Invalidate stale cache entries from previous days

  console.info(
    `[transits] Daily transit recalculation placeholder complete for ${today}`,
  );
}

// ---------------------------------------------------------------------------
// startBackgroundJobs
// ---------------------------------------------------------------------------

/** Handles returned by setInterval, stored so they can be cleared on shutdown. */
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
let transitCheckIntervalId: ReturnType<typeof setInterval> | null = null;

/** Track the last date we ran daily transits to avoid duplicate runs. */
let lastTransitDate: string | null = null;

/**
 * Start all background jobs. Call this once during server startup.
 *
 * Jobs:
 * - **Expired order cleanup**: runs every hour.
 * - **Daily transit recalculation**: runs at midnight UTC (checked every minute).
 */
export function startBackgroundJobs(): void {
  console.info('[jobs] Starting background jobs');

  // Run cleanup once on startup, then every hour
  cleanupExpiredOrders();

  cleanupIntervalId = setInterval(() => {
    cleanupExpiredOrders();
  }, CLEANUP_INTERVAL_MS);

  // Check every minute if we've crossed midnight UTC
  transitCheckIntervalId = setInterval(() => {
    const nowUtc = new Date();
    const todayStr = nowUtc.toISOString().slice(0, 10);

    if (todayStr !== lastTransitDate) {
      lastTransitDate = todayStr;
      recalculateDailyTransits();
    }
  }, TRANSIT_CHECK_INTERVAL_MS);

  // Prevent intervals from keeping the process alive if everything else shuts down
  if (cleanupIntervalId && typeof cleanupIntervalId === 'object' && 'unref' in cleanupIntervalId) {
    cleanupIntervalId.unref();
  }
  if (transitCheckIntervalId && typeof transitCheckIntervalId === 'object' && 'unref' in transitCheckIntervalId) {
    transitCheckIntervalId.unref();
  }

  console.info(
    '[jobs] Background jobs started: cleanup (every 1h), transit recalc (midnight UTC)',
  );
}

/**
 * Stop all background jobs. Useful for graceful shutdown and testing.
 */
export function stopBackgroundJobs(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  if (transitCheckIntervalId !== null) {
    clearInterval(transitCheckIntervalId);
    transitCheckIntervalId = null;
  }
  console.info('[jobs] Background jobs stopped');
}
