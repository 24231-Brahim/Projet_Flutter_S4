# API Testing Guide for EventHub

## Quick Commands

### Run All Tests
```bash
cd event_hub
flutter test
```

### Run Specific Test File
```bash
flutter test test/services/api_service_integration_test.dart
```

### Run Tests with Coverage
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Run Tests with Emulators
```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Run tests
FIREBASE_CONFIG=test/firebase.test.json flutter test
```

---

## Testing Methods

### 1. Unit Tests (Fastest)
- Mock external dependencies
- Test business logic
- Use `mocktail` package
- File: `test/models/*_test.dart`

### 2. Widget Tests
- Test UI components
- Simulate user interactions
- File: `test/widgets/*_test.dart`

### 3. Integration Tests (with Firebase)
- Test full API flow
- Use Firebase Emulators
- File: `test/services/*_test.dart`

---

## Manual API Testing

### Get Auth Token
Add to any screen temporarily:
```dart
final token = await authService.getIdToken();
print('TOKEN: $token');
```

### Test with curl
```bash
# Set token
TOKEN="your-token-here"
PROJECT_ID="your-project-id"

# Test getUpcomingEvents
curl -X POST \
  "https://us-central1-${PROJECT_ID}.cloudfunctions.net/getUpcomingEvents" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'

# Test searchEvents
curl -X POST \
  "https://us-central1-${PROJECT_ID}.cloudfunctions.net/searchEvents" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "music", "limit": 10}'
```

---

## Firebase Emulator Setup

### 1. Install Firebase CLI
```bash
curl -sL https://firebase.tools | bash
firebase login
```

### 2. Initialize Emulators
```bash
firebase init emulators
# Select:
# - Authentication
# - Functions
# - Firestore
# - Hosting (optional)
```

### 3. Start Emulators
```bash
firebase emulators:start
# Or specific services:
firebase emulators:start --only functions,auth,firestore
```

### 4. Configure Flutter to Use Emulators
Add to `lib/main.dart`:
```dart
import 'package:flutter/foundation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  if (kDebugMode) {
    // Use emulators in debug mode
    FirebaseFunctions.instance.useFunctionsEmulator(
      'localhost', 
      5001,
    );
    FirebaseAuth.instance.useAuthEmulator(
      'localhost', 
      9099,
    );
  }
  
  await Firebase.initializeApp();
  runApp(const EventHubApp());
}
```

### 5. Create Test User in Emulator
```bash
firebase auth:export test-users.json
# Edit the file, then:
firebase auth:import test-users.json
```

---

## Debug API Calls

### Enable Function Logging
```bash
firebase functions:log --only getUpcomingEvents
```

### Check Function Response
Add to your code:
```dart
try {
  final result = await apiService.getUpcomingEvents();
  debugPrint('API Response: $result');
} catch (e) {
  debugPrint('API Error: $e');
}
```

---

## Test Data Factories

Use the helper in `test/services/api_test_helper.dart`:

```dart
import 'test/services/api_test_helper.dart';

// Create mock data
final event = ApiTestHelper.mockEvent(title: 'My Test Event');
final booking = ApiTestHelper.mockBooking();

// Run test with result tracking
final result = await ApiTestRunner.run(
  'Test name',
  () => apiService.getUpcomingEvents(),
);
```

---

## Common Issues

### "Function not found"
- Deploy functions: `cd functions && firebase deploy --only functions`

### "Permission denied"
- User not authenticated - sign in first
- Missing auth token in request

### "Emulator connection failed"
- Make sure emulators are running
- Check ports match in main.dart

### "Timeout"
- Increase timeout in test
- Check emulator is responsive: `curl localhost:5001`
