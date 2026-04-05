import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiTestHelper {
  static HttpsCallable getCallable(String name) {
    return FirebaseFunctions.instance.httpsCallable(name);
  }

  static final FirebaseAuth _auth = FirebaseAuth.instance;

  static Future<void> initializeForTesting() async {
    FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
    await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
  }

  static Future<HttpsCallableResult> callFunction(
    String functionName, [
    Map<String, dynamic>? data,
  ]) async {
    final callable = getCallable(functionName);
    return await callable(data ?? {});
  }

  static Future<UserCredential?> signInTestUser({
    String email = 'test@example.com',
    String password = 'password123',
  }) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } catch (e) {
      print('Sign in failed: $e');
      return null;
    }
  }

  static Future<void> signOutTestUser() async {
    await _auth.signOut();
  }

  static Map<String, dynamic> mockEvent({
    String? id,
    String? title,
    String? category,
  }) {
    return {
      'eventId': id ?? 'test-event-${DateTime.now().millisecondsSinceEpoch}',
      'organisateurId': 'test-organizer',
      'titre': title ?? 'Test Event',
      'description': 'Test Description',
      'categorie': category ?? 'Music',
      'lieu': 'Test Location',
      'dateDebut': DateTime.now()
          .add(const Duration(days: 7))
          .millisecondsSinceEpoch,
      'dateFin': DateTime.now()
          .add(const Duration(days: 7, hours: 3))
          .millisecondsSinceEpoch,
      'capaciteTotale': 100,
      'placesRestantes': 50,
      'estPublie': true,
      'statut': 'published',
      'tags': ['test'],
    };
  }

  static Map<String, dynamic> mockBooking({String? id, String? eventId}) {
    return {
      'bookingId':
          id ?? 'test-booking-${DateTime.now().millisecondsSinceEpoch}',
      'userId': 'test-user',
      'eventId': eventId ?? 'test-event',
      'ticketId': 'test-ticket',
      'quantite': 2,
      'montantTotal': 100.0,
      'statut': 'confirmed',
      'dateReservation': DateTime.now().millisecondsSinceEpoch,
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
    };
  }
}

abstract class TestScenario {
  static Future<void> setUpAuthenticated() async {
    await ApiTestHelper.initializeForTesting();
    await ApiTestHelper.signInTestUser();
  }

  static Future<void> tearDown() async {
    await ApiTestHelper.signOutTestUser();
  }
}

class ApiTestResult<T> {
  final T? data;
  final String? error;
  final bool success;

  ApiTestResult.success(this.data) : error = null, success = true;

  ApiTestResult.failure(this.error) : data = null, success = false;
}

class ApiTestRunner {
  static Future<ApiTestResult<R>> run<R>(
    String testName,
    Future<R> Function() testFn,
  ) async {
    print('Running test: $testName');
    try {
      final result = await testFn();
      print('✓ $testName passed');
      return ApiTestResult.success(result);
    } catch (e) {
      print('✗ $testName failed: $e');
      return ApiTestResult.failure(e.toString());
    }
  }

  static Future<void> runSuite(
    String suiteName,
    List<Future<ApiTestResult<dynamic>>> tests,
  ) async {
    print('\n=== $suiteName ===');
    int passed = 0;
    int failed = 0;

    for (final test in tests) {
      final result = await test;
      if (result.success) {
        passed++;
      } else {
        failed++;
        print('  Error: ${result.error}');
      }
    }

    print('\nResults: $passed passed, $failed failed');
  }
}
