class Ticket {
  final String ticketId;
  final String? eventId;
  final String type;
  final double prix;
  final int quantiteDisponible;
  final int quantiteVendue;
  final String description;
  final bool actif;

  Ticket({
    required this.ticketId,
    this.eventId,
    required this.type,
    required this.prix,
    required this.quantiteDisponible,
    this.quantiteVendue = 0,
    this.description = '',
    this.actif = true,
  });

  bool get isAvailable => actif && quantiteDisponible > 0;
  bool get isSoldOut => quantiteDisponible <= 0;
  bool get isStandard => type == 'standard';
  bool get isVip => type == 'vip';
  bool get isEarlyBird => type == 'early_bird';

  String get typeDisplay {
    switch (type) {
      case 'vip':
        return 'VIP';
      case 'early_bird':
        return 'Early Bird';
      default:
        return 'Standard';
    }
  }

  factory Ticket.fromMap(Map<String, dynamic> map) {
    return Ticket(
      ticketId: map['ticketId'] ?? map['id'] ?? '',
      eventId: map['eventId'],
      type: map['type'] ?? 'standard',
      prix: (map['prix'] ?? 0).toDouble(),
      quantiteDisponible: map['quantiteDisponible'] ?? 0,
      quantiteVendue: map['quantiteVendue'] ?? 0,
      description: map['description'] ?? '',
      actif: map['actif'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'ticketId': ticketId,
      'eventId': eventId,
      'type': type,
      'prix': prix,
      'quantiteDisponible': quantiteDisponible,
      'quantiteVendue': quantiteVendue,
      'description': description,
      'actif': actif,
    };
  }
}
