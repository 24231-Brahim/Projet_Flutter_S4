import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

async function checkAdminRole(uid: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.data()?.role === 'admin';
}

export const verifyOrganisateur = functions.https.onCall(async (data, context) => {
  functions.logger.info('verifyOrganisateur called', { uid: context.auth?.uid, targetUid: data.targetUid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target user ID is required');
  }

  try {
    const targetUserRef = db.collection('users').doc(targetUid);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    await targetUserRef.update({
      role: 'organisateur',
      verifie: true,
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await admin.messaging().send({
      token: targetUserDoc.data()?.fcmToken || '',
      notification: {
        title: 'Account Verified! 🎉',
        body: 'Your organizer account has been verified. You can now create events!',
      },
      data: { type: 'verification' },
    }).catch(() => {});

    functions.logger.info('Organisateur verified', { targetUid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error verifying organisateur', { targetUid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to verify organizer');
  }
});

export const revokeOrganisateurStatus = functions.https.onCall(async (data, context) => {
  functions.logger.info('revokeOrganisateurStatus called', { uid: context.auth?.uid, targetUid: data.targetUid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target user ID is required');
  }

  try {
    await db.collection('users').doc(targetUid).update({
      role: 'user',
      verifie: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Organisateur status revoked', { targetUid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error revoking organisateur status', { targetUid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to revoke organizer status');
  }
});

export const getDashboardStats = functions.https.onCall(async (data, context) => {
  functions.logger.info('getDashboardStats called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    const eventsSnapshot = await db.collection('events').count().get();
    const totalEvents = eventsSnapshot.data().count;

    const bookingsSnapshot = await db.collection('bookings').count().get();
    const totalBookings = bookingsSnapshot.data().count;

    const confirmedBookingsSnapshot = await db
      .collection('bookings')
      .where('statut', '==', 'confirmed')
      .count()
      .get();
    const confirmedBookings = confirmedBookingsSnapshot.data().count;

    const paymentsSnapshot = await db
      .collection('payments')
      .where('statut', '==', 'succeeded')
      .get();

    let totalRevenue = 0;
    paymentsSnapshot.forEach(doc => {
      totalRevenue += doc.data().montant || 0;
    });

    const now = new Date();

    const monthlyStats: {
      month: string;
      users: number;
      events: number;
      bookings: number;
      revenue: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const usersMonthSnapshot = await db
        .collection('users')
        .where('createdAt', '>=', Timestamp.fromDate(monthStart))
        .where('createdAt', '<=', Timestamp.fromDate(monthEnd))
        .count()
        .get();

      const eventsMonthSnapshot = await db
        .collection('events')
        .where('createdAt', '>=', Timestamp.fromDate(monthStart))
        .where('createdAt', '<=', Timestamp.fromDate(monthEnd))
        .count()
        .get();

      const bookingsMonthSnapshot = await db
        .collection('bookings')
        .where('dateReservation', '>=', Timestamp.fromDate(monthStart))
        .where('dateReservation', '<=', Timestamp.fromDate(monthEnd))
        .count()
        .get();

      const paymentsMonthSnapshot = await db
        .collection('payments')
        .where('statut', '==', 'succeeded')
        .where('datePaiement', '>=', Timestamp.fromDate(monthStart))
        .where('datePaiement', '<=', Timestamp.fromDate(monthEnd))
        .get();

      let monthRevenue = 0;
      paymentsMonthSnapshot.forEach(doc => {
        monthRevenue += doc.data().montant || 0;
      });

      monthlyStats.push({
        month: monthLabel,
        users: usersMonthSnapshot.data().count,
        events: eventsMonthSnapshot.data().count,
        bookings: bookingsMonthSnapshot.data().count,
        revenue: monthRevenue,
      });
    }

    const roleStats: Record<string, number> = {
      user: 0,
      organisateur: 0,
      admin: 0,
    };

    const rolesSnapshot = await db.collection('users').get();
    rolesSnapshot.forEach(doc => {
      const role = doc.data().role;
      if (role) roleStats[role]++;
    });

    const eventStats: Record<string, number> = {
      draft: 0,
      published: 0,
      cancelled: 0,
      completed: 0,
    };

    const eventStatusSnapshot = await db.collection('events').get();
    eventStatusSnapshot.forEach(doc => {
      const statut = doc.data().statut;
      if (statut) eventStats[statut]++;
    });

    functions.logger.info('Dashboard stats retrieved');

    return {
      totalUsers,
      totalEvents,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      monthlyStats,
      roleStats,
      eventStats,
    };
  } catch (error) {
    functions.logger.error('Error getting dashboard stats', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get dashboard stats');
  }
});

export const getAllUsers = functions.https.onCall(async (data, context) => {
  functions.logger.info('getAllUsers called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { role, limit = 50, cursor } = data;

  try {
    let query: FirebaseFirestore.Query = db.collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }

    query = query.orderBy('createdAt', 'desc');

    if (cursor) {
      const cursorDoc = await db.collection('users').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get();

    const users: admin.firestore.DocumentData[] = [];
    let nextCursor: string | null = null;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      delete userData.fcmToken;

      if (users.length < limit) {
        users.push({ id: doc.id, ...userData });
      } else {
        nextCursor = doc.id;
      }
    }

    functions.logger.info('All users retrieved', { count: users.length });

    return { users, nextCursor };
  } catch (error) {
    functions.logger.error('Error getting all users', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get users');
  }
});

export const getAllEvents = functions.https.onCall(async (data, context) => {
  functions.logger.info('getAllEvents called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { statut, limit = 50, cursor } = data;

  try {
    let query: FirebaseFirestore.Query = db.collection('events');

    if (statut) {
      query = query.where('statut', '==', statut);
    }

    query = query.orderBy('createdAt', 'desc');

    if (cursor) {
      const cursorDoc = await db.collection('events').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get();

    const events: admin.firestore.DocumentData[] = [];
    let nextCursor: string | null = null;

    for (const doc of snapshot.docs) {
      if (events.length < limit) {
        events.push({ id: doc.id, ...doc.data() });
      } else {
        nextCursor = doc.id;
      }
    }

    functions.logger.info('All events retrieved', { count: events.length });

    return { events, nextCursor };
  } catch (error) {
    functions.logger.error('Error getting all events', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get events');
  }
});

export const forceDeleteUser = functions.https.onCall(async (data, context) => {
  functions.logger.info('forceDeleteUser called', { uid: context.auth?.uid, targetUid: data.targetUid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { targetUid } = data;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target user ID is required');
  }

  if (targetUid === uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot delete your own account');
  }

  try {
    const userDoc = await db.collection('users').doc(targetUid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const batch = db.batch();

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', targetUid)
      .get();

    for (const bookingDoc of bookingsSnapshot.docs) {
      batch.update(bookingDoc.ref, {
        statut: 'cancelled',
        cancelledReason: 'admin_deleted',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    batch.delete(userDoc.ref);

    await batch.commit();

    try {
      await admin.auth().deleteUser(targetUid);
    } catch (authError) {
      functions.logger.warn('Could not delete Auth user', { targetUid, error: authError });
    }

    functions.logger.info('User force deleted', { targetUid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error force deleting user', { targetUid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

export const createCategory = functions.https.onCall(async (data, context) => {
  functions.logger.info('createCategory called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { nom, icone, couleur } = data;

  if (!nom || !icone || !couleur) {
    throw new functions.https.HttpsError('invalid-argument', 'Name, icon, and color are required');
  }

  try {
    const categoryRef = db.collection('categories').doc();
    const categoryId = categoryRef.id;

    await categoryRef.set({
      categoryId,
      nom,
      icone,
      couleur,
      createdAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Category created', { categoryId, nom });

    return { categoryId, success: true };
  } catch (error) {
    functions.logger.error('Error creating category', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to create category');
  }
});

export const getCategories = functions.https.onCall(async () => {
  functions.logger.info('getCategories called');

  try {
    const snapshot = await db.collection('categories').orderBy('nom').get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    functions.logger.info('Categories retrieved', { count: categories.length });

    return { categories };
  } catch (error) {
    functions.logger.error('Error getting categories', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get categories');
  }
});

export const deleteCategory = functions.https.onCall(async (data, context) => {
  functions.logger.info('deleteCategory called', { uid: context.auth?.uid, categoryId: data.categoryId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  if (!(await checkAdminRole(uid))) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { categoryId } = data;

  if (!categoryId) {
    throw new functions.https.HttpsError('invalid-argument', 'Category ID is required');
  }

  try {
    await db.collection('categories').doc(categoryId).delete();

    functions.logger.info('Category deleted', { categoryId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error deleting category', { categoryId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to delete category');
  }
});

export const addToFavorites = functions.https.onCall(async (data, context) => {
  functions.logger.info('addToFavorites called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    await db.collection('users').doc(uid).update({
      favoris: FieldValue.arrayUnion(eventId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Added to favorites', { uid, eventId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error adding to favorites', { uid, eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to add to favorites');
  }
});

export const removeFromFavorites = functions.https.onCall(async (data, context) => {
  functions.logger.info('removeFromFavorites called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    await db.collection('users').doc(uid).update({
      favoris: FieldValue.arrayRemove(eventId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('Removed from favorites', { uid, eventId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error removing from favorites', { uid, eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to remove from favorites');
  }
});

export const getFavorites = functions.https.onCall(async (data, context) => {
  functions.logger.info('getFavorites called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const favoris = userDoc.data()?.favoris || [];

    if (favoris.length === 0) {
      return { events: [] };
    }

    const events: admin.firestore.DocumentData[] = [];

    for (const eventId of favoris) {
      const eventDoc = await db.collection('events').doc(eventId).get();
      if (eventDoc.exists && eventDoc.data()?.estPublie) {
        events.push({ id: eventDoc.id, ...eventDoc.data() });
      }
    }

    functions.logger.info('Favorites retrieved', { uid, count: events.length });

    return { events };
  } catch (error) {
    functions.logger.error('Error getting favorites', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get favorites');
  }
});
