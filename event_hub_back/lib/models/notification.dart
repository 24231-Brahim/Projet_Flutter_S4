class AppNotification {
  final String notifId;
  final String userId;
  final String titre;
  final String corps;
  final String type;
  final Map<String, String> data;
  final bool lue;
  final DateTime envoyeAt;

  AppNotification({
    required this.notifId,
    required this.userId,
    required this.titre,
    required this.corps,
    required this.type,
    this.data = const {},
    this.lue = false,
    required this.envoyeAt,
  });

  bool get isRead => lue;
  bool get isBookingConfirmed => type == 'booking_confirmed';
  bool get isEventReminder => type == 'event_reminder';
  bool get isTicketReady => type == 'ticket_ready';
  bool get isCancellation => type == 'cancellation';
  bool get isPromotion => type == 'promotion';

  factory AppNotification.fromMap(Map<String, dynamic> map) {
    return AppNotification(
      notifId: map['notifId'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      titre: map['titre'] ?? '',
      corps: map['corps'] ?? '',
      type: map['type'] ?? '',
      data: Map<String, String>.from(map['data'] ?? {}),
      lue: map['lue'] ?? false,
      envoyeAt: map['envoyeAt']?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'notifId': notifId,
      'userId': userId,
      'titre': titre,
      'corps': corps,
      'type': type,
      'data': data,
      'lue': lue,
      'envoyeAt': envoyeAt,
    };
  }
}
