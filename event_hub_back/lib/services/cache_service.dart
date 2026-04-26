import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  SharedPreferences? _prefs;
  final Map<String, CacheEntry> _memoryCache = {};

  static const String _prefsKey = 'eventhub_cache';

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadFromDisk();
  }

  void _loadFromDisk() {
    if (_prefs == null) return;
    final String? cacheJson = _prefs!.getString(_prefsKey);
    if (cacheJson != null) {
      try {
        final Map<String, dynamic> cacheMap = json.decode(cacheJson);
        cacheMap.forEach((key, value) {
          final entry = CacheEntry.fromJson(value);
          if (!entry.isExpired) {
            _memoryCache[key] = entry;
          }
        });
      } catch (e) {
        debugPrint('CacheService: Failed to load cache from disk: $e');
      }
    }
  }

  Future<void> _saveToDisk() async {
    if (_prefs == null) return;
    try {
      final Map<String, dynamic> cacheMap = {};
      _memoryCache.forEach((key, entry) {
        if (!entry.isExpired) {
          cacheMap[key] = entry.toJson();
        }
      });
      await _prefs!.setString(_prefsKey, json.encode(cacheMap));
    } catch (e) {
      debugPrint('CacheService: Failed to save cache to disk: $e');
    }
  }

  T? get<T>(String key) {
    final entry = _memoryCache[key];
    if (entry == null) return null;
    if (entry.isExpired) {
      remove(key);
      return null;
    }
    return entry.value as T?;
  }

  Future<void> set<T>(
    String key,
    T value, {
    Duration maxAge = const Duration(minutes: 5),
  }) async {
    final entry = CacheEntry(
      value: value,
      expiresAt: DateTime.now().add(maxAge),
    );
    _memoryCache[key] = entry;
    _saveToDisk();
  }

  Future<void> remove(String key) async {
    _memoryCache.remove(key);
    _saveToDisk();
  }

  Future<void> clear() async {
    _memoryCache.clear();
    _saveToDisk();
  }

  bool hasValid(String key) {
    final entry = _memoryCache[key];
    if (entry == null) return false;
    if (entry.isExpired) {
      remove(key);
      return false;
    }
    return true;
  }

  void cleanup() {
    final now = DateTime.now();
    _memoryCache.removeWhere((key, entry) {
      return entry.expiresAt.isBefore(now);
    });
  }
}

class CacheEntry {
  final dynamic value;
  final DateTime expiresAt;

  CacheEntry({required this.value, required this.expiresAt});

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Map<String, dynamic> toJson() {
    return {'value': value, 'expiresAt': expiresAt.toIso8601String()};
  }

  factory CacheEntry.fromJson(Map<String, dynamic> json) {
    return CacheEntry(
      value: json['value'],
      expiresAt: DateTime.parse(json['expiresAt']),
    );
  }
}

abstract class CachedApiCall<T> {
  final String cacheKey;
  final Duration cacheDuration;

  CachedApiCall({
    required this.cacheKey,
    this.cacheDuration = const Duration(minutes: 5),
  });

  Future<T> fetch(CacheService cache);
}

class UserProfileCache extends CachedApiCall<Map<String, dynamic>> {
  UserProfileCache() : super(cacheKey: 'user_profile');

  @override
  Future<Map<String, dynamic>> fetch(CacheService cache) async {
    return {};
  }
}
