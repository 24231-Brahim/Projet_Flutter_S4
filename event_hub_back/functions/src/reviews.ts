import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateCreateReview } from './utils/validators';

const db = admin.firestore();

export const createReview = functions.https.onCall(async (data, context) => {
  functions.logger.info('createReview called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const validatedData = validateCreateReview(data);
  const { eventId, note, commentaire } = validatedData;

  try {
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();

    const existingReview = await db
      .collection('reviews')
      .where('userId', '==', uid)
      .where('eventId', '==', eventId)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      throw new functions.https.HttpsError('already-exists', 'You have already reviewed this event');
    }

    const bookingQuery = await db
      .collection('bookings')
      .where('userId', '==', uid)
      .where('eventId', '==', eventId)
      .where('statut', 'in', ['confirmed', 'used'])
      .limit(1)
      .get();

    const eventDate = eventData?.dateDebut.toDate();
    const now = new Date();

    if (bookingQuery.empty && eventDate > now) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must have attended this event to review it'
      );
    }

    const reviewRef = db.collection('reviews').doc();
    const reviewId = reviewRef.id;

    const reviewData = {
      reviewId,
      userId: uid,
      eventId,
      note,
      commentaire: commentaire || '',
      verifie: !bookingQuery.empty || eventDate < now,
      createdAt: FieldValue.serverTimestamp(),
    };

    await reviewRef.set(reviewData);

    await updateEventAverageRating(eventId);

    functions.logger.info('Review created', { reviewId, eventId, note });

    return { reviewId, success: true };
  } catch (error) {
    functions.logger.error('Error creating review', { uid, eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create review');
  }
});

async function updateEventAverageRating(eventId: string): Promise<void> {
  const reviewsSnapshot = await db
    .collection('reviews')
    .where('eventId', '==', eventId)
    .get();

  if (reviewsSnapshot.empty) {
    return;
  }

  let totalNote = 0;
  let verifieCount = 0;

  reviewsSnapshot.forEach(doc => {
    const data = doc.data();
    totalNote += data.note;
    if (data.verifie) verifieCount++;
  });

  const averageNote = totalNote / reviewsSnapshot.size;

  await db.collection('events').doc(eventId).update({
    averageRating: Math.round(averageNote * 10) / 10,
    reviewCount: reviewsSnapshot.size,
    verifieReviewCount: verifieCount,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export const updateReview = functions.https.onCall(async (data, context) => {
  functions.logger.info('updateReview called', { uid: context.auth?.uid, reviewId: data.reviewId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { reviewId, note, commentaire } = data;

  if (!reviewId) {
    throw new functions.https.HttpsError('invalid-argument', 'Review ID is required');
  }

  try {
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Review not found');
    }

    const reviewData = reviewDoc.data();

    if (reviewData?.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this review');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (note !== undefined) updateData.note = note;
    if (commentaire !== undefined) updateData.commentaire = commentaire;

    await reviewRef.update(updateData);

    await updateEventAverageRating(reviewData.eventId);

    functions.logger.info('Review updated', { reviewId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating review', { reviewId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to update review');
  }
});

export const deleteReview = functions.https.onCall(async (data, context) => {
  functions.logger.info('deleteReview called', { uid: context.auth?.uid, reviewId: data.reviewId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { reviewId } = data;

  if (!reviewId) {
    throw new functions.https.HttpsError('invalid-argument', 'Review ID is required');
  }

  try {
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Review not found');
    }

    const reviewData = reviewDoc.data()!;

    const userDoc = await db.collection('users').doc(uid).get();
    const userRole = userDoc.data()?.role;

    if (reviewData.userId !== uid && userRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to delete this review');
    }

    const eventId = reviewData.eventId;

    await reviewRef.delete();

    await updateEventAverageRating(eventId);

    functions.logger.info('Review deleted', { reviewId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error deleting review', { reviewId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to delete review');
  }
});

export const getEventReviews = functions.https.onCall(async (data) => {
  functions.logger.info('getEventReviews called', { eventId: data.eventId });

  const { eventId, limit = 20, cursor } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    let query: FirebaseFirestore.Query = db
      .collection('reviews')
      .where('eventId', '==', eventId)
      .orderBy('createdAt', 'desc');

    if (cursor) {
      const cursorDoc = await db.collection('reviews').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get();

    const reviews: admin.firestore.DocumentData[] = [];
    let nextCursor: string | null = null;

    for (const doc of snapshot.docs) {
      const reviewData = doc.data();
      
      const userDoc = await db.collection('users').doc(reviewData.userId).get();
      const userData = userDoc.data();

      if (reviews.length < limit) {
        reviews.push({
          id: doc.id,
          ...reviewData,
          user: {
            id: userDoc.id,
            nom: userData?.nom,
            photoURL: userData?.photoURL,
          },
        });
      } else {
        nextCursor = doc.id;
      }
    }

    const statsSnapshot = await db
      .collection('reviews')
      .where('eventId', '==', eventId)
      .get();

    let totalNote = 0;
    const noteDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    statsSnapshot.forEach(doc => {
      const note = doc.data().note;
      totalNote += note;
      noteDistribution[note]++;
    });

    const averageRating = statsSnapshot.empty ? 0 : totalNote / statsSnapshot.size;

    functions.logger.info('Event reviews retrieved', { eventId, count: reviews.length });

    return {
      reviews,
      nextCursor,
      stats: {
        totalReviews: statsSnapshot.size,
        averageRating: Math.round(averageRating * 10) / 10,
        distribution: noteDistribution,
      },
    };
  } catch (error) {
    functions.logger.error('Error getting event reviews', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get reviews');
  }
});

export const getUserReviews = functions.https.onCall(async (data, context) => {
  functions.logger.info('getUserReviews called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { limit = 20 } = data;

  try {
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const reviews: admin.firestore.DocumentData[] = [];

    for (const doc of reviewsSnapshot.docs) {
      const reviewData = doc.data();

      const eventDoc = await db.collection('events').doc(reviewData.eventId).get();
      const eventData = eventDoc.data();

      reviews.push({
        id: doc.id,
        ...reviewData,
        event: eventData ? {
          id: eventDoc.id,
          titre: eventData.titre,
          imageURL: eventData.imageURL,
          dateDebut: eventData.dateDebut,
        } : null,
      });
    }

    functions.logger.info('User reviews retrieved', { uid, count: reviews.length });

    return { reviews };
  } catch (error) {
    functions.logger.error('Error getting user reviews', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get reviews');
  }
});

export const reportReview = functions.https.onCall(async (data, context) => {
  functions.logger.info('reportReview called', { uid: context.auth?.uid, reviewId: data.reviewId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { reviewId, reason } = data;

  if (!reviewId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'Review ID and reason are required');
  }

  try {
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Review not found');
    }

    await db.collection('reviewReports').add({
      reviewId,
      reportedBy: uid,
      reason,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Review reported', { reviewId, reason });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error reporting review', { reviewId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to report review');
  }
});
