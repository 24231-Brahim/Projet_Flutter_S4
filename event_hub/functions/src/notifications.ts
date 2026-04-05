import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

export const sendPushNotification = async (
  tokens: string | string[],
  notification: {
    title: string;
    body: string;
  },
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> => {
  functions.logger.info('Sending push notification', { tokenCount: Array.isArray(tokens) ? tokens.length : 1 });

  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    const validTokens = tokenArray.filter(token => token && token.length > 0);

    if (validTokens.length === 0) {
      functions.logger.warn('No valid FCM tokens provided');
      return { successCount: 0, failureCount: 0 };
    }

    const message: admin.messaging.MulticastMessage = {
      notification,
      data,
      tokens: validTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    functions.logger.info('Push notification results', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    functions.logger.error('Error sending push notification', { error });
    throw error;
  }
};

export const updateFCMToken = functions.https.onCall(async (data, context) => {
  functions.logger.info('updateFCMToken called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { fcmToken } = data;

  if (!fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    await db.collection('users').doc(uid).update({
      fcmToken,
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('FCM token updated', { uid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating FCM token', { uid, error });
    throw new functions.https.HttpsError('internal', 'Failed to update FCM token');
  }
});

export const removeFCMToken = functions.https.onCall(async (data, context) => {
  functions.logger.info('removeFCMToken called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  try {
    await db.collection('users').doc(uid).update({
      fcmToken: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('FCM token removed', { uid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error removing FCM token', { uid, error });
    throw new functions.https.HttpsError('internal', 'Failed to remove FCM token');
  }
});

export const getUserNotifications = functions.https.onCall(async (data, context) => {
  functions.logger.info('getUserNotifications called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { limit = 50, unreadOnly = false } = data;

  try {
    let query: FirebaseFirestore.Query = db
      .collection('notifications')
      .where('userId', '==', uid)
      .orderBy('envoyeAt', 'desc');

    if (unreadOnly) {
      query = query.where('lue', '==', false);
    }

    const snapshot = await query.limit(limit).get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const unreadCount = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .where('lue', '==', false)
      .count()
      .get();

    functions.logger.info('User notifications retrieved', { uid, count: notifications.length });

    return {
      notifications,
      unreadCount: unreadCount.data().count,
    };
  } catch (error) {
    functions.logger.error('Error getting user notifications', { uid, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to get notifications');
  }
});

export const markNotificationRead = functions.https.onCall(async (data, context) => {
  functions.logger.info('markNotificationRead called', { uid: context.auth?.uid, notifId: data.notifId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { notifId } = data;

  if (!notifId) {
    throw new functions.https.HttpsError('invalid-argument', 'Notification ID is required');
  }

  try {
    const notifRef = db.collection('notifications').doc(notifId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    const notifData = notifDoc.data();

    if (notifData?.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    await notifRef.update({
      lue: true,
    });

    functions.logger.info('Notification marked as read', { notifId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error marking notification as read', { notifId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to mark notification as read');
  }
});

export const markAllNotificationsRead = functions.https.onCall(async (data, context) => {
  functions.logger.info('markAllNotificationsRead called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  try {
    const batch = db.batch();

    const unreadSnapshot = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .where('lue', '==', false)
      .get();

    unreadSnapshot.forEach(doc => {
      batch.update(doc.ref, { lue: true });
    });

    await batch.commit();

    functions.logger.info('All notifications marked as read', { uid, count: unreadSnapshot.size });

    return { success: true, count: unreadSnapshot.size };
  } catch (error) {
    functions.logger.error('Error marking all notifications as read', { uid, error });
    throw new functions.https.HttpsError('internal', 'Failed to mark notifications as read');
  }
});

export const deleteNotification = functions.https.onCall(async (data, context) => {
  functions.logger.info('deleteNotification called', { uid: context.auth?.uid, notifId: data.notifId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { notifId } = data;

  if (!notifId) {
    throw new functions.https.HttpsError('invalid-argument', 'Notification ID is required');
  }

  try {
    const notifRef = db.collection('notifications').doc(notifId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    const notifData = notifDoc.data();

    if (notifData?.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    await notifRef.delete();

    functions.logger.info('Notification deleted', { notifId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error deleting notification', { notifId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to delete notification');
  }
});

export const scheduleEventReminders = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    functions.logger.info('Running scheduled event reminders');

    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const events1hQuery = await db
        .collection('events')
        .where('statut', '==', 'published')
        .where('dateDebut', '>=', Timestamp.fromDate(now))
        .where('dateDebut', '<=', Timestamp.fromDate(inOneHour))
        .get();

      for (const eventDoc of events1hQuery.docs) {
        await sendEventReminders(eventDoc, '1h');
      }

      const events24hQuery = await db
        .collection('events')
        .where('statut', '==', 'published')
        .where('dateDebut', '>', Timestamp.fromDate(inOneHour))
        .where('dateDebut', '<=', Timestamp.fromDate(in24Hours))
        .get();

      for (const eventDoc of events24hQuery.docs) {
        await sendEventReminders(eventDoc, '24h');
      }

      functions.logger.info('Event reminders completed', {
        events1h: events1hQuery.size,
        events24h: events24hQuery.size,
      });

      return null;
    } catch (error) {
      functions.logger.error('Error running event reminders', { error });
      throw error;
    }
  });

async function sendEventReminders(
  eventDoc: FirebaseFirestore.QueryDocumentSnapshot,
  reminderType: '1h' | '24h'
) {
  const eventData = eventDoc.data();
  const eventId = eventData.eventId;

  functions.logger.info('Sending event reminders', { eventId, reminderType });

  const bookingsQuery = await db
    .collection('bookings')
    .where('eventId', '==', eventId)
    .where('statut', '==', 'confirmed')
    .get();

  const fieldToCheck = reminderType === '1h' ? 'reminderSent1h' : 'reminderSent24h';
  const fieldToSet = reminderType === '1h'
    ? { reminderSent1h: true }
    : { reminderSent24h: true };

  for (const bookingDoc of bookingsQuery.docs) {
    const bookingData = bookingDoc.data();

    if (bookingData[fieldToCheck]) {
      continue;
    }

    const userDoc = await db.collection('users').doc(bookingData.userId).get();
    const userData = userDoc.data();

    const eventDate = eventData.dateDebut.toDate();
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await db.collection('notifications').add({
      userId: bookingData.userId,
      titre: reminderType === '1h' ? 'Event Starting Soon! 🚀' : 'Event Tomorrow! 📅',
      corps: `${eventData.titre} is starting in ${reminderType === '1h' ? '1 hour' : '24 hours'}. Don't forget to bring your ticket!`,
      type: 'event_reminder',
      data: { eventId, bookingId: bookingDoc.id },
      lue: false,
      envoyeAt: FieldValue.serverTimestamp(),
    });

    const fcmToken = userData?.fcmToken;
    if (fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: reminderType === '1h' ? 'Event Starting Soon! 🚀' : 'Event Tomorrow! 📅',
            body: `${eventData.titre} - ${formattedDate}`,
          },
          data: {
            type: 'event_reminder',
            eventId,
            bookingId: bookingDoc.id,
          },
        });
      } catch (error) {
        functions.logger.error('Error sending FCM reminder', { userId: bookingData.userId, error });
      }
    }

    await bookingDoc.ref.update(fieldToSet);
  }

  functions.logger.info('Event reminders sent', { eventId, reminderType, count: bookingsQuery.size });
}

export const sendPromotionNotification = functions.https.onCall(async (data, context) => {
  functions.logger.info('sendPromotionNotification called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userRole = userDoc.data()?.role;

    if (userRole !== 'organisateur' && userRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    const { eventId, title, body, targetAudience } = data;

    if (!eventId || !title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Event ID, title, and body are required');
    }

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    let userQuery: FirebaseFirestore.Query = db.collection('users');

    if (targetAudience === 'favorites') {
      userQuery = userQuery.where('favoris', 'array-contains', eventId);
    } else if (targetAudience === 'booked') {
      const bookingsSnapshot = await db
        .collection('bookings')
        .where('eventId', '==', eventId)
        .where('statut', 'in', ['confirmed', 'used'])
        .get();

      const userIds = [...new Set(bookingsSnapshot.docs.map(d => d.data().userId))];
      
      const notifications = [];
      for (const userId of userIds) {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
            data: { type: 'promotion', eventId },
          });
        }

        notifications.push({
          userId,
          titre: title,
          corps: body,
          type: 'promotion' as const,
          data: { eventId },
          lue: false,
          envoyeAt: FieldValue.serverTimestamp(),
        });
      }

      if (notifications.length > 0) {
        const batch = db.batch();
        notifications.forEach(notif => {
          const ref = db.collection('notifications').doc();
          batch.set(ref, notif);
        });
        await batch.commit();
      }

      functions.logger.info('Promotion sent', { eventId, count: notifications.length });
      return { success: true, count: notifications.length };
    }

    const usersSnapshot = await userQuery.limit(500).get();

    const notifications = [];
    const tokens: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (fcmToken) {
        tokens.push(fcmToken);
      }

      notifications.push({
        userId: userDoc.id,
        titre: title,
        corps: body,
        type: 'promotion' as const,
        data: { eventId },
        lue: false,
        envoyeAt: FieldValue.serverTimestamp(),
      });
    }

    if (tokens.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const tokenChunk = tokens.slice(i, i + chunkSize);
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: tokenChunk,
            notification: { title, body },
            data: { type: 'promotion', eventId },
          });
        } catch (error) {
          functions.logger.error('Error sending multicast', { error });
        }
      }
    }

    if (notifications.length > 0) {
      const batch = db.batch();
      notifications.forEach(notif => {
        const ref = db.collection('notifications').doc();
        batch.set(ref, notif);
      });
      await batch.commit();
    }

    functions.logger.info('Promotion sent', { eventId, count: notifications.length });

    return { success: true, count: notifications.length };
  } catch (error) {
    functions.logger.error('Error sending promotion', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to send promotion');
  }
});
