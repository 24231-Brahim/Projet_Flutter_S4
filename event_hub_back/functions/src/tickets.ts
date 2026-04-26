import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { generateQrToken, verifyQrToken } from './utils/crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();
const storage = admin.storage();

interface TicketGenerationData {
  bookingId: string;
  eventId: string;
  ticketId: string;
  userId: string;
  ticketType: 'standard' | 'vip' | 'early_bird';
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  attendeeName: string;
  quantity: number;
  prix: number;
}

export async function generateTicket(data: TicketGenerationData): Promise<{
  qrCodeURL: string;
  pdfURL: string;
  qrCodeToken: string;
}> {
  functions.logger.info('Generating ticket', { bookingId: data.bookingId });

  try {
    const qrCodeToken = generateQrToken(data.bookingId);

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeToken, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    const pdfBuffer = await generatePdfTicket({
      ...data,
      qrCodeBuffer,
    });

    const bucket = storage.bucket();
    const qrCodePath = `tickets/${data.bookingId}/qrcode.png`;
    const pdfPath = `tickets/${data.bookingId}/ticket.pdf`;

    await bucket.file(qrCodePath).save(qrCodeBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    await bucket.file(pdfPath).save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    await bucket.file(qrCodePath).makePublic();
    await bucket.file(pdfPath).makePublic();

    const qrCodeURL = `https://storage.googleapis.com/${bucket.name}/${qrCodePath}`;
    const pdfURL = `https://storage.googleapis.com/${bucket.name}/${pdfPath}`;

    functions.logger.info('Ticket generated successfully', { bookingId: data.bookingId, qrCodeURL, pdfURL });

    return { qrCodeURL, pdfURL, qrCodeToken };
  } catch (error) {
    functions.logger.error('Error generating ticket', { bookingId: data.bookingId, error });
    throw error;
  }
}

interface PdfTicketData extends TicketGenerationData {
  qrCodeBuffer: Buffer;
}

async function generatePdfTicket(data: PdfTicketData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      doc.rect(0, 0, pageWidth, pageHeight).fill('#f8f9fa');

      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
        .lineWidth(2)
        .stroke('#667eea');

      doc.rect(30, 30, 200, pageHeight - 60)
        .lineWidth(2)
        .stroke('#764ba2');

      doc.fillColor('#667eea')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('EventHub', 50, 50);

      doc.fillColor('#666')
        .fontSize(10)
        .font('Helvetica')
        .text('Your Event Destination', 50, 85);

      const ticketTypeColors: Record<string, string> = {
        standard: '#4CAF50',
        vip: '#FFD700',
        early_bird: '#FF5722',
      };
      const ticketColor = ticketTypeColors[data.ticketType] || '#667eea';

      doc.roundedRect(pageWidth - 180, 50, 120, 40, 5)
        .fill(ticketColor);

      doc.fillColor('#fff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(
          data.ticketType.toUpperCase().replace('_', ' '),
          pageWidth - 180,
          60,
          { width: 120, align: 'center' }
        );

      doc.fillColor('#333')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(data.eventTitle, 250, 120, {
          width: pageWidth - 400,
          align: 'left',
        });

      const eventDate = data.eventDate;
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fillColor('#666')
        .fontSize(12)
        .font('Helvetica')
        .text(formattedDate, 250, 160, { width: pageWidth - 400 });

      doc.fillColor('#666')
        .fontSize(12)
        .text(`📍 ${data.eventVenue}`, 250, 185, { width: pageWidth - 400 });

      doc.moveTo(250, 220)
        .lineTo(pageWidth - 50, 220)
        .lineWidth(1)
        .stroke('#ddd');

      doc.fillColor('#333')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Attendee', 250, 240);

      doc.fillColor('#666')
        .fontSize(12)
        .font('Helvetica')
        .text(data.attendeeName, 250, 260);

      doc.fillColor('#333')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Quantity', 250, 290);

      doc.fillColor('#666')
        .fontSize(12)
        .font('Helvetica')
        .text(`${data.quantity} ticket${data.quantity > 1 ? 's' : ''}`, 250, 310);

      doc.fillColor('#333')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Price', 400, 290);

      doc.fillColor('#667eea')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`$${data.prix.toFixed(2)}`, 400, 310);

      const qrCodeX = 60;
      const qrCodeY = 120;
      const qrCodeSize = 130;

      doc.image(data.qrCodeBuffer, qrCodeX, qrCodeY, {
        fit: [qrCodeSize, qrCodeSize],
        align: 'center',
        valign: 'center',
      });

      doc.fillColor('#666')
        .fontSize(8)
        .font('Helvetica')
        .text('Scan at entrance', qrCodeX, qrCodeY + qrCodeSize + 10, {
          width: qrCodeSize,
          align: 'center',
        });

      doc.fillColor('#999')
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Booking ID: ${data.bookingId}\nTicket ID: ${data.ticketId}`,
          250,
          pageHeight - 100,
          { width: pageWidth - 400 }
        );

      doc.fillColor('#ddd')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This ticket is non-transferable. Please keep this document safe.',
          50,
          pageHeight - 40,
          { width: pageWidth - 100, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export const validateTicket = functions.https.onCall(async (data, context) => {
  functions.logger.info('validateTicket called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { qrCodeToken } = data;

  if (!qrCodeToken) {
    throw new functions.https.HttpsError('invalid-argument', 'QR code token is required');
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userRole = userDoc.data()?.role;

    if (userRole !== 'organisateur' && userRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to validate tickets');
    }

    const tokenPayload = verifyQrToken(qrCodeToken);

    if (!tokenPayload) {
      functions.logger.warn('Invalid QR token', { token: qrCodeToken.substring(0, 20) });
      return {
        valid: false,
        error: 'Invalid or tampered QR code',
      };
    }

    const { bookingId } = tokenPayload;

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return { valid: false, error: 'Booking not found' };
    }

    const bookingData = bookingDoc.data();

    if (bookingData?.statut !== 'confirmed') {
      return {
        valid: false,
        error: `Booking is ${bookingData?.statut}, not confirmed`,
      };
    }

    if (bookingData?.scannedAt) {
      return {
        valid: false,
        error: 'Ticket already scanned',
        scannedAt: bookingData.scannedAt,
      };
    }

    const eventDoc = await db.collection('events').doc(bookingData.eventId).get();
    const eventData = eventDoc.data();

    if (!eventData) {
      return { valid: false, error: 'Event not found' };
    }

    const now = new Date();
    const eventDate = eventData.dateDebut.toDate();
    const endDate = eventData.dateFin.toDate();

    if (now < eventDate) {
      return {
        valid: false,
        error: `Event has not started yet. Starts at ${eventDate.toISOString()}`,
      };
    }

    if (now > endDate) {
      return {
        valid: false,
        error: 'Event has already ended',
      };
    }

    await bookingDoc.ref.update({
      scannedAt: FieldValue.serverTimestamp(),
      statut: 'used',
      validatedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const ticketDoc = await db
      .collection('events')
      .doc(bookingData.eventId)
      .collection('tickets')
      .doc(bookingData.ticketId)
      .get();

    const ticketData = ticketDoc.data();

    const attendeeDoc = await db.collection('users').doc(bookingData.userId).get();
    const attendeeName = attendeeDoc.data()?.nom || 'Unknown';

    functions.logger.info('Ticket validated successfully', { bookingId, eventId: bookingData.eventId });

    return {
      valid: true,
      attendeeName,
      ticketType: ticketData?.type || 'standard',
      eventTitle: eventData.titre,
      quantity: bookingData.quantite,
      scannedAt: Timestamp.now(),
    };
  } catch (error) {
    functions.logger.error('Error validating ticket', { error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to validate ticket');
  }
});

export const addTicket = functions.https.onCall(async (data, context) => {
  functions.logger.info('addTicket called', { uid: context.auth?.uid, eventId: data.eventId });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId, type, prix, quantiteDisponible, description } = data;

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
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to add tickets');
      }
    }

    const ticketRef = eventRef.collection('tickets').doc();
    const ticketId = ticketRef.id;

    await ticketRef.set({
      ticketId,
      type: type || 'standard',
      prix: prix || 0,
      quantiteDisponible: quantiteDisponible || 0,
      quantiteVendue: 0,
      description: description || '',
      actif: true,
      eventId,
    });

    functions.logger.info('Ticket added', { eventId, ticketId });

    return { ticketId, success: true };
  } catch (error) {
    functions.logger.error('Error adding ticket', { eventId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to add ticket');
  }
});

export const updateTicket = functions.https.onCall(async (data, context) => {
  functions.logger.info('updateTicket called', { uid: context.auth?.uid });

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = context.auth.uid;
  const { eventId, ticketId, ...updates } = data;

  if (!eventId || !ticketId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID and Ticket ID are required');
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
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to update tickets');
      }
    }

    const ticketRef = eventRef.collection('tickets').doc(ticketId);
    const updateData: Record<string, unknown> = {};

    if (updates.prix !== undefined) updateData.prix = updates.prix;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.actif !== undefined) updateData.actif = updates.actif;
    if (updates.quantiteDisponible !== undefined) updateData.quantiteDisponible = updates.quantiteDisponible;

    await ticketRef.update(updateData);

    functions.logger.info('Ticket updated', { eventId, ticketId });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating ticket', { eventId, ticketId, error });
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to update ticket');
  }
});

export const getEventTickets = functions.https.onCall(async (data) => {
  functions.logger.info('getEventTickets called', { eventId: data.eventId });

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'Event ID is required');
  }

  try {
    const ticketsSnapshot = await db
      .collection('events')
      .doc(eventId)
      .collection('tickets')
      .where('actif', '==', true)
      .get();

    const tickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    functions.logger.info('Event tickets retrieved', { eventId, count: tickets.length });

    return { tickets };
  } catch (error) {
    functions.logger.error('Error getting event tickets', { eventId, error });
    throw new functions.https.HttpsError('internal', 'Failed to get tickets');
  }
});
