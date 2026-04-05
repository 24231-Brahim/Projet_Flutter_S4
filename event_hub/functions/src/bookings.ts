import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateCreateBooking } from './utils/validators';
import { createPaymentIntent } from './utils/stripe';
import { generateTicket } from './tickets';

const db = admin.firestore();

export const createBooking = functions.https.onCall(async (data, context) => {
  functions.logger.info('createBooking called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const validatedData = validateCreateBooking(data);
  const { eventId, ticketId, quantite } = validatedData;

  try {
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();

    if (!eventData?.estPublie) {
      throw new functions.https.HttpsError('invalid-argument', 'Event is not available for booking');
    }

    if (eventData?.statut === 'cancelled') {
      throw new functions.https.HttpsError('invalid-argument', 'Event has been cancelled');
    }

    if (eventData?.statut === 'completed') {
      throw new functions.https.HttpsError('invalid-argument', 'Event has already completed');
    }

    const eventDate = eventData.dateDebut.toDate();
    if (eventDate < new Date()) {
      throw new functions.https.HttpsError('invalid-argument', 'Event has already started');
    }

    const ticketRef = eventRef.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Ticket not found');
    }

    const ticketData = ticketDoc.data();

    if (!ticketData?.actif) {
      throw new functions.https.HttpsError('invalid-argument', 'Ticket is not available');
    }

    if (ticketData.quantiteDisponible < quantite) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Not enough tickets available. Only ${ticketData.quantiteDisponible} remaining`
      );
    }

    const existingBooking = await db
      .collection('bookings')
      .where('userId', '==', uid)
      .where('eventId', '==', eventId)
      .where('statut', 'in', ['pending', 'confirmed'])
      .get();

    if (!existingBooking.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You already have a booking for this event'
      );
    }

    const bookingRef = db.collection('bookings').doc();
    const bookingId = bookingRef.id;
    const montantTotal = ticketData.prix * quantite;

    let paymentId: string | null = null;
    let clientSecret: string | null = null;

    if (montantTotal > 0) {
      const paymentRef = db.collection('payments').doc();
      paymentId = paymentRef.id;

      const paymentIntent = await createPaymentIntent({
        amount: montantTotal,
        currency: 'usd',
        metadata: {
          bookingId,
          eventId,
          userId: uid,
          ticketId,
          quantity: quantite.toString(),
        },
      });

      await paymentRef.set({
        paymentId,
        bookingId,
        userId: uid,
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        montant: montantTotal,
        devise: 'USD',
        statut: 'pending',
        methode: 'card',
        datePaiement: FieldValue.serverTimestamp(),
      });

      clientSecret = paymentIntent.client_secret;
    }

    await db.runTransaction(async (transaction) => {
      const eventSnapshot = await transaction.get(eventRef);
      const eventCurrentData = eventSnapshot.data();

      if (!eventCurrentData || eventCurrentData.placesRestantes < quantite) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Not enough places available'
        );
      }

      transaction.update(eventRef, {
        placesRestantes: FieldValue.increment(-quantite),
      });

      const ticketSnapshot = await transaction.get(ticketRef);
      const ticketCurrentData = ticketSnapshot.data();

      if (!ticketCurrentData || ticketCurrentData.quantiteDisponible < quantite) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Not enough tickets available'
        );
      }

      transaction.update(ticketRef, {
        quantiteDisponible: FieldValue.increment(-quantite),
        quantiteVendue: FieldValue.increment(quantite),
      });

      transaction.set(bookingRef, {
        bookingId,
        userId: uid,
        eventId,
        ticketId,
        quantite,
        montantTotal,
        devise: 'USD',
        statut: 'pending',
        paymentId,
        dateReservation: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    functions.logger.info('Booking created', { bookingId, userId: uid, eventId, montantTotal });

    return {
      bookingId,
      clientSecret,
      paymentId,
      montantTotal,
      statut: 'pending',
    };
  } catch (error) {
    functions.logger.error('Error creating booking', { uid, eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create booking');
  }
});

export const confirmBooking = functions.https.onCall(async (data, context) => {
  functions.logger.info('confirmBooking called', { uid: context.auth?.uid, bookingId: data.bookingId });

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
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to confirm this booking');
    }

    if (bookingData?.statut !== 'pending') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Booking is already ${bookingData?.statut}`
      );
    }

    if (bookingData?.paymentId) {
      const paymentDoc = await db.collection('payments').doc(bookingData.paymentId).get();
      const paymentData = paymentDoc.data();

      if (paymentData?.statut !== 'succeeded') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Payment not completed'
        );
      }
    }

    await bookingRef.update({
      statut: 'confirmed',
      updatedAt: FieldValue.serverTimestamp(),
    });

    const eventDoc = await db.collection('events').doc(bookingData.eventId).get();
    const eventData = eventDoc.data();

    const ticketDoc = await db
      .collection('events')
      .doc(bookingData.eventId)
      .collection('tickets')
      .doc(bookingData.ticketId)
      .get();
    const ticketData = ticketDoc.data();

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    const ticketResult = await generateTicket({
      bookingId,
      eventId: bookingData.eventId,
      ticketId: bookingData.ticketId,
      userId: uid,
      ticketType: ticketData?.type || 'standard',
      eventTitle: eventData?.titre || 'Event',
      eventDate: eventData?.dateDebut?.toDate() || new Date(),
      eventVenue: eventData?.lieu || 'TBD',
      attendeeName: userData?.nom || 'Guest',
      quantity: bookingData.quantite,
      prix: bookingData.montantTotal / bookingData.quantite,
    });

    await bookingRef.update({
      qrCodeToken: ticketResult.qrCodeToken,
      qrCodeURL: ticketResult.qrCodeURL,
      pdfURL: ticketResult.pdfURL,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection('notifications').add({
      userId: uid,
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

    functions.logger.info('Booking confirmed', { bookingId });

    return {
      success: true,
      qrCodeURL: ticketResult.qrCodeURL,
      pdfURL: ticketResult.pdfURL,
    };
  } catch (error) {
    functions.logger.error('Error confirming booking', { bookingId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to confirm booking');
  }
});

export const cancelBooking = functions.https.onCall(async (data, context) => {
  functions.logger.info('cancelBooking called', { uid: context.auth?.uid, bookingId: data.bookingId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { bookingId, reason } = data;

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
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to cancel this booking');
    }

    if (bookingData?.statut === 'cancelled' || bookingData?.statut === 'refunded') {
      throw new functions.https.HttpsError('invalid-argument', 'Booking is already cancelled');
    }

    const eventRef = db.collection('events').doc(bookingData.eventId);
    const eventDoc = await eventRef.get();
    const eventData = eventDoc.data();

    const hoursUntilEvent = (eventData?.dateDebut.toDate().getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 24 && bookingData?.statut === 'confirmed') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot cancel within 24 hours of the event'
      );
    }

    let refundInitiated = false;

    await db.runTransaction(async (transaction) => {
      transaction.update(bookingRef, {
        statut: 'cancelled',
        cancelledReason: reason || 'user_requested',
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(eventRef, {
        placesRestantes: FieldValue.increment(bookingData.quantite),
      });

      const ticketRef = eventRef.collection('tickets').doc(bookingData.ticketId);
      transaction.update(ticketRef, {
        quantiteDisponible: FieldValue.increment(bookingData.quantite),
        quantiteVendue: FieldValue.increment(-bookingData.quantite),
      });
    });

    if (bookingData?.paymentId && bookingData?.statut === 'confirmed') {
      try {
        const paymentDoc = await db.collection('payments').doc(bookingData.paymentId).get();
        const paymentData = paymentDoc.data();

        if (paymentData?.stripePaymentIntentId) {
          const { createRefund } = await import('./utils/stripe');
          await createRefund(paymentData.stripePaymentIntentId);

          await db.collection('payments').doc(bookingData.paymentId).update({
            statut: 'refunded',
          });

          refundInitiated = true;
        }
      } catch (refundError) {
        functions.logger.error('Error processing refund', { bookingId, error: refundError });
      }
    }

    const userDoc = await db.collection('users').doc(uid).get();

    await db.collection('notifications').add({
      userId: uid,
      titre: 'Booking Cancelled',
      corps: `Your booking for ${eventData?.titre} has been cancelled.`,
      type: 'cancellation',
      data: { bookingId, eventId: bookingData.eventId },
      lue: false,
      envoyeAt: FieldValue.serverTimestamp(),
    });

    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Booking Cancelled',
            body: `Your booking for ${eventData?.titre} has been cancelled.${refundInitiated ? ' Refund initiated.' : ''}`,
          },
          data: {
            type: 'cancellation',
            bookingId,
          },
        });
      } catch (notifError) {
        functions.logger.error('Failed to send FCM notification', { error: notifError });
      }
    }

    functions.logger.info('Booking cancelled', { bookingId, refundInitiated });

    return {
      success: true,
      refundInitiated,
    };
  } catch (error) {
    functions.logger.error('Error cancelling booking', { bookingId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to cancel booking');
  }
});

