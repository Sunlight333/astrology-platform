import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { calculateNatalChart } from './chart.service';
import {
  sendPaymentConfirmation,
  sendRefundConfirmation,
} from './email.service';

// ---------------------------------------------------------------------------
// Mercado Pago SDK client
// ---------------------------------------------------------------------------

function getMpClient(): MercadoPagoConfig {
  const token = env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN is not configured');
  }
  return new MercadoPagoConfig({ accessToken: token });
}

// ---------------------------------------------------------------------------
// Product pricing helpers
// ---------------------------------------------------------------------------

const DEFAULT_PRICES: Record<string, number> = {
  natal_chart: 49.9,
  transit_report: 39.9,
};

async function getProductPrice(productType: string): Promise<number> {
  const product = await prisma.product.findUnique({ where: { type: productType } });
  if (product && product.active) {
    return product.priceBrl;
  }
  const fallback = DEFAULT_PRICES[productType];
  if (fallback === undefined) {
    throw new Error(`Unknown product type: ${productType}`);
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// createCheckout
// ---------------------------------------------------------------------------

export interface CheckoutResult {
  checkoutUrl: string;
  orderId: string;
}

export async function createCheckout(
  userId: string,
  productType: 'natal_chart' | 'transit_report',
  amount: number,
  description: string,
): Promise<CheckoutResult> {
  // 1. Create the order in the database
  const order = await prisma.order.create({
    data: {
      userId,
      productType,
      status: 'pending',
      amount,
    },
  });

  // 2. Create Mercado Pago preference
  const client = getMpClient();
  const preferenceApi = new Preference(client);

  const frontendUrl = env.FRONTEND_URL;

  const preference = await preferenceApi.create({
    body: {
      items: [
        {
          id: order.id,
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: order.id,
      back_urls: {
        success: `${frontendUrl}/payment/success?orderId=${order.id}`,
        failure: `${frontendUrl}/payment/failure?orderId=${order.id}`,
        pending: `${frontendUrl}/payment/pending?orderId=${order.id}`,
      },
      auto_return: 'approved',
      notification_url: `${frontendUrl}/api/webhooks/mercadopago`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    },
  });

  const checkoutUrl = preference.sandbox_init_point ?? preference.init_point;
  if (!checkoutUrl) {
    throw new Error('Failed to obtain checkout URL from Mercado Pago');
  }

  // 3. Store the preference ID back on the order
  await prisma.order.update({
    where: { id: order.id },
    data: { mpPreferenceId: preference.id ?? null },
  });

  return { checkoutUrl, orderId: order.id };
}

// ---------------------------------------------------------------------------
// handleWebhook
// ---------------------------------------------------------------------------

export async function handleWebhook(paymentId: string): Promise<void> {
  const client = getMpClient();
  const paymentApi = new Payment(client);

  // Fetch payment details from Mercado Pago
  const payment = await paymentApi.get({ id: Number(paymentId) });

  if (!payment || !payment.external_reference) {
    console.warn(`[payment] No external_reference on payment ${paymentId}`);
    return;
  }

  const orderId = payment.external_reference;
  const mpStatus = payment.status; // "approved" | "rejected" | "pending" | "in_process" etc.

  // Idempotency: check if this mpPaymentId was already processed
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existingOrder) {
    console.warn(`[payment] Order ${orderId} not found for payment ${paymentId}`);
    return;
  }

  if (existingOrder.mpPaymentId === String(paymentId) && existingOrder.status === 'approved') {
    console.info(`[payment] Payment ${paymentId} already processed for order ${orderId}, skipping`);
    return;
  }

  // Map MP status to our order status
  let orderStatus: string;
  switch (mpStatus) {
    case 'approved':
      orderStatus = 'approved';
      break;
    case 'rejected':
    case 'cancelled':
      orderStatus = 'rejected';
      break;
    case 'refunded':
      orderStatus = 'refunded';
      break;
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      orderStatus = 'pending';
      break;
    default:
      orderStatus = 'pending';
  }

  // Update the order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: orderStatus,
      mpPaymentId: String(paymentId),
      paidAt: orderStatus === 'approved' ? new Date() : undefined,
    },
  });

  // If approved, mark the associated products as paid, trigger chart
  // calculation if not already done, and send confirmation email
  if (orderStatus === 'approved') {
    await markProductsPaid(existingOrder.id, existingOrder.productType);
    await triggerPostPaymentFulfillment(existingOrder.id, existingOrder.userId, existingOrder.productType);
    await sendPaymentConfirmation(existingOrder.userId, existingOrder.id, existingOrder.productType);
  }

  // If refunded, revert isPaid flags and send refund confirmation
  if (orderStatus === 'refunded') {
    await markProductsUnpaid(existingOrder.id, existingOrder.productType);
    await sendRefundConfirmation(existingOrder.userId, existingOrder.id, existingOrder.productType);
  }

  console.info(
    `[payment] Order ${orderId} updated to status="${orderStatus}" (MP payment ${paymentId}, MP status="${mpStatus}")`,
  );
}

