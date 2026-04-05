import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:event_hub/models/booking.dart';
import 'package:event_hub/models/event.dart';
import 'package:event_hub/models/ticket.dart';

void main() {
  group('Booking', () {
    late Booking booking;
    late DateTime now;

    setUp(() {
      now = DateTime.now();
      booking = Booking(
        bookingId: 'booking-123',
        userId: 'user-456',
        eventId: 'event-789',
        ticketId: 'ticket-101',
        quantite: 2,
        montantTotal: 100.0,
        statut: 'confirmed',
        qrCodeToken: 'qr-token-123',
        qrCodeURL: 'https://example.com/qr.png',
        pdfURL: 'https://example.com/ticket.pdf',
        dateReservation: now,
        updatedAt: now,
      );
    });

    group('factory constructors', () {
      test('fromMap creates Booking from valid map', () {
        final map = {
          'bookingId': 'booking-123',
          'userId': 'user-456',
          'eventId': 'event-789',
          'ticketId': 'ticket-101',
          'quantite': 2,
          'montantTotal': 100.0,
          'statut': 'confirmed',
          'qrCodeToken': 'qr-token-123',
          'qrCodeURL': 'https://example.com/qr.png',
          'pdfURL': 'https://example.com/ticket.pdf',
          'devise': 'USD',
          'dateReservation': Timestamp.fromDate(now),
          'updatedAt': Timestamp.fromDate(now),
        };

        final result = Booking.fromMap(map);

        expect(result.bookingId, 'booking-123');
        expect(result.userId, 'user-456');
        expect(result.eventId, 'event-789');
        expect(result.quantite, 2);
        expect(result.montantTotal, 100.0);
        expect(result.statut, 'confirmed');
        expect(result.devise, 'USD');
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = Booking.fromMap(map);

        expect(result.bookingId, '');
        expect(result.quantite, 0);
        expect(result.montantTotal, 0.0);
        expect(result.statut, 'pending');
        expect(result.devise, 'USD');
      });

      test('fromMap accepts id as fallback for bookingId', () {
        final map = {'id': 'booking-from-id', 'userId': 'user-1'};

        final result = Booking.fromMap(map);

        expect(result.bookingId, 'booking-from-id');
      });

      test('fromMap parses nested event', () {
        final map = {
          'bookingId': 'booking-123',
          'userId': 'user-456',
          'eventId': 'event-789',
          'ticketId': 'ticket-101',
          'quantite': 1,
          'event': {
            'eventId': 'event-789',
            'organisateurId': 'user-1',
            'titre': 'Test Event',
            'description': 'Test',
            'categorie': 'Music',
            'lieu': 'NYC',
            'dateDebut': Timestamp.fromDate(now),
            'dateFin': Timestamp.fromDate(now),
            'capaciteTotale': 100,
            'placesRestantes': 50,
          },
        };

        final result = Booking.fromMap(map);

        expect(result.event, isNotNull);
        expect(result.event!.eventId, 'event-789');
        expect(result.event!.titre, 'Test Event');
      });

      test('fromMap parses nested ticket', () {
        final map = {
          'bookingId': 'booking-123',
          'userId': 'user-456',
          'eventId': 'event-789',
          'ticketId': 'ticket-101',
          'quantite': 1,
          'ticket': {
            'ticketId': 'ticket-101',
            'type': 'vip',
            'prix': 75.0,
            'quantiteDisponible': 50,
          },
        };

        final result = Booking.fromMap(map);

        expect(result.ticket, isNotNull);
        expect(result.ticket!.ticketId, 'ticket-101');
        expect(result.ticket!.type, 'vip');
      });
    });

    group('toMap', () {
      test('converts Booking to map correctly', () {
        final result = booking.toMap();

        expect(result['bookingId'], 'booking-123');
        expect(result['userId'], 'user-456');
        expect(result['eventId'], 'event-789');
        expect(result['quantite'], 2);
        expect(result['montantTotal'], 100.0);
        expect(result['statut'], 'confirmed');
      });
    });

    group('computed properties', () {
      test('isPending returns true when pending', () {
        final pendingBooking = Booking(
          bookingId: 'booking-1',
          userId: 'user-1',
          eventId: 'event-1',
          ticketId: 'ticket-1',
          quantite: 1,
          montantTotal: 50.0,
          statut: 'pending',
          dateReservation: now,
          updatedAt: now,
        );

        expect(pendingBooking.isPending, true);
      });

      test('isConfirmed returns true when confirmed', () {
        expect(booking.isConfirmed, true);
      });

      test('isCancelled returns true when cancelled', () {
        final cancelledBooking = Booking(
          bookingId: 'booking-1',
          userId: 'user-1',
          eventId: 'event-1',
          ticketId: 'ticket-1',
          quantite: 1,
          montantTotal: 50.0,
          statut: 'cancelled',
          dateReservation: now,
          updatedAt: now,
        );

        expect(cancelledBooking.isCancelled, true);
      });

      test('isRefunded returns true when refunded', () {
        final refundedBooking = Booking(
          bookingId: 'booking-1',
          userId: 'user-1',
          eventId: 'event-1',
          ticketId: 'ticket-1',
          quantite: 1,
          montantTotal: 50.0,
          statut: 'refunded',
          dateReservation: now,
          updatedAt: now,
        );

        expect(refundedBooking.isRefunded, true);
      });

      test('isUsed returns true when used', () {
        final usedBooking = Booking(
          bookingId: 'booking-1',
          userId: 'user-1',
          eventId: 'event-1',
          ticketId: 'ticket-1',
          quantite: 1,
          montantTotal: 50.0,
          statut: 'used',
          dateReservation: now,
          updatedAt: now,
        );

        expect(usedBooking.isUsed, true);
      });

      test('isScanned returns true when scannedAt is set', () {
        final scannedBooking = Booking(
          bookingId: 'booking-1',
          userId: 'user-1',
          eventId: 'event-1',
          ticketId: 'ticket-1',
          quantite: 1,
          montantTotal: 50.0,
          statut: 'used',
          scannedAt: now,
          dateReservation: now,
          updatedAt: now,
        );

        expect(scannedBooking.isScanned, true);
      });

      test('isScanned returns false when scannedAt is null', () {
        expect(booking.isScanned, false);
      });
    });
  });

  group('BookingWithClientSecret', () {
    test('fromMap creates BookingWithClientSecret from valid map', () {
      final map = {
        'bookingId': 'booking-123',
        'clientSecret': 'secret_abc',
        'paymentId': 'pi_xyz',
        'montantTotal': 150.0,
        'statut': 'pending',
      };

      final result = BookingWithClientSecret.fromMap(map);

      expect(result.bookingId, 'booking-123');
      expect(result.clientSecret, 'secret_abc');
      expect(result.paymentId, 'pi_xyz');
      expect(result.montantTotal, 150.0);
      expect(result.statut, 'pending');
    });

    test('fromMap handles null values with defaults', () {
      final map = <String, dynamic>{};

      final result = BookingWithClientSecret.fromMap(map);

      expect(result.bookingId, '');
      expect(result.clientSecret, isNull);
      expect(result.paymentId, isNull);
      expect(result.montantTotal, 0.0);
      expect(result.statut, 'pending');
    });

    test('fromMap handles numeric montantTotal', () {
      final map = {'bookingId': 'booking-123', 'montantTotal': 200};

      final result = BookingWithClientSecret.fromMap(map);

      expect(result.montantTotal, 200.0);
    });
  });
}
