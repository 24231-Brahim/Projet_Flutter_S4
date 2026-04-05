import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { validateCreateEvent, validateEventFilters, validateSearchEvents } from './utils/validators';

const db = admin.firestore();

async function checkUserRole(uid: string): Promise<string> {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  return userDoc.data()?.role || 'user';
}

export const createEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('createEvent called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const role = await checkUserRole(uid);

  if (role !== 'organisateur' && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only organizers can create events');
  }

  const validatedData = validateCreateEvent(data);

  if (validatedData.dateFin <= validatedData.dateDebut) {
    throw new functions.https.HttpsError('invalid-argument', 'End date must be after start date');
  }

  if (validatedData.dateDebut <= Date.now()) {
    throw new functions.https.HttpsError('invalid-argument', 'Start date must be in the future');
  }

  try {
    const eventRef = db.collection('events').doc();
    const eventId = eventRef.id;

    const localisation = validatedData.latitude && validatedData.longitude
      ? new GeoPoint(validatedData.latitude, validatedData.longitude)
      : undefined;

    const eventData = {
      eventId,
      organisateurId: uid,
      titre: validatedData.titre,
      description: validatedData.description,
      categorie: validatedData.categorie,
      imageURL: validatedData.imageURL || '',
      lieu: validatedData.lieu,
      localisation,
      dateDebut: Timestamp.fromDate(new Date(validatedData.dateDebut)),
      dateFin: Timestamp.fromDate(new Date(validatedData.dateFin)),
      capaciteTotale: validatedData.capaciteTotale,
      placesRestantes: validatedData.capaciteTotale,
      estPublie: false,
      statut: 'draft' as const,
      tags: validatedData.tags,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await eventRef.set(eventData);

    functions.logger.info('Event created', { eventId, organisateurId: uid });

    return { eventId, success: true };
  } catch (error) {
    functions.logger.error('Error creating event', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create event');
  }
});

export const updateEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('updateEvent called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId, ...updates } = data;

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
      const role = await checkUserRole(uid);
      if (role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this event');
      }
    }

    if (eventData?.statut === 'cancelled' || eventData?.statut === 'completed') {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot update cancelled or completed events');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updates.titre) updateData.titre = updates.titre;
    if (updates.description) updateData.description = updates.description;
    if (updates.categorie) updateData.categorie = updates.categorie;
    if (updates.imageURL !== undefined) updateData.imageURL = updates.imageURL;
    if (updates.lieu) updateData.lieu = updates.lieu;
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      updateData.localisation = new GeoPoint(updates.latitude, updates.longitude);
    }
    if (updates.dateDebut) updateData.dateDebut = Timestamp.fromDate(new Date(updates.dateDebut));
    if (updates.dateFin) updateData.dateFin = Timestamp.fromDate(new Date(updates.dateFin));
    if (updates.capaciteTotale !== undefined) updateData.capaciteTotale = updates.capaciteTotale;
    if (updates.tags) updateData.tags = updates.tags;

    await eventRef.update(updateData);

    functions.logger.info('Event updated', { eventId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating event', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to update event');
  }
});

export const publishEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('publishEvent called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId } = data;

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
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to publish this event');
    }

    const ticketsSnapshot = await eventRef.collection('tickets')
      .where('actif', '==', true)
      .limit(1)
      .get();

    if (ticketsSnapshot.empty) {
      throw new functions.https.HttpsError('invalid-argument', 'Event must have at least one active ticket before publishing');
    }

    await eventRef.update({
      estPublie: true,
      statut: 'published',
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Event published', { eventId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error publishing event', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to publish event');
  }
});