// ---------------------------------------------------------------------------
// Post-payment fulfillment
// ---------------------------------------------------------------------------

/**
 * After a payment is approved, trigger any product-specific fulfillment.
 * For natal charts: calculate the chart if one hasn't been computed yet.
 */
async function triggerPostPaymentFulfillment(
  orderId: string,
  userId: string,
  productType: string,
): Promise<void> {
  try {
    if (productType === 'natal_chart') {
      // Find natal charts linked to this order that might need calculation
      const charts = await prisma.natalChart.findMany({
        where: { orderId },
        select: { id: true, birthProfileId: true, planetaryPositions: true },
      });

      if (charts.length === 0) {
        // No chart linked yet - find the user's birth profiles with unpaid charts
        // linked to this order, or the most recent profile
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            natalCharts: { select: { birthProfileId: true } },
          },
        });

        // If there are birth profiles associated via natalCharts, calculate for them
        if (order?.natalCharts && order.natalCharts.length > 0) {
          for (const chart of order.natalCharts) {
            await calculateNatalChart(chart.birthProfileId);
          }
        }

        console.info(
          `[payment] Post-payment fulfillment: no linked charts for order ${orderId}`,
        );
        return;
      }

      for (const chart of charts) {
        // Check if chart has actual planetary data (not just a placeholder)
        const positions = chart.planetaryPositions as any[];
        if (!positions || positions.length === 0) {
          console.info(
            `[payment] Triggering chart calculation for profile ${chart.birthProfileId} (order ${orderId})`,
          );
          const calculated = await calculateNatalChart(chart.birthProfileId);

          // Link the newly calculated chart to the order and mark as paid
          await prisma.natalChart.update({
            where: { id: calculated.id },
            data: { orderId, isPaid: true },
          });
        }
      }
    }

    // transit_report: transit reports are generated on-demand, so no
    // background calculation is needed. The order status serves as the
    // access gate.
  } catch (err) {
    // Log but don't throw - payment is already confirmed, fulfillment
    // can be retried or handled manually
    console.error(
      `[payment] Post-payment fulfillment error for order ${orderId}:`,
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// refundOrder
// ---------------------------------------------------------------------------

/**
 * Initiate a refund for an order. Marks the order as refunded and revokes
 * access to associated paid content.
 *
 * Note: This does NOT initiate a financial refund via Mercado Pago. In
 * production, you would call the MP refund API before marking the order.
 */
export async function refundOrder(orderId: string, userId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Forbidden: you do not own this order');
  }

  if (order.status === 'refunded') {
    throw new Error('Order is already refunded');
  }

  if (order.status !== 'approved') {
    throw new Error(`Cannot refund order with status "${order.status}". Only approved orders can be refunded.`);
  }

  // Mark order as refunded
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'refunded' },
  });

  // Revoke access to paid content
  await markProductsUnpaid(orderId, order.productType);

  // Send refund confirmation email
  await sendRefundConfirmation(userId, orderId, order.productType);

  console.info(`[payment] Order ${orderId} refunded for user ${userId}`);
}

// ---------------------------------------------------------------------------
// Product fulfillment helpers
// ---------------------------------------------------------------------------

async function markProductsPaid(orderId: string, productType: string): Promise<void> {
  if (productType === 'natal_chart') {
    await prisma.natalChart.updateMany({
      where: { orderId },
      data: { isPaid: true },
    });
  }
  // transit_report doesn't have an isPaid field in the schema,
  // but the order status itself serves as the source of truth.
}

async function markProductsUnpaid(orderId: string, productType: string): Promise<void> {
  if (productType === 'natal_chart') {
    await prisma.natalChart.updateMany({
      where: { orderId },
      data: { isPaid: false },
    });
  }
}

// ---------------------------------------------------------------------------
// getOrderStatus
// ---------------------------------------------------------------------------

export async function getOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      natalCharts: { select: { id: true, isPaid: true } },
      transitReports: { select: { id: true } },
    },
  });

  if (!order) {
    return null;
  }

  return order;
}

// ---------------------------------------------------------------------------
// getProductPrice (exported for routes)
// ---------------------------------------------------------------------------

export { getProductPrice };
