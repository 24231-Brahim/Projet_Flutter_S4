import 'dart:async';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  final String? code;

  ApiException(this.message, {this.code});

  @override
  String toString() => message;
}

class ApiService {
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(milliseconds: 500);

  final Map<String, HttpsCallable> _callableCache = {};

  HttpsCallable _getCallable(String functionName) {
    if (_callableCache.containsKey(functionName)) {
      return _callableCache[functionName]!;
    }
    final callable = FirebaseFunctions.instance.httpsCallable(functionName);
    _callableCache[functionName] = callable;
    return callable;
  }

  Future<Map<String, dynamic>> _call(
    String functionName, [
    Map<String, dynamic>? data,
  ]) async {
    int attempts = 0;
    while (attempts < _maxRetries) {
      try {
        final callable = _getCallable(functionName);
        final result = await callable(data ?? {});
        if (result.data['error'] != null) {
          throw ApiException(
            result.data['error']['message'] ?? 'Unknown error',
            code: result.data['error']['code'],
          );
        }
        return Map<String, dynamic>.from(result.data);
      } on FirebaseFunctionsException catch (e) {
        attempts++;
        if (attempts >= _maxRetries) {
          throw ApiException(e.message ?? 'Function error', code: e.code);
        }
        await Future.delayed(_retryDelay * attempts);
      }
    }
    throw ApiException('Max retries exceeded');
  }

  Future<T> _callWithCache<T>({
    required String functionName,
    Map<String, dynamic>? data,
    required T Function(Map<String, dynamic>) parser,
    Duration cacheDuration = const Duration(minutes: 5),
  }) async {
    final cacheKey = '${functionName}_${data?.toString() ?? 'default'}';
    final cached = _cache[cacheKey];
    if (cached != null && !cached.isExpired) {
      return cached as T;
    }

    final result = await _call(functionName, data);
    final parsed = parser(result);
    _cache[cacheKey] = _CacheEntry(
      data: parsed,
      expiresAt: DateTime.now().add(cacheDuration),
    );
    return parsed;
  }

  final Map<String, _CacheEntry> _cache = {};

  void invalidateCache([String? prefix]) {
    if (prefix == null) {
      _cache.clear();
      return;
    }
    _cache.removeWhere((key, _) => key.startsWith(prefix));
  }

  // ==================== EVENT FUNCTIONS ====================

  Future<String> createEvent({
    required String titre,
    required String description,
    required String categorie,
    String? imageURL,
    required String lieu,
    double? latitude,
    double? longitude,
    required DateTime dateDebut,
    required DateTime dateFin,
    required int capaciteTotale,
    List<String>? tags,
  }) async {
    final result = await _call('createEvent', {
      'titre': titre,
      'description': description,
      'categorie': categorie,
      'imageURL': imageURL,
      'lieu': lieu,
      'latitude': latitude,
      'longitude': longitude,
      'dateDebut': dateDebut.millisecondsSinceEpoch,
      'dateFin': dateFin.millisecondsSinceEpoch,
      'capaciteTotale': capaciteTotale,
      'tags': tags ?? [],
    });
    invalidateCache('upcoming_events');
    return result['eventId'];
  }

  Future<void> updateEvent({
    required String eventId,
    String? titre,
    String? description,
    String? categorie,
    String? imageURL,
    String? lieu,
    double? latitude,
    double? longitude,
    DateTime? dateDebut,
    DateTime? dateFin,
    int? capaciteTotale,
    List<String>? tags,
  }) async {
    await _call('updateEvent', {
      'eventId': eventId,
      if (titre != null) 'titre': titre,
      if (description != null) 'description': description,
      if (categorie != null) 'categorie': categorie,
      if (imageURL != null) 'imageURL': imageURL,
      if (lieu != null) 'lieu': lieu,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (dateDebut != null) 'dateDebut': dateDebut.millisecondsSinceEpoch,
      if (dateFin != null) 'dateFin': dateFin.millisecondsSinceEpoch,
      if (capaciteTotale != null) 'capaciteTotale': capaciteTotale,
      if (tags != null) 'tags': tags,
    });
    invalidateCache('upcoming_events');
  }

  Future<void> publishEvent(String eventId) async {
    await _call('publishEvent', {'eventId': eventId});
    invalidateCache('upcoming_events');
  }

  Future<void> cancelEvent(String eventId, {String? reason}) async {
    await _call('cancelEvent', {
      'eventId': eventId,
      if (reason != null) 'reason': reason,
    });
    invalidateCache('upcoming_events');
  }

  Future<Map<String, dynamic>> getUpcomingEvents({
    String? categorie,
    int? limit,
    String? cursor,
  }) async {
    final result = await _call('getUpcomingEvents', {
      if (categorie != null) 'categorie': categorie,
      'limit': limit ?? 20,
      if (cursor != null) 'cursor': cursor,
    });

    final events = (result['events'] as List)
        .map((e) => Event.fromMap(Map<String, dynamic>.from(e)))
        .toList();

    return {'events': events, 'nextCursor': result['nextCursor']};
  }

