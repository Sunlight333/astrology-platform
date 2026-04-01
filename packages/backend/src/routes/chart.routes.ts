import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import {
  calculateNatalChart,
  getChart,
  getChartByBirthProfileId,
} from '../services/chart.service';
import { NatalChart } from '@star/shared';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const calculateBodySchema = z.object({
  birthProfileId: z.string().uuid(),
});

/**
 * Strip a chart down to only Sun, Moon, and Ascendant data for unpaid users.
 */
function toFreePreview(chart: NatalChart): Partial<NatalChart> {
  const FREE_PLANETS = new Set(['Sun', 'Moon']);

  return {
    id: chart.id,
    birthProfileId: chart.birthProfileId,
    planetaryPositions: chart.planetaryPositions.filter((p) =>
      FREE_PLANETS.has(p.planet),
    ),
    houseCusps: [],
    angles: {
      ascendant: chart.angles.ascendant,
      mc: 0,
      armc: 0,
      vertex: 0,
    },
    aspects: chart.aspects.filter(
      (a) => FREE_PLANETS.has(a.planetA) && FREE_PLANETS.has(a.planetB),
    ),
    houseSystem: chart.houseSystem,
    calculatedAt: chart.calculatedAt,
    isPaid: false,
  };
}

// ---------------------------------------------------------------------------
// POST /calculate
// ---------------------------------------------------------------------------

router.post('/calculate', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = calculateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const { birthProfileId } = parsed.data;

    // Verify the profile belongs to the authenticated user
    const profile = await prisma.birthProfile.findUnique({
      where: { id: birthProfileId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }

    if (profile.userId !== req.userId) {
      res.status(403).json({ error: 'You do not own this birth profile' });
      return;
    }

    // Check if there is an existing paid order for this profile
    const paidOrder = await prisma.order.findFirst({
      where: {
        userId: req.userId,
        productType: 'natal_chart',
        status: 'paid',
        natalCharts: { some: { birthProfileId } },
      },
    });

    const chart = await calculateNatalChart(birthProfileId);

    // If paid, link the chart to the order and mark as paid
    if (paidOrder) {
      await prisma.natalChart.update({
        where: { id: chart.id },
        data: { isPaid: true, orderId: paidOrder.id },
      });
      chart.isPaid = true;
      res.status(200).json(chart);
      return;
    }

    // Free preview: return only Sun, Moon, Ascendant
    res.status(200).json(toFreePreview(chart));
  } catch (err) {
    console.error('[chart.routes] POST /calculate error:', err);
    const message = err instanceof Error ? err.message : 'Chart calculation failed';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /:id
// ---------------------------------------------------------------------------

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const chart = await getChart(req.params.id);

    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    // Verify ownership through the birth profile
    const profile = await prisma.birthProfile.findUnique({
      where: { id: chart.birthProfileId },
    });

    if (!profile || profile.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!chart.isPaid) {
      res.status(200).json(toFreePreview(chart));
      return;
    }

    res.status(200).json(chart);
  } catch (err) {
    console.error('[chart.routes] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to retrieve chart' });
  }
});

// ---------------------------------------------------------------------------
// GET /profile/:birthProfileId
// ---------------------------------------------------------------------------

router.get(
  '/profile/:birthProfileId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Verify ownership
      const profile = await prisma.birthProfile.findUnique({
        where: { id: req.params.birthProfileId },
      });

      if (!profile) {
        res.status(404).json({ error: 'Birth profile not found' });
        return;
      }

      if (profile.userId !== req.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const chart = await getChartByBirthProfileId(req.params.birthProfileId);

      if (!chart) {
        res.status(404).json({ error: 'No chart found for this birth profile' });
        return;
      }

      if (!chart.isPaid) {
        res.status(200).json(toFreePreview(chart));
        return;
      }

      res.status(200).json(chart);
    } catch (err) {
      console.error('[chart.routes] GET /profile/:birthProfileId error:', err);
      res.status(500).json({ error: 'Failed to retrieve chart' });
    }
  },
);

export default router;
