class Review {
  final String reviewId;
  final String userId;
  final String eventId;
  final int note;
  final String commentaire;
  final bool verifie;
  final DateTime createdAt;

  // Populated fields
  final String? userNom;
  final String? userPhotoURL;

  Review({
    required this.reviewId,
    required this.userId,
    required this.eventId,
    required this.note,
    this.commentaire = '',
    this.verifie = false,
    required this.createdAt,
    this.userNom,
    this.userPhotoURL,
  });

  factory Review.fromMap(Map<String, dynamic> map) {
    Map<String, dynamic>? userData;
    if (map['user'] != null && map['user'] is Map) {
      userData = Map<String, dynamic>.from(map['user']);
    }

    return Review(
      reviewId: map['reviewId'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      eventId: map['eventId'] ?? '',
      note: map['note'] ?? 0,
      commentaire: map['commentaire'] ?? '',
      verifie: map['verifie'] ?? false,
      createdAt: map['createdAt']?.toDate() ?? DateTime.now(),
      userNom: userData?['nom'],
      userPhotoURL: userData?['photoURL'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'reviewId': reviewId,
      'userId': userId,
      'eventId': eventId,
      'note': note,
      'commentaire': commentaire,
      'verifie': verifie,
      'createdAt': createdAt,
    };
  }
}

class ReviewStats {
  final int totalReviews;
  final double averageRating;
  final Map<int, int> distribution;

  ReviewStats({
    required this.totalReviews,
    required this.averageRating,
    required this.distribution,
  });

  factory ReviewStats.fromMap(Map<String, dynamic> map) {
    final dist = Map<int, int>.from({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
    if (map['distribution'] != null) {
      (map['distribution'] as Map).forEach((key, value) {
        dist[int.parse(key.toString())] = value;
      });
    }

    return ReviewStats(
      totalReviews: map['totalReviews'] ?? 0,
      averageRating: (map['averageRating'] ?? 0).toDouble(),
      distribution: dist,
    );
  }
}
