// TODO: Protect all routes in this file with admin role middleware before production.
// Currently these routes are only behind requireAuth; a proper role check is needed.

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const interpretiveTextSchema = z.object({
  category: z.enum(['planet_sign', 'planet_house', 'aspect', 'transit']),
  planet: z.string().min(1),
  sign: z.string().nullable().optional(),
  house: z.number().int().min(1).max(12).nullable().optional(),
  aspectType: z.string().nullable().optional(),
  transitPlanet: z.string().nullable().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  author: z.string().min(1),
});

const updateTextSchema = interpretiveTextSchema.partial();

const bulkImportSchema = z.array(interpretiveTextSchema).min(1).max(500);

// ---------------------------------------------------------------------------
// GET /texts - List all interpretive texts (with optional filters)
// ---------------------------------------------------------------------------

router.get('/texts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, planet, sign } = req.query;

    const where: Record<string, unknown> = {};
    if (typeof category === 'string' && category) where.category = category;
    if (typeof planet === 'string' && planet) where.planet = planet;
    if (typeof sign === 'string' && sign) where.sign = sign;

    const texts = await prisma.interpretiveText.findMany({
      where,
      orderBy: [{ category: 'asc' }, { planet: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(texts);
  } catch (err) {
    console.error('[admin.routes] GET /texts error:', err);
    res.status(500).json({ error: 'Failed to list interpretive texts' });
  }
});

// ---------------------------------------------------------------------------
// GET /texts/:id - Get a single interpretive text
// ---------------------------------------------------------------------------

router.get('/texts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const text = await prisma.interpretiveText.findUnique({
      where: { id: req.params.id },
    });

    if (!text) {
      res.status(404).json({ error: 'Interpretive text not found' });
      return;
    }

    res.json(text);
  } catch (err) {
    console.error('[admin.routes] GET /texts/:id error:', err);
    res.status(500).json({ error: 'Failed to retrieve interpretive text' });
  }
});

// ---------------------------------------------------------------------------
// POST /texts - Create a new interpretive text
// ---------------------------------------------------------------------------

router.post('/texts', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = interpretiveTextSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const text = await prisma.interpretiveText.create({
      data: {
        category: parsed.data.category,
        planet: parsed.data.planet,
        sign: parsed.data.sign ?? null,
        house: parsed.data.house ?? null,
        aspectType: parsed.data.aspectType ?? null,
        transitPlanet: parsed.data.transitPlanet ?? null,
        title: parsed.data.title,
        body: parsed.data.body,
        author: parsed.data.author,
      },
    });

    res.status(201).json(text);
  } catch (err) {
    console.error('[admin.routes] POST /texts error:', err);
    res.status(500).json({ error: 'Failed to create interpretive text' });
  }
});

// ---------------------------------------------------------------------------
// PUT /texts/:id - Update an interpretive text
// ---------------------------------------------------------------------------

router.put('/texts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = updateTextSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    // Verify the text exists before updating
    const existing = await prisma.interpretiveText.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Interpretive text not found' });
      return;
    }

    const text = await prisma.interpretiveText.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json(text);
  } catch (err) {
    console.error('[admin.routes] PUT /texts/:id error:', err);
    res.status(500).json({ error: 'Failed to update interpretive text' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /texts/:id - Delete an interpretive text
// ---------------------------------------------------------------------------

router.delete('/texts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.interpretiveText.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Interpretive text not found' });
      return;
    }

    await prisma.interpretiveText.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (err) {
    console.error('[admin.routes] DELETE /texts/:id error:', err);
    res.status(500).json({ error: 'Failed to delete interpretive text' });
  }
});

// ---------------------------------------------------------------------------
// POST /texts/bulk-import - Bulk import interpretive texts
// ---------------------------------------------------------------------------

router.post('/texts/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = bulkImportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const created = await prisma.$transaction(
      parsed.data.map((entry) =>
        prisma.interpretiveText.create({
          data: {
            category: entry.category,
            planet: entry.planet,
            sign: entry.sign ?? null,
            house: entry.house ?? null,
            aspectType: entry.aspectType ?? null,
            transitPlanet: entry.transitPlanet ?? null,
            title: entry.title,
            body: entry.body,
            author: entry.author,
          },
        }),
      ),
    );

    res.status(201).json({ imported: created.length, texts: created });
  } catch (err) {
    console.error('[admin.routes] POST /texts/bulk-import error:', err);
    res.status(500).json({ error: 'Failed to bulk import interpretive texts' });
  }
});

export default router;
