import Stripe from 'stripe';
import * as functions from 'firebase-functions';

const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';

if (!STRIPE_SECRET_KEY) {
  functions.logger.warn('Stripe secret key not configured');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  paymentMethodTypes?: string[];
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  const { amount, currency, metadata, paymentMethodTypes = ['card'] } = params;

  functions.logger.info('Creating payment intent', { amount, currency, metadata });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
    payment_method_types: paymentMethodTypes,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  functions.logger.info('Payment intent created', { paymentIntentId: paymentIntent.id });

  return paymentIntent;
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.confirm(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

export async function createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  functions.logger.info('Creating refund', { paymentIntentId, amount });

  const refund = await stripe.refunds.create(refundParams);

  functions.logger.info('Refund created', { refundId: refund.id, status: refund.status });

  return refund;
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe {
  return stripe;
}

export { STRIPE_WEBHOOK_SECRET };
