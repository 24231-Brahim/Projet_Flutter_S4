class User {
  final String uid;
  final String nom;
  final String email;
  final String telephone;
  final String photoURL;
  final String role;
  final List<String> favoris;
  final String? fcmToken;
  final bool verifie;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.uid,
    required this.nom,
    required this.email,
    this.telephone = '',
    this.photoURL = '',
    this.role = 'user',
    this.favoris = const [],
    this.fcmToken,
    this.verifie = false,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isOrganisateur => role == 'organisateur' || role == 'admin';
  bool get isAdmin => role == 'admin';
  bool get isVerified => verifie;

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      uid: map['uid'] ?? '',
      nom: map['nom'] ?? '',
      email: map['email'] ?? '',
      telephone: map['telephone'] ?? '',
      photoURL: map['photoURL'] ?? '',
      role: map['role'] ?? 'user',
      favoris: List<String>.from(map['favoris'] ?? []),
      fcmToken: map['fcmToken'],
      verifie: map['verifie'] ?? false,
      createdAt: map['createdAt']?.toDate() ?? DateTime.now(),
      updatedAt: map['updatedAt']?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'nom': nom,
      'email': email,
      'telephone': telephone,
      'photoURL': photoURL,
      'role': role,
      'favoris': favoris,
      'fcmToken': fcmToken,
      'verifie': verifie,
    };
  }

  User copyWith({
    String? uid,
    String? nom,
    String? email,
    String? telephone,
    String? photoURL,
    String? role,
    List<String>? favoris,
    String? fcmToken,
    bool? verifie,
  }) {
    return User(
      uid: uid ?? this.uid,
      nom: nom ?? this.nom,
      email: email ?? this.email,
      telephone: telephone ?? this.telephone,
      photoURL: photoURL ?? this.photoURL,
      role: role ?? this.role,
      favoris: favoris ?? this.favoris,
      fcmToken: fcmToken ?? this.fcmToken,
      verifie: verifie ?? this.verifie,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