  Future<List<Event>> searchEvents({
    required String query,
    double? latitude,
    double? longitude,
    double? radiusKm,
    int? limit,
  }) async {
    final result = await _call('searchEvents', {
      'query': query,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (radiusKm != null) 'radiusKm': radiusKm,
      'limit': limit ?? 20,
    });

    return (result['events'] as List)
        .map((e) => Event.fromMap(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<Map<String, dynamic>> getEventDetails(String eventId) async {
    return await _callWithCache<Map<String, dynamic>>(
      functionName: 'getEventDetails',
      data: {'eventId': eventId},
      cacheDuration: const Duration(minutes: 2),
      parser: (data) => {
        'event': Event.fromMap(Map<String, dynamic>.from(data['event'])),
        'tickets': (data['tickets'] as List)
            .map((t) => Ticket.fromMap(Map<String, dynamic>.from(t)))
            .toList(),
        'reviews': (data['reviews'] as List)
            .map((r) => Review.fromMap(Map<String, dynamic>.from(r)))
            .toList(),
        'averageRating': data['averageRating'],
        'isFavorite': data['isFavorite'] ?? false,
      },
    );
  }

  // ==================== BOOKING FUNCTIONS ====================

  Future<BookingWithClientSecret> createBooking({
    required String eventId,
    required String ticketId,
    required int quantite,
  }) async {
    final result = await _call('createBooking', {
      'eventId': eventId,
      'ticketId': ticketId,
      'quantite': quantite,
    });
    invalidateCache('user_bookings');
    return BookingWithClientSecret.fromMap(Map<String, dynamic>.from(result));
  }

  Future<Map<String, String>> confirmBooking(String bookingId) async {
    final result = await _call('confirmBooking', {'bookingId': bookingId});
    invalidateCache('user_bookings');
    return {
      'qrCodeURL': result['qrCodeURL'] ?? '',
      'pdfURL': result['pdfURL'] ?? '',
    };
  }

  Future<void> cancelBooking(String bookingId, {String? reason}) async {
    await _call('cancelBooking', {
      'bookingId': bookingId,
      if (reason != null) 'reason': reason,
    });
    invalidateCache('user_bookings');
  }

  Future<Map<String, dynamic>> getUserBookingsPaginated({
    String? statut,
    int? limit,
    String? cursor,
  }) async {
    final result = await _call('getUserBookings', {
      if (statut != null) 'statut': statut,
      'limit': limit ?? 20,
      if (cursor != null) 'cursor': cursor,
    });

    final bookings = (result['bookings'] as List)
        .map((b) => Booking.fromMap(Map<String, dynamic>.from(b)))
        .toList();

    return {'bookings': bookings, 'nextCursor': result['nextCursor']};
  }

  Future<List<Booking>> getUserBookings({String? statut, int? limit}) async {
    final result = await getUserBookingsPaginated(statut: statut, limit: limit);
    return result['bookings'] as List<Booking>;
  }

  Future<Booking> getBookingById(String bookingId) async {
    final result = await _call('getBookingDetails', {'bookingId': bookingId});
    return Booking.fromMap(Map<String, dynamic>.from(result['booking']));
  }

  // ==================== TICKET FUNCTIONS ====================

  Future<String> addTicket({
    required String eventId,
    required String type,
    required double prix,
    required int quantiteDisponible,
    String? description,
  }) async {
    final result = await _call('addTicket', {
      'eventId': eventId,
      'type': type,
      'prix': prix,
      'quantiteDisponible': quantiteDisponible,
      if (description != null) 'description': description,
    });
    invalidateCache('event_$eventId');
    return result['ticketId'];
  }

  Future<Map<String, String>> validateTicket(String qrCodeToken) async {
    final result = await _call('validateTicket', {'qrCodeToken': qrCodeToken});
    return Map<String, String>.from(result);
  }

  // ==================== USER FUNCTIONS ====================

  Future<User> getUserProfile() async {
    return await _callWithCache<User>(
      functionName: 'getUserProfile',
      cacheDuration: const Duration(minutes: 10),
      parser: (data) => User.fromMap(Map<String, dynamic>.from(data['user'])),
    );
  }

  Future<void> updateUserProfile({
    String? nom,
    String? telephone,
    String? photoURL,
  }) async {
    await _call('updateUserProfile', {
      if (nom != null) 'nom': nom,
      if (telephone != null) 'telephone': telephone,
      if (photoURL != null) 'photoURL': photoURL,
    });
    invalidateCache('user_profile');
  }

  Future<void> updateFcmToken(String fcmToken) async {
    await _call('updateFCMToken', {'fcmToken': fcmToken});
  }

  Future<void> addToFavorites(String eventId) async {
    await _call('addToFavorites', {'eventId': eventId});
    invalidateCache('favorites');
  }

  Future<void> removeFromFavorites(String eventId) async {
    await _call('removeFromFavorites', {'eventId': eventId});
    invalidateCache('favorites');
  }

  Future<List<Event>> getFavorites() async {
    return await _callWithCache<List<Event>>(
      functionName: 'getFavorites',
      cacheDuration: const Duration(minutes: 2),
      parser: (data) => (data['events'] as List)
          .map((e) => Event.fromMap(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }

  // ==================== REVIEW FUNCTIONS ====================

  Future<String> createReview({
    required String eventId,
    required int note,
    String? commentaire,
  }) async {
    final result = await _call('createReview', {
      'eventId': eventId,
      'note': note,
      if (commentaire != null) 'commentaire': commentaire,
    });
    invalidateCache('event_$eventId');
    return result['reviewId'];
  }

  Future<Map<String, dynamic>> getEventReviews(
    String eventId, {
    int? limit,
    String? cursor,
  }) async {
    final result = await _call('getEventReviews', {
      'eventId': eventId,
      'limit': limit ?? 20,
      if (cursor != null) 'cursor': cursor,
    });
    return {
      'reviews': (result['reviews'] as List)
          .map((r) => Review.fromMap(Map<String, dynamic>.from(r)))
          .toList(),
      'stats': ReviewStats.fromMap(Map<String, dynamic>.from(result['stats'])),
      'nextCursor': result['nextCursor'],
    };
  }

  // ==================== NOTIFICATION FUNCTIONS ====================

  Future<Map<String, dynamic>> getUserNotifications({
    bool? unreadOnly,
    int? limit,
  }) async {
    final result = await _call('getUserNotifications', {
      if (unreadOnly == true) 'unreadOnly': true,
      'limit': limit ?? 50,
    });
    return {
      'notifications': (result['notifications'] as List)
          .map((n) => AppNotification.fromMap(Map<String, dynamic>.from(n)))
          .toList(),
      'unreadCount': result['unreadCount'] ?? 0,
    };
  }

  Future<void> markNotificationRead(String notifId) async {
    await _call('markNotificationRead', {'notifId': notifId});
  }

  Future<void> markAllNotificationsRead() async {
    await _call('markAllNotificationsRead');
  }

  // ==================== ORGANIZER FUNCTIONS ====================

  Future<List<Event>> getOrganizerEvents({String? statut, int? limit}) async {
    return await _callWithCache<List<Event>>(
      functionName: 'getOrganizerEvents',
      data: {'statut': statut, 'limit': limit ?? 50},
      cacheDuration: const Duration(minutes: 2),
      parser: (data) => (data['events'] as List)
          .map((e) => Event.fromMap(Map<String, dynamic>.from(e)))
          .toList(),
    );
  }

  Future<void> deleteEvent(String eventId) async {
    await _call('deleteEvent', {'eventId': eventId});
    invalidateCache('organizer_events');
  }

  // ==================== BOOKING DETAILS ====================

  Future<Map<String, dynamic>> getBookingDetails(String bookingId) async {
    return await _callWithCache<Map<String, dynamic>>(
      functionName: 'getBookingDetails',
      data: {'bookingId': bookingId},
      cacheDuration: const Duration(minutes: 5),
      parser: (data) => {
        'booking': Booking.fromMap(Map<String, dynamic>.from(data['booking'])),
        'event': Event.fromMap(Map<String, dynamic>.from(data['event'])),
        'ticket': Ticket.fromMap(Map<String, dynamic>.from(data['ticket'])),
      },
    );
  }

  Future<List<Map<String, dynamic>>> getEventAttendees(
    String eventId, {
    int? limit,
  }) async {
    final result = await _call('getEventAttendees', {
      'eventId': eventId,
      'limit': limit ?? 50,
    });
    return List<Map<String, dynamic>>.from(result['attendees']);
  }

  // ==================== REVIEW FUNCTIONS ====================

  Future<void> updateReview({
    required String reviewId,
    int? note,
    String? commentaire,
  }) async {
    await _call('updateReview', {
      'reviewId': reviewId,
      if (note != null) 'note': note,
      if (commentaire != null) 'commentaire': commentaire,
    });
  }

  Future<void> deleteReview(String reviewId) async {
    await _call('deleteReview', {'reviewId': reviewId});
  }

  Future<List<Review>> getUserReviews({int? limit}) async {
    final result = await _call('getUserReviews', {'limit': limit ?? 20});
    return (result['reviews'] as List)
        .map((r) => Review.fromMap(Map<String, dynamic>.from(r)))
        .toList();
  }

  Future<void> reportReview(String reviewId, String reason) async {
    await _call('reportReview', {'reviewId': reviewId, 'reason': reason});
  }

  // ==================== TICKET VALIDATION ====================

  Future<Map<String, dynamic>> getEventTickets(String eventId) async {
    return await _callWithCache<Map<String, dynamic>>(
      functionName: 'getEventTickets',
      data: {'eventId': eventId},
      cacheDuration: const Duration(minutes: 5),
      parser: (data) => {
        'tickets': (data['tickets'] as List)
            .map((t) => Ticket.fromMap(Map<String, dynamic>.from(t)))
            .toList(),
      },
    );
  }
}

class _CacheEntry {
  final dynamic data;
  final DateTime expiresAt;

  _CacheEntry({required this.data, required this.expiresAt});

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

final apiService = ApiService();
