import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import {
  calculateTransits,
  calculateTransitRange,
} from '../services/transit.service';
import { TransitAspect } from '@star/shared';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const dateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Number of transits shown to free users. */
const FREE_TRANSIT_LIMIT = 3;

/**
 * Check whether the user has a paid transit report order for this profile.
 */
async function hasPaidTransitReport(
  userId: string,
  birthProfileId: string,
): Promise<boolean> {
  const paidOrder = await prisma.order.findFirst({
    where: {
      userId,
      productType: 'transit_report',
      status: 'paid',
      transitReports: { some: { birthProfileId } },
    },
  });
  return !!paidOrder;
}

/**
 * Gate transit data: free users see only the top 3 tightest transits.
 */
function gateTransits(
  transits: TransitAspect[],
  isPaid: boolean,
): { transits: TransitAspect[]; totalCount: number; isPaid: boolean } {
  // Transits are already sorted by orb (tightest first) from the service
  return {
    transits: isPaid ? transits : transits.slice(0, FREE_TRANSIT_LIMIT),
    totalCount: transits.length,
    isPaid,
  };
}

/**
 * Verify the birth profile exists and belongs to the authenticated user.
 * Returns the profile or null (and sends the error response).
 */
async function verifyProfileOwnership(
  birthProfileId: string,
  userId: string | undefined,
  res: Response,
): Promise<boolean> {
  const profile = await prisma.birthProfile.findUnique({
    where: { id: birthProfileId },
  });

  if (!profile) {
    res.status(404).json({ error: 'Birth profile not found' });
    return false;
  }

  if (profile.userId !== userId) {
    res.status(403).json({ error: 'You do not own this birth profile' });
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// GET /:birthProfileId - Active transits for current date
// ---------------------------------------------------------------------------

router.get(
  '/:birthProfileId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { birthProfileId } = req.params;

      const ownsProfile = await verifyProfileOwnership(
        birthProfileId,
        req.userId,
        res,
      );
      if (!ownsProfile) return;

      const transits = await calculateTransits(birthProfileId);
      const isPaid = await hasPaidTransitReport(req.userId!, birthProfileId);

      res.status(200).json(gateTransits(transits, isPaid));
    } catch (err) {
      console.error('[transit.routes] GET /:birthProfileId error:', err);
      const message =
        err instanceof Error ? err.message : 'Transit calculation failed';
      res.status(500).json({ error: message });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /:birthProfileId/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// ---------------------------------------------------------------------------

router.get(
  '/:birthProfileId/range',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { birthProfileId } = req.params;

      const ownsProfile = await verifyProfileOwnership(
        birthProfileId,
        req.userId,
        res,
      );
      if (!ownsProfile) return;

      const parsed = dateRangeSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: parsed.error.flatten(),
        });
        return;
      }

      const { start, end } = parsed.data;

      // Validate range does not exceed 90 days
      const startMs = new Date(start + 'T00:00:00Z').getTime();
      const endMs = new Date(end + 'T00:00:00Z').getTime();
      const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }
      if (diffDays > 90) {
        res
          .status(400)
          .json({ error: 'Date range cannot exceed 90 days' });
        return;
      }

      const events = await calculateTransitRange(
        birthProfileId,
        start,
        end,
      );

      const isPaid = await hasPaidTransitReport(req.userId!, birthProfileId);

      // Gate each day's transits
      const gatedEvents = events.map((event) => ({
        date: event.date,
        ...gateTransits(event.transits, isPaid),
      }));

      res.status(200).json({ events: gatedEvents, isPaid });
    } catch (err) {
      console.error(
        '[transit.routes] GET /:birthProfileId/range error:',
        err,
      );
      const message =
        err instanceof Error ? err.message : 'Transit range calculation failed';
      res.status(500).json({ error: message });
    }
  },
);

export default router;