export const cancelEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('cancelEvent called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId, reason } = data;

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
      const role = await checkUserRole(uid);
      if (role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to cancel this event');
      }
    }

    if (eventData?.statut === 'cancelled' || eventData?.statut === 'completed') {
      throw new functions.https.HttpsError('invalid-argument', 'Event is already cancelled or completed');
    }

    await db.runTransaction(async (transaction) => {
      transaction.update(eventRef, {
        statut: 'cancelled',
        estPublie: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const confirmedBookings = await transaction.get(
        db.collection('bookings')
          .where('eventId', '==', eventId)
          .where('statut', '==', 'confirmed')
      );

      for (const bookingDoc of confirmedBookings.docs) {
        transaction.update(bookingDoc.ref, {
          statut: 'cancelled',
          cancelledReason: reason || 'event_cancelled',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    const confirmedBookings = await db
      .collection('bookings')
      .where('eventId', '==', eventId)
      .where('statut', '==', 'confirmed')
      .get();

    const userIds = [...new Set(confirmedBookings.docs.map(doc => doc.data().userId))];

    for (const userId of userIds) {
      const userDoc = await db.collection('users').doc(userId).get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: 'Event Cancelled',
              body: `${eventData?.titre} has been cancelled. Check your bookings for refund information.`,
            },
            data: {
              type: 'cancellation',
              eventId,
            },
          });
        } catch (notifError) {
          functions.logger.error('Failed to send cancellation notification', { userId, error: notifError });
        }
      }

      await db.collection('notifications').add({
        userId,
        titre: 'Event Cancelled',
        corps: `${eventData?.titre} has been cancelled. Refunds will be processed automatically.`,
        type: 'cancellation',
        data: { eventId },
        lue: false,
        envoyeAt: FieldValue.serverTimestamp(),
      });
    }

    functions.logger.info('Event cancelled', { eventId, affectedBookings: confirmedBookings.size });

    return { success: true, cancelledBookings: confirmedBookings.size };
  } catch (error) {
    functions.logger.error('Error cancelling event', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to cancel event');
  }
});

export const deleteEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('deleteEvent called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId } = data;

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

    const role = await checkUserRole(uid);

    if (eventData?.organisateurId !== uid && role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to delete this event');
    }

    if (eventData?.statut === 'published') {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot delete a published event. Cancel it first.');
    }

    const batch = db.batch();
    
    const ticketsSnapshot = await eventRef.collection('tickets').listDocuments();
    for (const ticketDoc of ticketsSnapshot) {
      batch.delete(ticketDoc);
    }
    
    batch.delete(eventRef);
    
    await batch.commit();

    functions.logger.info('Event deleted', { eventId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error deleting event', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to delete event');
  }
});

