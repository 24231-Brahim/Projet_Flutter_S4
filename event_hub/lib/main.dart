import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';

import 'config/app_config.dart';
import 'config/routes.dart';
import 'services/auth_service.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/bookings_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/event_details_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/search_screen.dart';
import 'screens/scanner_screen.dart';
import 'screens/organizer_dashboard_screen.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const EventHubApp());
}

class EventHubApp extends StatelessWidget {
  const EventHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        StreamProvider<dynamic>.value(
          value: authService.authStateChanges,
          initialData: authService.currentUser,
        ),
      ],
      child: MaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppConfig.primaryColor,
            secondary: AppConfig.secondaryColor,
          ),
          appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
          cardTheme: CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        initialRoute: AppRoutes.splash,
        onGenerateRoute: _generateRoute,
      ),
    );
  }

  Route<dynamic>? _generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case AppRoutes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case AppRoutes.register:
        return MaterialPageRoute(builder: (_) => const RegisterScreen());
      case AppRoutes.home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case AppRoutes.events:
        return MaterialPageRoute(builder: (_) => const EventsScreen());
      case AppRoutes.eventDetails:
        final eventId = settings.arguments as String;
        return MaterialPageRoute(
          builder: (_) => EventDetailsScreen(eventId: eventId),
        );
      case AppRoutes.createEvent:
        return MaterialPageRoute(builder: (_) => const CreateEventScreen());
      case AppRoutes.bookings:
        return MaterialPageRoute(builder: (_) => const BookingsScreen());
      case AppRoutes.bookingDetails:
        final bookingId = settings.arguments as String;
        return MaterialPageRoute(
          builder: (_) => BookingDetailsScreen(bookingId: bookingId),
        );
      case AppRoutes.profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case AppRoutes.editProfile:
        return MaterialPageRoute(builder: (_) => const EditProfileScreen());
      case AppRoutes.favorites:
        return MaterialPageRoute(builder: (_) => const FavoritesScreen());
      case AppRoutes.notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case AppRoutes.scanner:
        return MaterialPageRoute(builder: (_) => const ScannerScreen());
      case AppRoutes.search:
        return MaterialPageRoute(builder: (_) => const SearchScreen());
      case AppRoutes.organizerDashboard:
        return MaterialPageRoute(
          builder: (_) => const OrganizerDashboardScreen(),
        );
      case AppRoutes.ticket:
        final bookingId = settings.arguments as String;
        return MaterialPageRoute(
          builder: (_) => TicketScreen(bookingId: bookingId),
        );
      default:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
    }
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    if (authService.isAuthenticated) {
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppConfig.primaryColor, AppConfig.secondaryColor],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.event, size: 100, color: Colors.white),
              const SizedBox(height: 24),
              Text(
                AppConfig.appName,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SearchScreen();
  }
}

class CreateEventScreen extends StatelessWidget {
  const CreateEventScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Event')),
      body: const Center(child: Text('Create Event Screen')),
    );
  }
}

class BookingDetailsScreen extends StatelessWidget {
  final String bookingId;
  const BookingDetailsScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Booking Details')),
      body: Center(child: Text('Booking: $bookingId')),
    );
  }
}

class TicketScreen extends StatelessWidget {
  final String bookingId;
  const TicketScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ticket')),
      body: Center(child: Text('Ticket: $bookingId')),
    );
  }
}
