import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Free preview constants
// ---------------------------------------------------------------------------

/** Planets visible in free natal chart preview. */
const FREE_CHART_PLANETS = new Set(['Sun', 'Moon']);

/** Number of transits shown in free transit preview. */
const FREE_TRANSIT_LIMIT = 3;

// ---------------------------------------------------------------------------
// requirePaidChart
// ---------------------------------------------------------------------------

/**
 * Middleware that checks whether the authenticated user has a paid order for
 * the requested natal chart.
 *
 * Expects the chart ID in `req.params.id` and the user ID in `req.userId`
 * (set by requireAuth).
 *
 * Behaviour:
 * - If the chart is paid, the request proceeds to the next handler.
 * - If the chart exists but is unpaid, the response body is rewritten to
 *   contain only Sun, Moon, and Ascendant data (free preview) and the
 *   response includes a `x-content-access: preview` header.
 * - If the chart cannot be found at all, a 404 is returned.
 */
export async function requirePaidChart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const chartId = req.params.id ?? req.params.chartId;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!chartId) {
    res.status(400).json({ error: 'Chart ID is required' });
    return;
  }

  try {
    const chart = await prisma.natalChart.findUnique({
      where: { id: chartId },
      include: {
        birthProfile: { select: { userId: true } },
        order: { select: { status: true, userId: true } },
      },
    });

    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    // Verify ownership through the birth profile
    if (chart.birthProfile.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check payment status: either isPaid flag or an approved order
    const hasPaidAccess =
      chart.isPaid ||
      (chart.order !== null && chart.order.status === 'approved');

    if (hasPaidAccess) {
      // Full access - proceed to the route handler
      next();
      return;
    }

    // Unpaid: return free preview with Sun, Moon, and Ascendant only
    const positions = (chart.planetaryPositions as any[]) ?? [];
    const aspects = (chart.aspects as any[]) ?? [];
    const houseCuspsData = chart.houseCusps as any;

    const previewPositions = positions.filter((p: any) =>
      FREE_CHART_PLANETS.has(p.planet),
    );

    const previewAspects = aspects.filter(
      (a: any) =>
        FREE_CHART_PLANETS.has(a.planetA) &&
        FREE_CHART_PLANETS.has(a.planetB),
    );

    const previewAngles = houseCuspsData?.angles
      ? {
          ascendant: houseCuspsData.angles.ascendant,
          mc: 0,
          armc: 0,
          vertex: 0,
        }
      : { ascendant: 0, mc: 0, armc: 0, vertex: 0 };

    res.status(200).json({
      id: chart.id,
      birthProfileId: chart.birthProfileId,
      planetaryPositions: previewPositions,
      houseCusps: [],
      angles: previewAngles,
      aspects: previewAspects,
      calculatedAt: chart.calculatedAt.toISOString(),
      isPaid: false,
      _preview: true,
      _message:
        'This is a free preview showing Sun, Moon, and Ascendant only. Purchase the full natal chart to unlock all planetary positions, houses, and aspects.',
    });
  } catch (err) {
    console.error('[content-access] requirePaidChart error:', err);
    res.status(500).json({ error: 'Failed to verify chart access' });
  }
}

// ---------------------------------------------------------------------------
// requirePaidTransit
// ---------------------------------------------------------------------------

/**
 * Middleware that checks whether the authenticated user has a paid order for
 * the requested transit report.
 *
 * Expects the birth profile ID in `req.params.birthProfileId` and the user
 * ID in `req.userId` (set by requireAuth).
 *
 * Behaviour:
 * - If the user has a paid transit order for this profile, the request
 *   proceeds with `req.transitAccess = 'full'`.
 * - If unpaid, `req.transitAccess = 'preview'` so the route handler can
 *   limit the response to the top 3 transits.
 * - Returns 403 with payment_required only when the route explicitly
 *   requests full data (e.g., via `?full=true` query param) without payment.
 */
export async function requirePaidTransit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const birthProfileId =
    req.params.birthProfileId ?? req.params.profileId;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!birthProfileId) {
    res.status(400).json({ error: 'Birth profile ID is required' });
    return;
  }

  try {
    // Verify ownership
    const profile = await prisma.birthProfile.findUnique({
      where: { id: birthProfileId },
      select: { userId: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }

    if (profile.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check for a paid transit report order
    const paidOrder = await prisma.order.findFirst({
      where: {
        userId,
        productType: 'transit_report',
        status: 'approved',
        transitReports: { some: { birthProfileId } },
      },
    });

    const hasPaidAccess = !!paidOrder;

    // If the client is explicitly requesting full data without payment, block
    if (req.query.full === 'true' && !hasPaidAccess) {
      res.status(403).json({
        error: 'payment_required',
        productType: 'transit_report',
        message:
          'Full transit report requires purchase. Free preview shows top 3 transits.',
        previewLimit: FREE_TRANSIT_LIMIT,
      });
      return;
    }

    // Attach access level to the request for downstream handlers
    (req as any).transitAccess = hasPaidAccess ? 'full' : 'preview';
    (req as any).transitPreviewLimit = hasPaidAccess
      ? Infinity
      : FREE_TRANSIT_LIMIT;

    next();
  } catch (err) {
    console.error('[content-access] requirePaidTransit error:', err);
    res.status(500).json({ error: 'Failed to verify transit access' });
  }
}
