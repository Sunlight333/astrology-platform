import { Router, Request, Response } from 'express';
import { handleWebhook } from '../services/payment.service';

const router = Router();

// ---------------------------------------------------------------------------
// POST /mercadopago - Mercado Pago webhook notifications
// ---------------------------------------------------------------------------

router.post('/mercadopago', async (req: Request, res: Response) => {
  // Always return 200 immediately so MP doesn't retry
  // We process asynchronously below but within the same request cycle.
  // If something fails we still return 200 (MP expects it).

  const { type, data, action } = req.body ?? {};
  const topic = type ?? req.query.topic;
  const paymentId = data?.id ?? req.query['data.id'];

  console.info(`[webhook] Received MP event: topic="${topic}" action="${action}" paymentId="${paymentId}"`);

  // Optional signature verification
  const xSignature = req.headers['x-signature'] as string | undefined;
  const xRequestId = req.headers['x-request-id'] as string | undefined;
  if (xSignature) {
    // In production you would verify the HMAC signature here using
    // the webhook secret from Mercado Pago. For now we log it.
    console.info(`[webhook] x-signature present, x-request-id="${xRequestId}"`);
  }

  // We only care about payment notifications
  if (topic === 'payment' && paymentId) {
    try {
      await handleWebhook(String(paymentId));
    } catch (err) {
      // Log but do NOT return an error status - MP would keep retrying
      console.error('[webhook] Error handling payment webhook:', err);
    }
  } else {
    console.info(`[webhook] Ignoring event with topic="${topic}"`);
  }

  res.status(200).json({ received: true });
});

export default router;