export const getUpcomingEvents = functions.https.onCall(async (data) => {
  functions.logger.info('getUpcomingEvents called', { filters: data });

  try {
    const filters = validateEventFilters(data);
    const now = Timestamp.now();

    let query: FirebaseFirestore.Query = db
      .collection('events')
      .where('estPublie', '==', true)
      .where('dateDebut', '>=', filters.startDate ? Timestamp.fromDate(new Date(filters.startDate)) : now)
      .orderBy('dateDebut', 'asc');

    if (filters.categorie) {
      query = query.where('categorie', '==', filters.categorie);
    }

    if (filters.endDate) {
      query = query.where('dateDebut', '<=', Timestamp.fromDate(new Date(filters.endDate)));
    }

    query = query.limit(filters.limit + 1);

    if (filters.cursor) {
      const cursorDoc = await db.collection('events').doc(filters.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();

    const events: admin.firestore.DocumentData[] = [];
    let nextCursor: string | null = null;

    snapshot.docs.forEach((doc, index) => {
      if (index < filters.limit) {
        events.push({ id: doc.id, ...doc.data() });
      } else {
        nextCursor = doc.id;
      }
    });

    const eventIds = events.map(e => e.eventId);

    const ticketsSnapshot = await db
      .collectionGroup('tickets')
      .where('eventId', 'in', eventIds.length > 10 ? eventIds.slice(0, 10) : eventIds)
      .where('actif', '==', true)
      .get();

    const ticketMap = new Map<string, number>();
    ticketsSnapshot.forEach(doc => {
      const ticketData = doc.data();
      const existing = ticketMap.get(ticketData.eventId);
      const minPrice = ticketData.prix;
      if (!existing || minPrice < existing) {
        ticketMap.set(ticketData.eventId, minPrice);
      }
    });

    const eventsWithPrice = events.map(event => ({
      ...event,
      prixMin: ticketMap.get(event.eventId) || 0,
    }));

    functions.logger.info('Upcoming events retrieved', { count: eventsWithPrice.length });

    return { events: eventsWithPrice, nextCursor };
  } catch (error) {
    functions.logger.error('Error getting upcoming events', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get upcoming events');
  }
});

export const searchEvents = functions.https.onCall(async (data) => {
  functions.logger.info('searchEvents called', { query: data.query });

  try {
    const validated = validateSearchEvents(data);
    const { query, latitude, longitude, radiusKm, limit } = validated;

    let eventsRef = db.collection('events')
      .where('estPublie', '==', true)
      .where('statut', '==', 'published')
      .where('dateDebut', '>=', Timestamp.now());

    if (latitude !== undefined && longitude !== undefined && radiusKm) {
      const radiusRad = radiusKm / 6371;
      const latDelta = radiusRad * (180 / Math.PI);
      const lonDelta = radiusRad * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);

      eventsRef = eventsRef
        .where('localisation.latitude', '>=', latitude - latDelta)
        .where('localisation.latitude', '<=', latitude + latDelta)
        .where('localisation.longitude', '>=', longitude - lonDelta)
        .where('localisation.longitude', '<=', longitude + lonDelta);
    }

    const snapshot = await eventsRef.limit(limit * 2).get();

    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const scoredEvents: { event: admin.firestore.DocumentData; score: number }[] = [];

    snapshot.forEach(doc => {
      const eventData = doc.data();
      const titleLower = (eventData.titre || '').toLowerCase();
      const descLower = (eventData.description || '').toLowerCase();

      let score = 0;
      for (const term of searchTerms) {
        if (titleLower.includes(term)) score += 10;
        if (descLower.includes(term)) score += 5;
        if (eventData.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 3;
      }

      if (score > 0) {
        scoredEvents.push({ event: { id: doc.id, ...eventData }, score });
      }
    });

    scoredEvents.sort((a, b) => b.score - a.score);

    const results = scoredEvents.slice(0, limit).map(e => e.event);

    functions.logger.info('Search completed', { query, results: results.length });

    return { events: results };
  } catch (error) {
    functions.logger.error('Error searching events', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to search events');
  }
});

export const getEventDetails = functions.https.onCall(async (data, context) => {
  functions.logger.info('getEventDetails called', { eventId: data.eventId });

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();

    if (!eventData?.estPublie && (!context.auth || context.auth.uid !== eventData?.organisateurId)) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const ticketsSnapshot = await db
      .collection('events')
      .doc(eventId)
      .collection('tickets')
      .where('actif', '==', true)
      .get();

    const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let isFavorite = false;
    if (context.auth) {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      isFavorite = userDoc.data()?.favoris?.includes(eventId) || false;
    }

    const reviewsSnapshot = await db
      .collection('reviews')
      .where('eventId', '==', eventId)
      .limit(5)
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let averageRating = 0;
    if (!reviewsSnapshot.empty) {
      const total = reviewsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().note || 0), 0);
      averageRating = total / reviewsSnapshot.size;
    }

    functions.logger.info('Event details retrieved', { eventId });

    return {
      event: { id: eventDoc.id, ...eventData },
      tickets,
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      isFavorite,
    };
  } catch (error) {
    functions.logger.error('Error getting event details', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get event details');
  }
});

export const getOrganizerEvents = functions.https.onCall(async (data, context) => {
  functions.logger.info('getOrganizerEvents called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { statut, limit = 20 } = data;

  try {
    const role = await checkUserRole(uid);

    if (role !== 'organisateur' && role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only organizers can access this');
    }

    let query: FirebaseFirestore.Query = db
      .collection('events')
      .where('organisateurId', '==', uid)
      .orderBy('createdAt', 'desc');

    if (statut) {
      query = query.where('statut', '==', statut);
    }

    const snapshot = await query.limit(limit).get();

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    functions.logger.info('Organizer events retrieved', { uid, count: events.length });

    return { events };
  } catch (error) {
    functions.logger.error('Error getting organizer events', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get organizer events');
  }
});
