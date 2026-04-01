// TODO: Integrate with actual email provider (SendGrid, AWS SES, etc.) before production.
// All functions currently create structured log entries instead of sending real emails.

import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailLogEntry {
  timestamp: string;
  type: string;
  to: string | null;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function createLogEntry(entry: EmailLogEntry): void {
  console.info(
    JSON.stringify({
      level: 'info',
      service: 'email',
      ...entry,
    }),
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  return user?.email ?? null;
}

async function getUserName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? 'Customer';
}

// ---------------------------------------------------------------------------
// Product display names
// ---------------------------------------------------------------------------

const PRODUCT_NAMES: Record<string, string> = {
  natal_chart: 'Mapa Natal Completo',
  transit_report: 'Informe de Trânsitos',
};

// ---------------------------------------------------------------------------
// sendPaymentConfirmation
// ---------------------------------------------------------------------------

/**
 * Logs a payment confirmation email that would be sent to the user.
 *
 * Includes: order details, product type, amount, and a link to view results.
 */
export async function sendPaymentConfirmation(
  userId: string,
  orderId: string,
  productType: string,
): Promise<void> {
  const email = await getUserEmail(userId);
  const name = await getUserName(userId);
  const productName = PRODUCT_NAMES[productType] ?? productType;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { amount: true, paidAt: true },
  });

  const amount = order?.amount
    ? `R$ ${order.amount.toFixed(2)}`
    : 'N/A';

  const subject = `Confirmação de Pagamento - ${productName}`;

  const body = [
    `Olá ${name},`,
    '',
    `Seu pagamento para "${productName}" foi confirmado com sucesso!`,
    '',
    `Detalhes do pedido:`,
    `  - Pedido: ${orderId}`,
    `  - Produto: ${productName}`,
    `  - Valor: ${amount}`,
    `  - Data: ${order?.paidAt?.toISOString() ?? new Date().toISOString()}`,
    '',
    `Acesse seus resultados em:`,
    `  ${getResultsUrl(productType, orderId)}`,
    '',
    'Obrigado por usar nossa plataforma!',
    '',
    '-- Equipe Star',
  ].join('\n');

  createLogEntry({
    timestamp: new Date().toISOString(),
    type: 'payment_confirmation',
    to: email,
    subject,
    body,
    metadata: {
      userId,
      orderId,
      productType,
      amount: order?.amount ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// sendWelcomeEmail
// ---------------------------------------------------------------------------

/**
 * Logs a welcome email that would be sent to a newly registered user.
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  const email = await getUserEmail(userId);
  const name = await getUserName(userId);

  const subject = 'Bem-vindo ao Star - Sua Jornada Astrológica Começa Aqui';

  const body = [
    `Olá ${name},`,
    '',
    'Bem-vindo ao Star! Estamos muito felizes em ter você conosco.',
    '',
    'Com o Star, você pode:',
    '  - Calcular seu mapa natal completo',
    '  - Acompanhar os trânsitos planetários diários',
    '  - Receber interpretações personalizadas',
    '',
    'Comece criando seu perfil de nascimento para gerar seu primeiro mapa natal.',
    '',
    'Qualquer dúvida, estamos à disposição!',
    '',
    '-- Equipe Star',
  ].join('\n');

  createLogEntry({
    timestamp: new Date().toISOString(),
    type: 'welcome',
    to: email,
    subject,
    body,
    metadata: {
      userId,
    },
  });
}

// ---------------------------------------------------------------------------
// sendRefundConfirmation
// ---------------------------------------------------------------------------

/**
 * Logs a refund confirmation email that would be sent to the user.
 */
export async function sendRefundConfirmation(
  userId: string,
  orderId: string,
  productType: string,
): Promise<void> {
  const email = await getUserEmail(userId);
  const name = await getUserName(userId);
  const productName = PRODUCT_NAMES[productType] ?? productType;

  const subject = `Reembolso Processado - ${productName}`;

  const body = [
    `Olá ${name},`,
    '',
    `Seu reembolso para "${productName}" foi processado.`,
    '',
    `Pedido: ${orderId}`,
    '',
    'O valor será devolvido ao seu método de pagamento original.',
    '',
    '-- Equipe Star',
  ].join('\n');

  createLogEntry({
    timestamp: new Date().toISOString(),
    type: 'refund_confirmation',
    to: email,
    subject,
    body,
    metadata: {
      userId,
      orderId,
      productType,
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResultsUrl(productType: string, orderId: string): string {
  // In production this would use env.FRONTEND_URL
  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  switch (productType) {
    case 'natal_chart':
      return `${baseUrl}/chart/results?orderId=${orderId}`;
    case 'transit_report':
      return `${baseUrl}/transits/results?orderId=${orderId}`;
    default:
      return `${baseUrl}/orders/${orderId}`;
  }
}
