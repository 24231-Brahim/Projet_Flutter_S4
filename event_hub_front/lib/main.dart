import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  Firebase.initializeApp();
  runApp(const EventHubApp());
}
class EventHubApp extends StatelessWidget {
  const EventHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EventHub',
      theme: ThemeData(
        primarySwatch: Colors.teal,
      ),
      home: const EventHubHomePage(),
    );
  }
}

class EventHubHomePage extends StatelessWidget {
  const EventHubHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Partie supérieure avec les images
            Expanded(
              child: GridView.count(
                crossAxisCount: 3,
                children: [
                  // Tu peux remplacer par Image.asset ou Image.network
                  Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: AssetImage('assets/concert.jpg'),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        color: Colors.black54,
                        padding: const EdgeInsets.all(8),
                        child: const Text(
                          'LIVE NOW\nElectronic Pulse Festival',
                          style: TextStyle(color: Colors.white),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: AssetImage('assets/bar.jpg'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Container(
                    color: Colors.teal,
                    child: const Center(
                      child: Text(
                        'Safe work',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Logo et texte
            const SizedBox(height: 20),
            const Text(
              'EventHub',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(
              'Discover & Book Events Near You',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const Text(
              'The curated home for concerts, festivals, and exclusive local experiences.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),

            const SizedBox(height: 30),

            // Boutons
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () {
                    // Action Get Started
                  },
                  child: const Text('Get Started'),
                ),
                const SizedBox(width: 20),
                OutlinedButton(
                  onPressed: () {
                    // Action Sign In
                  },
                  child: const Text('Sign In'),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}