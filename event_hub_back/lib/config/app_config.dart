import 'package:flutter/material.dart';

class AppConfig {
  static const String appName = 'EventHub';
  static const String appVersion = '1.0.0';

  static const Color primaryColor = Color(0xFF667eea);
  static const Color secondaryColor = Color(0xFF764ba2);
  static const Color accentColor = Color(0xFFf5576c);
  static const Color successColor = Color(0xFF4CAF50);
  static const Color errorColor = Color(0xFFE53935);
  static const Color warningColor = Color(0xFFFF9800);

  static const String currency = 'USD';
  static const String currencySymbol = '\$';

  static const int maxBookingQuantity = 10;
  static const int cancellationHoursLimit = 24;

  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
