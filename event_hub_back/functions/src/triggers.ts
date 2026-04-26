import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

export const onBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snapshot, context) => {
    functions.logger.info('Booking created', { bookingId: context.params.bookingId });
    
    const bookingData = snapshot.data();
    const { eventId } = bookingData;

    try {
      const eventDoc = await db.collection('events').doc(eventId).get();
      const eventData = eventDoc.data();

      if (eventData?.organisateurId) {
        await db.collection('notifications').add({
          userId: eventData.organisateurId,
          titre: 'New Booking! 🎫',
          corps: `Someone just booked tickets for ${eventData.titre}`,
          type: 'booking_confirmed',
          data: { bookingId: context.params.bookingId, eventId },
          lue: false,
          envoyeAt: FieldValue.serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error) {
      functions.logger.error('Error in onBookingCreated', { error });
      return null;
    }
  });

export const onEventCompleted = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before?.statut !== 'completed' && after?.statut === 'completed') {
      functions.logger.info('Event marked as completed', { eventId: context.params.eventId });

      try {
        const bookingsSnapshot = await db
          .collection('bookings')
          .where('eventId', '==', context.params.eventId)
          .where('statut', '==', 'confirmed')
          .get();

        for (const bookingDoc of bookingsSnapshot.docs) {
          await bookingDoc.ref.update({
            statut: 'used',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        functions.logger.info('All bookings marked as used', {
          eventId: context.params.eventId,
          count: bookingsSnapshot.size,
        });
      } catch (error) {
        functions.logger.error('Error marking bookings as used', { error });
      }
    }

    return null;
  });

export const onReviewCreated = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snapshot, context) => {
    functions.logger.info('Review created', { reviewId: context.params.reviewId });
    
    const reviewData = snapshot.data();
    const { eventId } = reviewData;

    try {
      const eventDoc = await db.collection('events').doc(eventId).get();
      const eventData = eventDoc.data();

      if (eventData?.organisateurId) {
        await db.collection('notifications').add({
          userId: eventData.organisateurId,
          titre: 'New Review ⭐',
          corps: `Someone left a ${reviewData.note}-star review for ${eventData.titre}`,
          type: 'ticket_ready',
          data: { reviewId: context.params.reviewId, eventId },
          lue: false,
          envoyeAt: FieldValue.serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error) {
      functions.logger.error('Error in onReviewCreated', { error });
      return null;
    }
  });

export const cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    functions.logger.info('Running notification cleanup');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = await db
        .collection('notifications')
        .where('envoyeAt', '<=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(500)
        .get();

      const batch = db.batch();
      oldNotifications.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      functions.logger.info('Old notifications cleaned up', { count: oldNotifications.size });

      return null;
    } catch (error) {
      functions.logger.error('Error cleaning up notifications', { error });
      throw error;
    }
  });

export const markEventsCompleted = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    functions.logger.info('Running event completion check');

    try {
      const now = admin.firestore.Timestamp.now();

      const completedEvents = await db
        .collection('events')
        .where('dateFin', '<=', now)
        .where('statut', '==', 'published')
        .limit(100)
        .get();

      const batch = db.batch();

      for (const eventDoc of completedEvents.docs) {
        batch.update(eventDoc.ref, {
          statut: 'completed',
          estPublie: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      if (!completedEvents.empty) {
        await batch.commit();
      }

      functions.logger.info('Events marked as completed', { count: completedEvents.size });

      return null;
    } catch (error) {
      functions.logger.error('Error marking events as completed', { error });
      throw error;
    }
  });
