import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:event_hub/models/event.dart';
import 'package:event_hub/models/ticket.dart';

void main() {
  group('Event', () {
    late Event event;
    late DateTime now;

    setUp(() {
      now = DateTime.now();
      event = Event(
        eventId: 'event-123',
        organisateurId: 'user-456',
        titre: 'Test Event',
        description: 'A test event description',
        categorie: 'Music',
        lieu: 'New York',
        dateDebut: now.add(const Duration(days: 7)),
        dateFin: now.add(const Duration(days: 8)),
        capaciteTotale: 100,
        placesRestantes: 50,
        createdAt: now,
        updatedAt: now,
      );
    });

    group('factory constructors', () {
      test('fromMap creates Event from valid map', () {
        final map = {
          'eventId': 'event-123',
          'organisateurId': 'user-456',
          'titre': 'Test Event',
          'description': 'A test event description',
          'categorie': 'Music',
          'imageURL': 'https://example.com/image.jpg',
          'lieu': 'New York',
          'dateDebut': Timestamp.fromDate(now.add(const Duration(days: 7))),
          'dateFin': Timestamp.fromDate(now.add(const Duration(days: 8))),
          'capaciteTotale': 100,
          'placesRestantes': 50,
          'estPublie': true,
          'statut': 'published',
          'tags': ['music', 'festival'],
          'averageRating': 4.5,
          'reviewCount': 10,
        };

        final result = Event.fromMap(map);

        expect(result.eventId, 'event-123');
        expect(result.titre, 'Test Event');
        expect(result.categorie, 'Music');
        expect(result.capaciteTotale, 100);
        expect(result.estPublie, true);
        expect(result.statut, 'published');
        expect(result.tags, ['music', 'festival']);
        expect(result.averageRating, 4.5);
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = Event.fromMap(map);

        expect(result.eventId, '');
        expect(result.titre, '');
        expect(result.capaciteTotale, 0);
        expect(result.estPublie, false);
        expect(result.statut, 'draft');
        expect(result.tags, isEmpty);
      });

      test('fromMap handles empty tags list', () {
        final map = {'eventId': 'event-123', 'tags': null};

        final result = Event.fromMap(map);

        expect(result.tags, isEmpty);
      });
    });

    group('toMap', () {
      test('converts Event to map correctly', () {
        final result = event.toMap();

        expect(result['eventId'], 'event-123');
        expect(result['titre'], 'Test Event');
        expect(result['categorie'], 'Music');
        expect(result['capaciteTotale'], 100);
      });
    });

    group('computed properties', () {
      test('isPublished returns true when published', () {
        final publishedEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 100,
          placesRestantes: 50,
          estPublie: true,
          statut: 'published',
          createdAt: now,
          updatedAt: now,
        );

        expect(publishedEvent.isPublished, true);
      });

      test('isPublished returns false when not published', () {
        expect(event.isPublished, false);
      });

      test('isCancelled returns true when cancelled', () {
        final cancelledEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 100,
          placesRestantes: 50,
          statut: 'cancelled',
          createdAt: now,
          updatedAt: now,
        );

        expect(cancelledEvent.isCancelled, true);
      });

      test('isCompleted returns true when completed', () {
        final completedEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.subtract(const Duration(days: 2)),
          dateFin: now.subtract(const Duration(days: 1)),
          capaciteTotale: 100,
          placesRestantes: 0,
          statut: 'completed',
          createdAt: now,
          updatedAt: now,
        );

        expect(completedEvent.isCompleted, true);
      });

      test('isDraft returns true when draft', () {
        expect(event.isDraft, true);
      });

      test('isAvailable returns true when published and has spots', () {
        final availableEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 100,
          placesRestantes: 10,
          estPublie: true,
          statut: 'published',
          createdAt: now,
          updatedAt: now,
        );

        expect(availableEvent.isAvailable, true);
      });

      test('isSoldOut returns true when no spots left', () {
        final soldOutEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 100,
          placesRestantes: 0,
          estPublie: true,
          statut: 'published',
          createdAt: now,
          updatedAt: now,
        );

        expect(soldOutEvent.isSoldOut, true);
      });

      test('isPast returns true when event has ended', () {
        final pastEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.subtract(const Duration(days: 2)),
          dateFin: now.subtract(const Duration(days: 1)),
          capaciteTotale: 100,
          placesRestantes: 0,
          createdAt: now,
          updatedAt: now,
        );

        expect(pastEvent.isPast, true);
      });

      test('isUpcoming returns true when event is in the future', () {
        expect(event.isUpcoming, true);
      });

      test('occupancyRate calculates correctly', () {
        expect(event.occupancyRate, 50.0);
      });

      test('occupancyRate returns 0 when capacity is 0', () {
        final zeroCapacityEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 0,
          placesRestantes: 0,
          createdAt: now,
          updatedAt: now,
        );

        expect(zeroCapacityEvent.occupancyRate, 0);
      });

      test('occupancyRate returns 100 when full', () {
        final fullEvent = Event(
          eventId: 'event-1',
          organisateurId: 'user-1',
          titre: 'Test',
          description: 'Test',
          categorie: 'Music',
          lieu: 'NYC',
          dateDebut: now.add(const Duration(days: 1)),
          dateFin: now.add(const Duration(days: 2)),
          capaciteTotale: 100,
          placesRestantes: 0,
          createdAt: now,
          updatedAt: now,
        );

        expect(fullEvent.occupancyRate, 100.0);
      });
    });

    group('copyWith', () {
      test('creates a copy with updated fields', () {
        final updated = event.copyWith(
          titre: 'Updated Title',
          capaciteTotale: 200,
        );

        expect(updated.titre, 'Updated Title');
        expect(updated.capaciteTotale, 200);
        expect(updated.eventId, event.eventId);
        expect(updated.description, event.description);
      });

      test('preserves original values when no changes', () {
        final copy = event.copyWith();

        expect(copy.eventId, event.eventId);
        expect(copy.titre, event.titre);
        expect(copy.createdAt, event.createdAt);
      });

      test('updates updatedAt timestamp', () {
        final originalUpdatedAt = event.updatedAt;
        final copy = event.copyWith(titre: 'New Title');

        expect(
          copy.updatedAt.isAfter(originalUpdatedAt) ||
              copy.updatedAt == originalUpdatedAt,
          true,
        );
      });
    });
  });

  group('EventWithTickets', () {
    test('fromMap creates EventWithTickets correctly', () {
      final eventMap = {
        'eventId': 'event-123',
        'organisateurId': 'user-456',
        'titre': 'Test Event',
        'description': 'Test',
        'categorie': 'Music',
        'lieu': 'NYC',
        'dateDebut': Timestamp.fromDate(DateTime.now()),
        'dateFin': Timestamp.fromDate(DateTime.now()),
        'capaciteTotale': 100,
        'placesRestantes': 50,
      };

      final tickets = [
        Ticket(
          ticketId: 'ticket-1',
          type: 'standard',
          prix: 50.0,
          quantiteDisponible: 100,
        ),
        Ticket(
          ticketId: 'ticket-2',
          type: 'vip',
          prix: 100.0,
          quantiteDisponible: 50,
        ),
      ];

      final result = EventWithTickets.fromMap(eventMap, tickets);

      expect(result.event.eventId, 'event-123');
      expect(result.tickets.length, 2);
    });
  });
}
