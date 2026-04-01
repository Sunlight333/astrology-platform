import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { createCheckout, getOrderStatus, getProductPrice, refundOrder } from '../services/payment.service';
import { prisma } from '../lib/prisma';

const router = Router();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createCheckoutSchema = z.object({
  productType: z.enum(['natal_chart', 'transit_report']),
  birthProfileId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// GET /test-checkout - Sandbox test endpoint (no auth required)
// ---------------------------------------------------------------------------

router.get('/test-checkout', async (_req: Request, res: Response) => {
  try {
    // Use a dummy user ID; in sandbox mode this creates a real preference
    // that can be paid with MP test credentials.
    const testUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!testUser) {
      res.status(400).json({ error: 'No users in database. Register a user first.' });
      return;
    }

    const price = await getProductPrice('natal_chart');
    const result = await createCheckout(
      testUser.id,
      'natal_chart',
      price,
      'Mapa Natal Completo (sandbox test)',
    );

    res.json({
      message: 'Sandbox checkout created',
      checkoutUrl: result.checkoutUrl,
      orderId: result.orderId,
    });
  } catch (err) {
    console.error('[payment] test-checkout error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create test checkout';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /create-checkout - Create a checkout session (auth required)
// ---------------------------------------------------------------------------

router.post('/create-checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { productType, birthProfileId } = parsed.data;
    const userId = req.userId!;

    // If a birthProfileId is provided, verify it belongs to the user
    if (birthProfileId) {
      const profile = await prisma.birthProfile.findFirst({
        where: { id: birthProfileId, userId },
      });
      if (!profile) {
        res.status(404).json({ error: 'Birth profile not found or does not belong to you' });
        return;
      }
    }

    // Look up the product price from the DB (falls back to defaults)
    const price = await getProductPrice(productType);

    const descriptions: Record<string, string> = {
      natal_chart: 'Mapa Natal Completo',
      transit_report: 'Informe de Transitos',
    };

    const result = await createCheckout(userId, productType, price, descriptions[productType]);

    // If birthProfileId was provided, link the order to the profile
    // by creating a placeholder natal chart / transit report entry
    if (birthProfileId && productType === 'natal_chart') {
      // Check if there's already a natal chart for this profile + order
      const existingChart = await prisma.natalChart.findFirst({
        where: { birthProfileId, orderId: result.orderId },
      });
      if (!existingChart) {
        await prisma.natalChart.updateMany({
          where: { birthProfileId, orderId: null, isPaid: false },
          data: { orderId: result.orderId },
        });
      }
    }

    res.json({
      checkoutUrl: result.checkoutUrl,
      orderId: result.orderId,
    });
  } catch (err) {
    console.error('[payment] create-checkout error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create checkout';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// GET /order/:orderId - Get order status (auth required)
// ---------------------------------------------------------------------------

router.get('/order/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId!;

    const order = await getOrderStatus(orderId);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Ensure the order belongs to the requesting user
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error('[payment] order status error:', err);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// ---------------------------------------------------------------------------
// POST /refund/:orderId - Initiate a refund (auth required)
// ---------------------------------------------------------------------------

router.post('/refund/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId!;

    await refundOrder(orderId, userId);

    res.json({
      message: 'Order refunded successfully',
      orderId,
    });
  } catch (err) {
    console.error('[payment] refund error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process refund';

    // Map known error messages to appropriate HTTP status codes
    if (message === 'Order not found') {
      res.status(404).json({ error: message });
      return;
    }
    if (message.startsWith('Forbidden')) {
      res.status(403).json({ error: message });
      return;
    }
    if (message.includes('already refunded') || message.includes('Cannot refund')) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(500).json({ error: message });
  }
});

export default router;
