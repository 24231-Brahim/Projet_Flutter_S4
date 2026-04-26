import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:event_hub/models/review.dart';

void main() {
  group('Review', () {
    late Review review;
    late DateTime now;

    setUp(() {
      now = DateTime.now();
      review = Review(
        reviewId: 'review-123',
        userId: 'user-456',
        eventId: 'event-789',
        note: 5,
        commentaire: 'Great event!',
        verifie: true,
        createdAt: now,
        userNom: 'John Doe',
        userPhotoURL: 'https://example.com/photo.jpg',
      );
    });

    group('factory constructors', () {
      test('fromMap creates Review from valid map', () {
        final map = {
          'reviewId': 'review-123',
          'userId': 'user-456',
          'eventId': 'event-789',
          'note': 5,
          'commentaire': 'Amazing experience!',
          'verifie': true,
          'createdAt': Timestamp.fromDate(now),
          'user': {
            'nom': 'John Doe',
            'photoURL': 'https://example.com/photo.jpg',
          },
        };

        final result = Review.fromMap(map);

        expect(result.reviewId, 'review-123');
        expect(result.userId, 'user-456');
        expect(result.eventId, 'event-789');
        expect(result.note, 5);
        expect(result.commentaire, 'Amazing experience!');
        expect(result.verifie, true);
        expect(result.userNom, 'John Doe');
        expect(result.userPhotoURL, 'https://example.com/photo.jpg');
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = Review.fromMap(map);

        expect(result.reviewId, '');
        expect(result.userId, '');
        expect(result.eventId, '');
        expect(result.note, 0);
        expect(result.commentaire, '');
        expect(result.verifie, false);
      });

      test('fromMap accepts id as fallback for reviewId', () {
        final map = {
          'id': 'review-from-id',
          'userId': 'user-1',
          'eventId': 'event-1',
        };

        final result = Review.fromMap(map);

        expect(result.reviewId, 'review-from-id');
      });

      test('fromMap handles nested user object', () {
        final map = {
          'reviewId': 'review-1',
          'userId': 'user-1',
          'eventId': 'event-1',
          'user': {
            'nom': 'Jane Smith',
            'photoURL': 'https://example.com/jane.jpg',
          },
        };

        final result = Review.fromMap(map);

        expect(result.userNom, 'Jane Smith');
        expect(result.userPhotoURL, 'https://example.com/jane.jpg');
      });

      test('fromMap handles null user in nested object', () {
        final map = {
          'reviewId': 'review-1',
          'userId': 'user-1',
          'eventId': 'event-1',
          'user': null,
        };

        final result = Review.fromMap(map);

        expect(result.userNom, isNull);
        expect(result.userPhotoURL, isNull);
      });
    });

    group('toMap', () {
      test('converts Review to map correctly', () {
        final result = review.toMap();

        expect(result['reviewId'], 'review-123');
        expect(result['userId'], 'user-456');
        expect(result['eventId'], 'event-789');
        expect(result['note'], 5);
        expect(result['commentaire'], 'Great event!');
        expect(result['verifie'], true);
      });

      test('toMap excludes populated user fields', () {
        final result = review.toMap();

        expect(result.containsKey('userNom'), false);
        expect(result.containsKey('userPhotoURL'), false);
      });
    });
  });

  group('ReviewStats', () {
    test('fromMap creates ReviewStats from valid map', () {
      final map = {
        'totalReviews': 100,
        'averageRating': 4.5,
        'distribution': {'1': 5, '2': 10, '3': 15, '4': 30, '5': 40},
      };

      final result = ReviewStats.fromMap(map);

      expect(result.totalReviews, 100);
      expect(result.averageRating, 4.5);
      expect(result.distribution[1], 5);
      expect(result.distribution[2], 10);
      expect(result.distribution[3], 15);
      expect(result.distribution[4], 30);
      expect(result.distribution[5], 40);
    });

    test('fromMap handles null values with defaults', () {
      final map = <String, dynamic>{};

      final result = ReviewStats.fromMap(map);

      expect(result.totalReviews, 0);
      expect(result.averageRating, 0.0);
      expect(result.distribution[1], 0);
      expect(result.distribution[2], 0);
      expect(result.distribution[3], 0);
      expect(result.distribution[4], 0);
      expect(result.distribution[5], 0);
    });

    test('fromMap initializes distribution with zeros', () {
      final map = {'totalReviews': 50, 'averageRating': 3.8};

      final result = ReviewStats.fromMap(map);

      expect(result.distribution[1], 0);
      expect(result.distribution[2], 0);
      expect(result.distribution[3], 0);
      expect(result.distribution[4], 0);
      expect(result.distribution[5], 0);
    });

    test('fromMap handles numeric string keys', () {
      final map = {
        'totalReviews': 20,
        'averageRating': 4.0,
        'distribution': {'1': 2, '2': 3, '3': 5, '4': 5, '5': 5},
      };

      final result = ReviewStats.fromMap(map);

      expect(result.distribution[1], 2);
      expect(result.distribution[5], 5);
    });

    test('fromMap handles partial distribution', () {
      final map = {
        'totalReviews': 15,
        'averageRating': 4.2,
        'distribution': {'5': 10, '4': 5},
      };

      final result = ReviewStats.fromMap(map);

      expect(result.distribution[1], 0);
      expect(result.distribution[5], 10);
      expect(result.distribution[3], 0);
    });
  });
}
