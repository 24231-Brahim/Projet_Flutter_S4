import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendWelcomeEmail } from './utils/sendgrid';

const db = admin.firestore();

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  functions.logger.info('New user created', { uid: user.uid, email: user.email });

  try {
    const userData = {
      uid: user.uid,
      nom: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      telephone: '',
      photoURL: user.photoURL || '',
      role: 'user' as const,
      favoris: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(user.uid).set(userData);

    functions.logger.info('User document created in Firestore', { uid: user.uid });

    if (user.email) {
      try {
        await sendWelcomeEmail(user.email, userData.nom);
        functions.logger.info('Welcome email sent', { uid: user.uid });
      } catch (emailError) {
        functions.logger.error('Failed to send welcome email', { uid: user.uid, error: emailError });
      }
    }

    return { success: true, uid: user.uid };
  } catch (error) {
    functions.logger.error('Error creating user document', { uid: user.uid, error });
    throw error;
  }
});

export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  functions.logger.info('User deleted from Auth', { uid: user.uid });

  try {
    const userRef = db.collection('users').doc(user.uid);
    const batch = db.batch();

    batch.update(userRef, {
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const pendingBookings = await db
      .collection('bookings')
      .where('userId', '==', user.uid)
      .where('statut', '==', 'pending')
      .get();

    for (const bookingDoc of pendingBookings.docs) {
      batch.update(bookingDoc.ref, {
        statut: 'cancelled',
        cancelledReason: 'user_deleted',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    functions.logger.info('User soft-deleted and pending bookings cancelled', {
      uid: user.uid,
      cancelledBookingsCount: pendingBookings.size,
    });

    return { success: true, uid: user.uid };
  } catch (error) {
    functions.logger.error('Error processing user deletion', { uid: user.uid, error });
    throw error;
  }
});

export const updateUserProfile = functions.https.onCall(async (data, context) => {
  functions.logger.info('updateUserProfile called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { nom, telephone, photoURL } = data;

  try {
    const userRef = db.collection('users').doc(context.auth.uid);
    
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (nom !== undefined) updateData.nom = nom;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    await userRef.update(updateData);

    if (nom || photoURL) {
      await admin.auth().updateUser(context.auth.uid, {
        displayName: nom || undefined,
        photoURL: photoURL || undefined,
      });
    }

    functions.logger.info('User profile updated', { uid: context.auth.uid });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating user profile', { uid: context.auth.uid, error });
    throw new functions.https.HttpsError('internal', 'Failed to update profile');
  }
});

export const getUserProfile = functions.https.onCall(async (data, context) => {
  functions.logger.info('getUserProfile called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    delete userData?.fcmToken;

    return { user: userData };
  } catch (error) {
    functions.logger.error('Error fetching user profile', { uid: context.auth.uid, error });
    throw new functions.https.HttpsError('internal', 'Failed to fetch profile');
  }
});