export const getUserBookings = functions.https.onCall(async (data, context) => {
  functions.logger.info('getUserBookings called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { statut, limit = 20 } = data;

  try {
    let query: FirebaseFirestore.Query = db
      .collection('bookings')
      .where('userId', '==', uid)
      .orderBy('dateReservation', 'desc');

    if (statut) {
      query = query.where('statut', '==', statut);
    }

    const bookingsSnapshot = await query.limit(limit).get();

    const bookings: admin.firestore.DocumentData[] = [];

    for (const bookingDoc of bookingsSnapshot.docs) {
      const bookingData = bookingDoc.data();

      const eventDoc = await db.collection('events').doc(bookingData.eventId).get();
      const eventData = eventDoc.data();

      let ticketData = null;
      if (bookingData.ticketId) {
        const ticketDoc = await db
          .collection('events')
          .doc(bookingData.eventId)
          .collection('tickets')
          .doc(bookingData.ticketId)
          .get();
        ticketData = ticketDoc.data();
      }

      bookings.push({
        id: bookingDoc.id,
        ...bookingData,
        event: eventData ? {
          id: eventDoc.id,
          titre: eventData.titre,
          lieu: eventData.lieu,
          dateDebut: eventData.dateDebut,
          dateFin: eventData.dateFin,
          imageURL: eventData.imageURL,
          statut: eventData.statut,
        } : null,
        ticket: ticketData ? {
          id: bookingData.ticketId,
          type: ticketData.type,
          prix: ticketData.prix,
        } : null,
      });
    }

    functions.logger.info('User bookings retrieved', { uid, count: bookings.length });

    return { bookings };
  } catch (error) {
    functions.logger.error('Error getting user bookings', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get bookings');
  }
});

export const getBookingDetails = functions.https.onCall(async (data, context) => {
  functions.logger.info('getBookingDetails called', { uid: context.auth?.uid, bookingId: data.bookingId });

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
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.data()?.role !== 'admin' && userDoc.data()?.role !== 'organisateur') {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to view this booking');
      }
    }

    const eventDoc = await db.collection('events').doc(bookingData.eventId).get();
    const eventData = eventDoc.data();

    const ticketDoc = await db
      .collection('events')
      .doc(bookingData.eventId)
      .collection('tickets')
      .doc(bookingData.ticketId)
      .get();
    const ticketData = ticketDoc.data();

    functions.logger.info('Booking details retrieved', { bookingId });

    return {
      booking: {
        id: bookingDoc.id,
        ...bookingData,
      },
      event: {
        id: eventDoc.id,
        ...eventData,
      },
      ticket: {
        id: ticketDoc.id,
        ...ticketData,
      },
    };
  } catch (error) {
    functions.logger.error('Error getting booking details', { bookingId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get booking details');
  }
});

export const getEventAttendees = functions.https.onCall(async (data, context) => {
  functions.logger.info('getEventAttendees called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId, limit = 50 } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();

    if (eventData?.organisateurId !== uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to view attendees');
      }
    }

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('eventId', '==', eventId)
      .where('statut', 'in', ['confirmed', 'used'])
      .limit(limit)
      .get();

    const attendees: admin.firestore.DocumentData[] = [];

    for (const bookingDoc of bookingsSnapshot.docs) {
      const bookingData = bookingDoc.data();

      const userDoc = await db.collection('users').doc(bookingData.userId).get();
      const userData = userDoc.data();

      const ticketDoc = await db
        .collection('events')
        .doc(eventId)
        .collection('tickets')
        .doc(bookingData.ticketId)
        .get();
      const ticketData = ticketDoc.data();

      attendees.push({
        bookingId: bookingDoc.id,
        userId: bookingData.userId,
        attendeeName: userData?.nom || 'Unknown',
        email: userData?.email || '',
        ticketType: ticketData?.type || 'standard',
        quantity: bookingData.quantite,
        scanned: bookingData.statut === 'used',
        scannedAt: bookingData.scannedAt,
      });
    }

    functions.logger.info('Event attendees retrieved', { eventId, count: attendees.length });

    return { attendees, total: attendees.length };
  } catch (error) {
    functions.logger.error('Error getting event attendees', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get attendees');
  }
});
