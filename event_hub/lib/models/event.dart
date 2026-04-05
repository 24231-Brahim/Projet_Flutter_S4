import 'package:cloud_firestore/cloud_firestore.dart';
import 'ticket.dart';

class Event {
  final String eventId;
  final String organisateurId;
  final String titre;
  final String description;
  final String categorie;
  final String imageURL;
  final String lieu;
  final GeoPoint? localisation;
  final DateTime dateDebut;
  final DateTime dateFin;
  final int capaciteTotale;
  final int placesRestantes;
  final bool estPublie;
  final String statut;
  final List<String> tags;
  final double? averageRating;
  final int? reviewCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Event({
    required this.eventId,
    required this.organisateurId,
    required this.titre,
    required this.description,
    required this.categorie,
    this.imageURL = '',
    required this.lieu,
    this.localisation,
    required this.dateDebut,
    required this.dateFin,
    required this.capaciteTotale,
    required this.placesRestantes,
    this.estPublie = false,
    this.statut = 'draft',
    this.tags = const [],
    this.averageRating,
    this.reviewCount,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isPublished => estPublie && statut == 'published';
  bool get isCancelled => statut == 'cancelled';
  bool get isCompleted => statut == 'completed';
  bool get isDraft => statut == 'draft';
  bool get isAvailable => isPublished && placesRestantes > 0;
  bool get isSoldOut => placesRestantes <= 0;
  bool get isPast => dateFin.isBefore(DateTime.now());
  bool get isUpcoming => dateDebut.isAfter(DateTime.now());

  double get occupancyRate {
    if (capaciteTotale == 0) return 0;
    return ((capaciteTotale - placesRestantes) / capaciteTotale) * 100;
  }

  factory Event.fromMap(Map<String, dynamic> map) {
    return Event(
      eventId: map['eventId'] ?? '',
      organisateurId: map['organisateurId'] ?? '',
      titre: map['titre'] ?? '',
      description: map['description'] ?? '',
      categorie: map['categorie'] ?? '',
      imageURL: map['imageURL'] ?? '',
      lieu: map['lieu'] ?? '',
      localisation: map['localisation'],
      dateDebut: map['dateDebut']?.toDate() ?? DateTime.now(),
      dateFin: map['dateFin']?.toDate() ?? DateTime.now(),
      capaciteTotale: map['capaciteTotale'] ?? 0,
      placesRestantes: map['placesRestantes'] ?? 0,
      estPublie: map['estPublie'] ?? false,
      statut: map['statut'] ?? 'draft',
      tags: List<String>.from(map['tags'] ?? []),
      averageRating: map['averageRating']?.toDouble(),
      reviewCount: map['reviewCount'],
      createdAt: map['createdAt']?.toDate() ?? DateTime.now(),
      updatedAt: map['updatedAt']?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'eventId': eventId,
      'organisateurId': organisateurId,
      'titre': titre,
      'description': description,
      'categorie': categorie,
      'imageURL': imageURL,
      'lieu': lieu,
      'localisation': localisation,
      'dateDebut': dateDebut,
      'dateFin': dateFin,
      'capaciteTotale': capaciteTotale,
      'placesRestantes': placesRestantes,
      'estPublie': estPublie,
      'statut': statut,
      'tags': tags,
      'averageRating': averageRating,
      'reviewCount': reviewCount,
    };
  }

  Event copyWith({
    String? titre,
    String? description,
    String? categorie,
    String? imageURL,
    String? lieu,
    GeoPoint? localisation,
    DateTime? dateDebut,
    DateTime? dateFin,
    int? capaciteTotale,
    int? placesRestantes,
    bool? estPublie,
    String? statut,
    List<String>? tags,
    double? averageRating,
    int? reviewCount,
  }) {
    return Event(
      eventId: eventId,
      organisateurId: organisateurId,
      titre: titre ?? this.titre,
      description: description ?? this.description,
      categorie: categorie ?? this.categorie,
      imageURL: imageURL ?? this.imageURL,
      lieu: lieu ?? this.lieu,
      localisation: localisation ?? this.localisation,
      dateDebut: dateDebut ?? this.dateDebut,
      dateFin: dateFin ?? this.dateFin,
      capaciteTotale: capaciteTotale ?? this.capaciteTotale,
      placesRestantes: placesRestantes ?? this.placesRestantes,
      estPublie: estPublie ?? this.estPublie,
      statut: statut ?? this.statut,
      tags: tags ?? this.tags,
      averageRating: averageRating ?? this.averageRating,
      reviewCount: reviewCount ?? this.reviewCount,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

class EventWithTickets {
  final Event event;
  final List<Ticket> tickets;

  EventWithTickets({required this.event, required this.tickets});

  factory EventWithTickets.fromMap(
    Map<String, dynamic> map,
    List<Ticket> tickets,
  ) {
    return EventWithTickets(event: Event.fromMap(map), tickets: tickets);
  }
}
