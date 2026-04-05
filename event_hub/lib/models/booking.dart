import 'event.dart';
import 'ticket.dart';

class Booking {
  final String bookingId;
  final String userId;
  final String eventId;
  final String ticketId;
  final int quantite;
  final double montantTotal;
  final String devise;
  final String statut;
  final String? qrCodeToken;
  final String? qrCodeURL;
  final String? pdfURL;
  final String? paymentId;
  final DateTime? scannedAt;
  final DateTime dateReservation;
  final DateTime updatedAt;

  // Populated fields
  final Event? event;
  final Ticket? ticket;

  Booking({
    required this.bookingId,
    required this.userId,
    required this.eventId,
    required this.ticketId,
    required this.quantite,
    required this.montantTotal,
    this.devise = 'USD',
    this.statut = 'pending',
    this.qrCodeToken,
    this.qrCodeURL,
    this.pdfURL,
    this.paymentId,
    this.scannedAt,
    required this.dateReservation,
    required this.updatedAt,
    this.event,
    this.ticket,
  });

  bool get isPending => statut == 'pending';
  bool get isConfirmed => statut == 'confirmed';
  bool get isCancelled => statut == 'cancelled';
  bool get isRefunded => statut == 'refunded';
  bool get isUsed => statut == 'used';
  bool get isScanned => scannedAt != null;

  factory Booking.fromMap(Map<String, dynamic> map) {
    Event? event;
    Ticket? ticket;

    if (map['event'] != null && map['event'] is Map) {
      event = Event.fromMap(Map<String, dynamic>.from(map['event']));
    }

    if (map['ticket'] != null && map['ticket'] is Map) {
      ticket = Ticket.fromMap(Map<String, dynamic>.from(map['ticket']));
    }

    return Booking(
      bookingId: map['bookingId'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      eventId: map['eventId'] ?? '',
      ticketId: map['ticketId'] ?? '',
      quantite: map['quantite'] ?? 0,
      montantTotal: (map['montantTotal'] ?? 0).toDouble(),
      devise: map['devise'] ?? 'USD',
      statut: map['statut'] ?? 'pending',
      qrCodeToken: map['qrCodeToken'],
      qrCodeURL: map['qrCodeURL'],
      pdfURL: map['pdfURL'],
      paymentId: map['paymentId'],
      scannedAt: map['scannedAt']?.toDate(),
      dateReservation: map['dateReservation']?.toDate() ?? DateTime.now(),
      updatedAt: map['updatedAt']?.toDate() ?? DateTime.now(),
      event: event,
      ticket: ticket,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'bookingId': bookingId,
      'userId': userId,
      'eventId': eventId,
      'ticketId': ticketId,
      'quantite': quantite,
      'montantTotal': montantTotal,
      'devise': devise,
      'statut': statut,
      'qrCodeToken': qrCodeToken,
      'qrCodeURL': qrCodeURL,
      'pdfURL': pdfURL,
      'paymentId': paymentId,
      'scannedAt': scannedAt,
      'dateReservation': dateReservation,
      'updatedAt': updatedAt,
    };
  }
}

class BookingWithClientSecret {
  final String bookingId;
  final String? clientSecret;
  final String? paymentId;
  final double montantTotal;
  final String statut;

  BookingWithClientSecret({
    required this.bookingId,
    this.clientSecret,
    this.paymentId,
    required this.montantTotal,
    required this.statut,
  });

  factory BookingWithClientSecret.fromMap(Map<String, dynamic> map) {
    return BookingWithClientSecret(
      bookingId: map['bookingId'] ?? '',
      clientSecret: map['clientSecret'],
      paymentId: map['paymentId'],
      montantTotal: (map['montantTotal'] ?? 0).toDouble(),
      statut: map['statut'] ?? 'pending',
    );
  }
}
