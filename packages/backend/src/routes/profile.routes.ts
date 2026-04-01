import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  birthDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Birth date must be in YYYY-MM-DD format',
    )
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100;
    }, 'Birth date must be a valid date between 1900 and 2100'),
  birthTime: z
    .string()
    .regex(
      /^\d{2}:\d{2}$/,
      'Birth time must be in HH:mm format (24-hour)',
    )
    .refine((val) => {
      const [h, m] = val.split(':').map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }, 'Birth time must be a valid time'),
  birthCity: z
    .string()
    .min(1, 'Birth city is required')
    .max(200, 'Birth city must be 200 characters or fewer'),
});

// ---------------------------------------------------------------------------
// POST / — Create birth profile
// ---------------------------------------------------------------------------

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
      return;
    }

    const { name, birthDate, birthTime, birthCity } = parsed.data;

    const profile = await prisma.birthProfile.create({
      data: {
        userId: req.userId!,
        name,
        birthDate: new Date(birthDate),
        birthTime,
        birthCity,
        // Geocoded fields default to 0 — populated during chart calculation
        birthLatitude: 0,
        birthLongitude: 0,
        timezoneId: '',
        utcDatetime: new Date(0),
        julianDay: 0,
      },
    });

    res.status(201).json({
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      birthDate: profile.birthDate.toISOString().slice(0, 10),
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      birthLatitude: profile.birthLatitude,
      birthLongitude: profile.birthLongitude,
      timezoneId: profile.timezoneId,
      createdAt: profile.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[profile.routes] POST / error:', err);
    res.status(500).json({ error: 'Failed to create birth profile' });
  }
});

// ---------------------------------------------------------------------------
// GET / — List user's birth profiles
// ---------------------------------------------------------------------------

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.birthProfile.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(
      profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.name,
        birthDate: p.birthDate.toISOString().slice(0, 10),
        birthTime: p.birthTime,
        birthCity: p.birthCity,
        birthLatitude: p.birthLatitude,
        birthLongitude: p.birthLongitude,
        timezoneId: p.timezoneId,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error('[profile.routes] GET / error:', err);
    res.status(500).json({ error: 'Failed to list birth profiles' });
  }
});

// ---------------------------------------------------------------------------
// GET /:id — Get a single birth profile
// ---------------------------------------------------------------------------

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.birthProfile.findUnique({
      where: { id: req.params.id },
    });

    if (!profile) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }

    if (profile.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.status(200).json({
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      birthDate: profile.birthDate.toISOString().slice(0, 10),
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      birthLatitude: profile.birthLatitude,
      birthLongitude: profile.birthLongitude,
      timezoneId: profile.timezoneId,
      utcDatetime: profile.utcDatetime.toISOString(),
      julianDay: profile.julianDay,
      createdAt: profile.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[profile.routes] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to retrieve birth profile' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id — Delete a birth profile
// ---------------------------------------------------------------------------

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = await prisma.birthProfile.findUnique({
      where: { id: req.params.id },
    });

    if (!profile) {
      res.status(404).json({ error: 'Birth profile not found' });
      return;
    }

    if (profile.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.birthProfile.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({ message: 'Birth profile deleted' });
  } catch (err) {
    console.error('[profile.routes] DELETE /:id error:', err);
    res.status(500).json({ error: 'Failed to delete birth profile' });
  }
});

export default router;
