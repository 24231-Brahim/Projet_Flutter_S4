import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { constructWebhookEvent, getStripe } from './utils/stripe';
import { generateTicket } from './tickets';

const db = admin.firestore();

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;

  functions.logger.info('Stripe webhook received', {
    hasSignature: !!signature,
    method: req.method,
  });

  if (req.method !== 'POST') {
    functions.logger.warn('Invalid webhook method', { method: req.method });
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (!signature) {
    functions.logger.error('Missing Stripe signature');
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;

  try {
    const rawBody = Buffer.from(JSON.stringify(req.body));
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    functions.logger.error('Webhook signature verification failed', { error: err });
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return;
  }

  functions.logger.info('Processing Stripe event', {
    type: event.type,
    eventId: event.id,
  });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        functions.logger.info('Unhandled event type', { type: event.type });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    functions.logger.error('Error processing webhook', { error, type: event.type });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  functions.logger.info('Payment intent succeeded', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  });

  try {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      functions.logger.warn('No bookingId in payment intent metadata', { paymentIntentId: paymentIntent.id });
      return;
    }

    const paymentsQuery = await db
      .collection('payments')
      .where('stripePaymentIntentId', '==', paymentIntent.id)
      .limit(1)
      .get();

    if (paymentsQuery.empty) {
      functions.logger.warn('Payment document not found', { paymentIntentId: paymentIntent.id });
      return;
    }

    const paymentDoc = paymentsQuery.docs[0];

    await paymentDoc.ref.update({
      statut: 'succeeded',
      methode: paymentIntent.payment_method_types?.[0] || 'card',
    });

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      functions.logger.error('Booking not found', { bookingId });
      return;
    }

    const bookingData = bookingDoc.data()!;

    if (bookingData.statut !== 'pending') {
      functions.logger.warn('Booking is not in pending status', { bookingId, statut: bookingData.statut });
      return;
    }

    const eventRef = db.collection('events').doc(bookingData.eventId);
    const eventDoc = await eventRef.get();
    const eventData = eventDoc.data();

    const ticketDoc = await db
      .collection('events')
      .doc(bookingData.eventId)
      .collection('tickets')
      .doc(bookingData.ticketId)
      .get();
    const ticketData = ticketDoc.data();

    const userDoc = await db.collection('users').doc(bookingData.userId).get();
    const userData = userDoc.data();

    const ticketResult = await generateTicket({
      bookingId,
      eventId: bookingData.eventId,
      ticketId: bookingData.ticketId,
      userId: bookingData.userId,
      ticketType: ticketData?.type || 'standard',
      eventTitle: eventData?.titre || 'Event',
      eventDate: eventData?.dateDebut?.toDate() || new Date(),
      eventVenue: eventData?.lieu || 'TBD',
      attendeeName: userData?.nom || 'Guest',
      quantity: bookingData.quantite,
      prix: bookingData.montantTotal / bookingData.quantite,
    });

    await bookingRef.update({
      statut: 'confirmed',
      qrCodeToken: ticketResult.qrCodeToken,
      qrCodeURL: ticketResult.qrCodeURL,
      pdfURL: ticketResult.pdfURL,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('notifications').add({
      userId: bookingData.userId,
      titre: 'Booking Confirmed! 🎉',
      corps: `Your booking for ${eventData?.titre} is confirmed. Your ticket is ready!`,
      type: 'booking_confirmed',
      data: { bookingId, eventId: bookingData.eventId },
      lue: false,
      envoyeAt: FieldValue.serverTimestamp(),
    });

    const fcmToken = userData?.fcmToken;
    if (fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Booking Confirmed! 🎉',
            body: `Your ticket for ${eventData?.titre} is ready. Check your app for details.`,
          },
          data: {
            type: 'booking_confirmed',
            bookingId,
            eventId: bookingData.eventId,
          },
        });
      } catch (notifError) {
        functions.logger.error('Failed to send FCM notification', { error: notifError });
      }
    }

    functions.logger.info('Payment succeeded and booking confirmed', { bookingId });
  } catch (error) {
    functions.logger.error('Error handling payment intent succeeded', { error });
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  functions.logger.info('Payment intent failed', {
    paymentIntentId: paymentIntent.id,
    lastPaymentError: paymentIntent.last_payment_error?.message,
  });

  try {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
      functions.logger.warn('No bookingId in payment intent metadata');
      return;
    }

    const paymentsQuery = await db
      .collection('payments')
      .where('stripePaymentIntentId', '==', paymentIntent.id)
      .limit(1)
      .get();

    if (!paymentsQuery.empty) {
      await paymentsQuery.docs[0].ref.update({
        statut: 'failed',
        lastError: paymentIntent.last_payment_error?.message,
      });
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return;
    }

    const bookingData = bookingDoc.data()!;

    await db.runTransaction(async (transaction) => {
      transaction.update(bookingRef, {
        statut: 'cancelled',
        cancelledReason: 'payment_failed',
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = db.collection('events').doc(bookingData.eventId);
      transaction.update(eventRef, {
        placesRestantes: FieldValue.increment(bookingData.quantite),
      });

      const ticketRef = eventRef.collection('tickets').doc(bookingData.ticketId);
      transaction.update(ticketRef, {
        quantiteDisponible: FieldValue.increment(bookingData.quantite),
        quantiteVendue: FieldValue.increment(-bookingData.quantite),
      });
    });

    await db.collection('notifications').add({
      userId: bookingData.userId,
      titre: 'Payment Failed',
      corps: 'Your payment could not be processed. Please try booking again.',
      type: 'cancellation',
      data: { bookingId },
      lue: false,
      envoyeAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Payment failed and booking cancelled', { bookingId });
  } catch (error) {
    functions.logger.error('Error handling payment intent failed', { error });
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  functions.logger.info('Charge refunded', {
    chargeId: charge.id,
    amount: charge.amount_refunded,
  });

  try {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      functions.logger.warn('No payment intent ID in charge');
      return;
    }

    const paymentsQuery = await db
      .collection('payments')
      .where('stripePaymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (paymentsQuery.empty) {
      functions.logger.warn('Payment document not found');
      return;
    }

    const paymentDoc = paymentsQuery.docs[0];
    const paymentData = paymentDoc.data();

    await paymentDoc.ref.update({
      statut: 'refunded',
      refundedAt: FieldValue.serverTimestamp(),
      refundedAmount: charge.amount_refunded / 100,
    });

    const bookingRef = db.collection('bookings').doc(paymentData.bookingId);
    const bookingDoc = await bookingRef.get();

    if (bookingDoc.exists) {
      await bookingRef.update({
        statut: 'refunded',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    functions.logger.info('Charge refunded and payment updated', {
      paymentId: paymentDoc.id,
      bookingId: paymentData.bookingId,
    });
  } catch (error) {
    functions.logger.error('Error handling charge refunded', { error });
    throw error;
  }
}

export const getPaymentStatus = functions.https.onCall(async (data, context) => {
  functions.logger.info('getPaymentStatus called', { uid: context.auth?.uid, bookingId: data.bookingId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Booking ID is required');
  }

  try {
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    const bookingData = bookingDoc.data();

    if (bookingData?.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to view this payment');
    }

    if (!bookingData?.paymentId) {
      return { payment: null };
    }

    const paymentDoc = await db.collection('payments').doc(bookingData.paymentId).get();

    if (!paymentDoc.exists) {
      return { payment: null };
    }

    const paymentData = paymentDoc.data();

    return {
      payment: {
        id: paymentDoc.id,
        statut: paymentData?.statut,
        montant: paymentData?.montant,
        devise: paymentData?.devise,
        methode: paymentData?.methode,
        datePaiement: paymentData?.datePaiement,
      },
    };
  } catch (error) {
    functions.logger.error('Error getting payment status', { bookingId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get payment status');
  }
});

export const retryPayment = functions.https.onCall(async (data, context) => {
  functions.logger.info('retryPayment called', { uid: context.auth?.uid, bookingId: data.bookingId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Booking ID is required');
  }

  try {
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found');
    }

    const bookingData = bookingDoc.data()!;

    if (bookingData.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    if (bookingData.statut !== 'pending') {
      throw new functions.https.HttpsError('invalid-argument', 'Booking is not in pending status');
    }

    if (!bookingData.paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'No payment associated with this booking');
    }

    const paymentDoc = await db.collection('payments').doc(bookingData.paymentId).get();
    const paymentData = paymentDoc.data();

    if (paymentData?.statut === 'succeeded') {
      throw new functions.https.HttpsError('invalid-argument', 'Payment already succeeded');
    }

    const stripe = getStripe();
    const paymentIntentId = paymentData?.stripePaymentIntentId;
    if (!paymentIntentId) {
      throw new functions.https.HttpsError('internal', 'Payment intent ID not found');
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    functions.logger.info('Payment retry initiated', { bookingId, paymentIntentId: paymentIntent.id });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    functions.logger.error('Error retrying payment', { bookingId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to retry payment');
  }
});
