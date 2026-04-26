import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:event_hub/models/notification.dart';

void main() {
  group('AppNotification', () {
    late AppNotification notification;
    late DateTime now;

    setUp(() {
      now = DateTime.now();
      notification = AppNotification(
        notifId: 'notif-123',
        userId: 'user-456',
        titre: 'Booking Confirmed',
        corps: 'Your booking has been confirmed.',
        type: 'booking_confirmed',
        data: {'bookingId': 'booking-789'},
        lue: false,
        envoyeAt: now,
      );
    });

    group('factory constructors', () {
      test('fromMap creates AppNotification from valid map', () {
        final map = {
          'notifId': 'notif-123',
          'userId': 'user-456',
          'titre': 'Booking Confirmed',
          'corps': 'Your booking has been confirmed.',
          'type': 'booking_confirmed',
          'data': {'bookingId': 'booking-789', 'eventId': 'event-1'},
          'lue': false,
          'envoyeAt': Timestamp.fromDate(now),
        };

        final result = AppNotification.fromMap(map);

        expect(result.notifId, 'notif-123');
        expect(result.userId, 'user-456');
        expect(result.titre, 'Booking Confirmed');
        expect(result.corps, 'Your booking has been confirmed.');
        expect(result.type, 'booking_confirmed');
        expect(result.data['bookingId'], 'booking-789');
        expect(result.lue, false);
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = AppNotification.fromMap(map);

        expect(result.notifId, '');
        expect(result.userId, '');
        expect(result.titre, '');
        expect(result.corps, '');
        expect(result.type, '');
        expect(result.data, isEmpty);
        expect(result.lue, false);
      });

      test('fromMap accepts id as fallback for notifId', () {
        final map = {
          'id': 'notif-from-id',
          'userId': 'user-1',
          'titre': 'Test',
          'corps': 'Test body',
          'type': 'test',
        };

        final result = AppNotification.fromMap(map);

        expect(result.notifId, 'notif-from-id');
      });

      test('fromMap handles null data', () {
        final map = {
          'notifId': 'notif-1',
          'userId': 'user-1',
          'titre': 'Test',
          'corps': 'Test',
          'type': 'test',
          'data': null,
        };

        final result = AppNotification.fromMap(map);

        expect(result.data, isEmpty);
      });

      test('fromMap handles empty data map', () {
        final map = {
          'notifId': 'notif-1',
          'userId': 'user-1',
          'titre': 'Test',
          'corps': 'Test',
          'type': 'test',
          'data': {},
        };

        final result = AppNotification.fromMap(map);

        expect(result.data, isEmpty);
      });
    });

    group('toMap', () {
      test('converts AppNotification to map correctly', () {
        final result = notification.toMap();

        expect(result['notifId'], 'notif-123');
        expect(result['userId'], 'user-456');
        expect(result['titre'], 'Booking Confirmed');
        expect(result['corps'], 'Your booking has been confirmed.');
        expect(result['type'], 'booking_confirmed');
        expect(result['data'], {'bookingId': 'booking-789'});
        expect(result['lue'], false);
      });
    });

    group('computed properties', () {
      test('isRead returns true when lue is true', () {
        final readNotification = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Test',
          corps: 'Test body',
          type: 'test',
          lue: true,
          envoyeAt: now,
        );

        expect(readNotification.isRead, true);
      });

      test('isRead returns false when lue is false', () {
        expect(notification.isRead, false);
      });

      test('isBookingConfirmed returns true for booking_confirmed type', () {
        expect(notification.isBookingConfirmed, true);
      });

      test('isBookingConfirmed returns false for other types', () {
        final eventReminder = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Reminder',
          corps: 'Event starts soon',
          type: 'event_reminder',
          envoyeAt: now,
        );

        expect(eventReminder.isBookingConfirmed, false);
      });

      test('isEventReminder returns true for event_reminder type', () {
        final eventReminder = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Reminder',
          corps: 'Event starts soon',
          type: 'event_reminder',
          envoyeAt: now,
        );

        expect(eventReminder.isEventReminder, true);
      });

      test('isTicketReady returns true for ticket_ready type', () {
        final ticketReady = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Ticket Ready',
          corps: 'Your ticket is ready',
          type: 'ticket_ready',
          envoyeAt: now,
        );

        expect(ticketReady.isTicketReady, true);
      });

      test('isCancellation returns true for cancellation type', () {
        final cancellation = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Event Cancelled',
          corps: 'The event has been cancelled',
          type: 'cancellation',
          envoyeAt: now,
        );

        expect(cancellation.isCancellation, true);
      });

      test('isPromotion returns true for promotion type', () {
        final promotion = AppNotification(
          notifId: 'notif-1',
          userId: 'user-1',
          titre: 'Special Offer',
          corps: 'Get 20% off!',
          type: 'promotion',
          envoyeAt: now,
        );

        expect(promotion.isPromotion, true);
      });

      test('isPromotion returns false for non-promotion types', () {
        expect(notification.isPromotion, false);
      });
    });
  });
}
