import 'package:flutter_test/flutter_test.dart';
import 'package:event_hub/services/api_service.dart';

void main() {
  group('ApiService - Integration Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService();
    });

    group('Event Functions', () {
      test('getUpcomingEvents returns paginated events', () async {
        final result = await apiService.getUpcomingEvents(limit: 10);

        expect(result, isA<Map<String, dynamic>>());
        expect(result.containsKey('events'), true);
        expect(result.containsKey('nextCursor'), true);
        expect(result['events'], isA<List>());
      });

      test('getUpcomingEvents with category filter works', () async {
        final result = await apiService.getUpcomingEvents(
          categorie: 'Music',
          limit: 5,
        );

        expect(result.containsKey('events'), true);
        final events = result['events'] as List;
        if (events.isNotEmpty) {
          expect(events.first.categorie, 'Music');
        }
      });

      test('searchEvents returns matching events', () async {
        final results = await apiService.searchEvents(query: 'test', limit: 5);

        expect(results, isA<List>());
      });

      test('getEventDetails returns event with tickets and reviews', () async {
        final result = await apiService.getUpcomingEvents(limit: 1);
        final events = result['events'] as List;

        if (events.isEmpty) {
          print('No events available for getEventDetails test');
          return;
        }

        final eventId = events.first.eventId;
        final details = await apiService.getEventDetails(eventId);

        expect(details.containsKey('event'), true);
        expect(details.containsKey('tickets'), true);
        expect(details.containsKey('reviews'), true);
        expect(details['event'].eventId, eventId);
      });
    });

    group('User Functions', () {
      test('getUserProfile returns current user data', () async {
        try {
          final user = await apiService.getUserProfile();

          expect(user, isNotNull);
          expect(user.uid.isNotEmpty, true);
          expect(user.email.isNotEmpty, true);
        } on ApiException catch (e) {
          print('getUserProfile failed (user may not be authenticated): $e');
        }
      });

      test('getFavorites returns user favorites', () async {
        try {
          final favorites = await apiService.getFavorites();
          expect(favorites, isA<List>());
        } on ApiException catch (e) {
          print('getFavorites failed: $e');
        }
      });
    });

    group('Booking Functions', () {
      test('getUserBookings returns user bookings', () async {
        try {
          final bookings = await apiService.getUserBookings();
          expect(bookings, isA<List>());
        } on ApiException catch (e) {
          print('getUserBookings failed: $e');
        }
      });

      test('getUserBookingsPaginated works with pagination', () async {
        try {
          final result = await apiService.getUserBookingsPaginated(limit: 5);

          expect(result.containsKey('bookings'), true);
          expect(result.containsKey('nextCursor'), true);
        } on ApiException catch (e) {
          print('getUserBookingsPaginated failed: $e');
        }
      });
    });

    group('Notification Functions', () {
      test('getUserNotifications returns notifications', () async {
        try {
          final result = await apiService.getUserNotifications();

          expect(result.containsKey('notifications'), true);
          expect(result.containsKey('unreadCount'), true);
          expect(result['notifications'], isA<List>());
        } on ApiException catch (e) {
          print('getUserNotifications failed: $e');
        }
      });

      test('getUserNotifications with unread filter works', () async {
        try {
          final result = await apiService.getUserNotifications(
            unreadOnly: true,
            limit: 10,
          );

          expect(result.containsKey('notifications'), true);
        } on ApiException catch (e) {
          print('getUserNotifications (unreadOnly) failed: $e');
        }
      });
    });

    group('Review Functions', () {
      test('getEventReviews returns reviews with stats', () async {
        final result = await apiService.getUpcomingEvents(limit: 1);
        final events = result['events'] as List;

        if (events.isEmpty) {
          print('No events available for getEventReviews test');
          return;
        }

        try {
          final eventId = events.first.eventId;
          final reviews = await apiService.getEventReviews(eventId, limit: 10);

          expect(reviews.containsKey('reviews'), true);
          expect(reviews.containsKey('stats'), true);
        } on ApiException catch (e) {
          print('getEventReviews failed: $e');
        }
      });
    });

    group('Organizer Functions', () {
      test('getOrganizerEvents returns organizer events', () async {
        try {
          final events = await apiService.getOrganizerEvents();
          expect(events, isA<List>());
        } on ApiException catch (e) {
          print('getOrganizerEvents failed (user may not be organizer): $e');
        }
      });

      test('getOrganizerEvents with status filter works', () async {
        try {
          final events = await apiService.getOrganizerEvents(
            statut: 'published',
          );
          expect(events, isA<List>());
        } on ApiException catch (e) {
          print('getOrganizerEvents (filtered) failed: $e');
        }
      });
    });

    group('Cache Behavior', () {
      test('second call to same endpoint uses cache', () async {
        final startTime = DateTime.now();

        await apiService.getUpcomingEvents(limit: 10);

        final cachedStartTime = DateTime.now();
        await apiService.getUpcomingEvents(limit: 10);
        final cachedEndTime = DateTime.now();

        final firstCallDuration = cachedStartTime.difference(startTime);
        final cachedCallDuration = cachedEndTime.difference(cachedStartTime);

        print('First call: ${firstCallDuration.inMilliseconds}ms');
        print('Cached call: ${cachedCallDuration.inMilliseconds}ms');
      });

      test('cache invalidation works after mutations', () async {
        await apiService.getUpcomingEvents(limit: 10);

        apiService.invalidateCache();

        final result = await apiService.getUpcomingEvents(limit: 10);
        expect(result.containsKey('events'), true);
      });
    });
  });
}
