import 'package:flutter_test/flutter_test.dart';
import 'package:event_hub/models/ticket.dart';

void main() {
  group('Ticket', () {
    late Ticket ticket;

    setUp(() {
      ticket = Ticket(
        ticketId: 'ticket-123',
        eventId: 'event-456',
        type: 'standard',
        prix: 50.0,
        quantiteDisponible: 100,
        quantiteVendue: 25,
        description: 'Standard admission ticket',
        actif: true,
      );
    });

    group('factory constructors', () {
      test('fromMap creates Ticket from valid map', () {
        final map = {
          'ticketId': 'ticket-123',
          'eventId': 'event-456',
          'type': 'vip',
          'prix': 100.0,
          'quantiteDisponible': 50,
          'quantiteVendue': 10,
          'description': 'VIP experience',
          'actif': true,
        };

        final result = Ticket.fromMap(map);

        expect(result.ticketId, 'ticket-123');
        expect(result.eventId, 'event-456');
        expect(result.type, 'vip');
        expect(result.prix, 100.0);
        expect(result.quantiteDisponible, 50);
        expect(result.quantiteVendue, 10);
        expect(result.description, 'VIP experience');
        expect(result.actif, true);
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = Ticket.fromMap(map);

        expect(result.ticketId, '');
        expect(result.eventId, isNull);
        expect(result.type, 'standard');
        expect(result.prix, 0.0);
        expect(result.quantiteDisponible, 0);
        expect(result.quantiteVendue, 0);
        expect(result.description, '');
        expect(result.actif, true);
      });

      test('fromMap accepts id as fallback for ticketId', () {
        final map = {'id': 'ticket-from-id', 'type': 'standard'};

        final result = Ticket.fromMap(map);

        expect(result.ticketId, 'ticket-from-id');
      });

      test('fromMap handles numeric prix', () {
        final map = {'ticketId': 'ticket-1', 'type': 'standard', 'prix': 75};

        final result = Ticket.fromMap(map);

        expect(result.prix, 75.0);
      });
    });

    group('toMap', () {
      test('converts Ticket to map correctly', () {
        final result = ticket.toMap();

        expect(result['ticketId'], 'ticket-123');
        expect(result['eventId'], 'event-456');
        expect(result['type'], 'standard');
        expect(result['prix'], 50.0);
        expect(result['quantiteDisponible'], 100);
        expect(result['quantiteVendue'], 25);
        expect(result['description'], 'Standard admission ticket');
        expect(result['actif'], true);
      });
    });

    group('computed properties', () {
      test('isAvailable returns true when actif and has quantity', () {
        expect(ticket.isAvailable, true);
      });

      test('isAvailable returns false when not actif', () {
        final inactiveTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'standard',
          prix: 50.0,
          quantiteDisponible: 100,
          actif: false,
        );

        expect(inactiveTicket.isAvailable, false);
      });

      test('isAvailable returns false when sold out', () {
        final soldOutTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'standard',
          prix: 50.0,
          quantiteDisponible: 0,
          actif: true,
        );

        expect(soldOutTicket.isAvailable, false);
      });

      test('isSoldOut returns true when no quantity available', () {
        expect(ticket.isSoldOut, false);

        final soldOutTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'standard',
          prix: 50.0,
          quantiteDisponible: 0,
        );

        expect(soldOutTicket.isSoldOut, true);
      });

      test('isStandard returns true for standard type', () {
        expect(ticket.isStandard, true);

        final vipTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'vip',
          prix: 100.0,
          quantiteDisponible: 50,
        );

        expect(vipTicket.isStandard, false);
      });

      test('isVip returns true for vip type', () {
        final vipTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'vip',
          prix: 100.0,
          quantiteDisponible: 50,
        );

        expect(vipTicket.isVip, true);
        expect(ticket.isVip, false);
      });

      test('isEarlyBird returns true for early_bird type', () {
        final earlyBirdTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'early_bird',
          prix: 40.0,
          quantiteDisponible: 50,
        );

        expect(earlyBirdTicket.isEarlyBird, true);
        expect(ticket.isEarlyBird, false);
      });
    });

    group('typeDisplay', () {
      test('returns "VIP" for vip type', () {
        final vipTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'vip',
          prix: 100.0,
          quantiteDisponible: 50,
        );

        expect(vipTicket.typeDisplay, 'VIP');
      });

      test('returns "Early Bird" for early_bird type', () {
        final earlyBirdTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'early_bird',
          prix: 40.0,
          quantiteDisponible: 50,
        );

        expect(earlyBirdTicket.typeDisplay, 'Early Bird');
      });

      test('returns "Standard" for standard type', () {
        expect(ticket.typeDisplay, 'Standard');
      });

      test('returns "Standard" for unknown type', () {
        final unknownTicket = Ticket(
          ticketId: 'ticket-1',
          type: 'unknown_type',
          prix: 50.0,
          quantiteDisponible: 50,
        );

        expect(unknownTicket.typeDisplay, 'Standard');
      });
    });
  });
}
