import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:event_hub/models/user.dart';

void main() {
  group('User', () {
    late User user;
    late DateTime now;

    setUp(() {
      now = DateTime.now();
      user = User(
        uid: 'user-123',
        nom: 'John Doe',
        email: 'john@example.com',
        telephone: '123-456-7890',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user',
        favoris: ['event-1', 'event-2'],
        verifie: true,
        createdAt: now,
        updatedAt: now,
      );
    });

    group('factory constructors', () {
      test('fromMap creates User from valid map', () {
        final map = {
          'uid': 'user-123',
          'nom': 'John Doe',
          'email': 'john@example.com',
          'telephone': '123-456-7890',
          'photoURL': 'https://example.com/photo.jpg',
          'role': 'user',
          'favoris': ['event-1', 'event-2'],
          'verifie': true,
          'createdAt': Timestamp.fromDate(now),
          'updatedAt': Timestamp.fromDate(now),
        };

        final result = User.fromMap(map);

        expect(result.uid, 'user-123');
        expect(result.nom, 'John Doe');
        expect(result.email, 'john@example.com');
        expect(result.role, 'user');
        expect(result.favoris, ['event-1', 'event-2']);
        expect(result.verifie, true);
      });

      test('fromMap handles null values with defaults', () {
        final map = <String, dynamic>{};

        final result = User.fromMap(map);

        expect(result.uid, '');
        expect(result.nom, '');
        expect(result.email, '');
        expect(result.telephone, '');
        expect(result.role, 'user');
        expect(result.verifie, false);
        expect(result.favoris, isEmpty);
      });

      test('fromMap handles null favoris', () {
        final map = {'uid': 'user-123', 'favoris': null};

        final result = User.fromMap(map);

        expect(result.favoris, isEmpty);
      });
    });

    group('toMap', () {
      test('converts User to map correctly', () {
        final result = user.toMap();

        expect(result['uid'], 'user-123');
        expect(result['nom'], 'John Doe');
        expect(result['email'], 'john@example.com');
        expect(result['role'], 'user');
        expect(result['favoris'], ['event-1', 'event-2']);
      });

      test('toMap excludes timestamps', () {
        final result = user.toMap();

        expect(result.containsKey('createdAt'), false);
        expect(result.containsKey('updatedAt'), false);
      });
    });

    group('computed properties', () {
      test('isOrganisateur returns true for organisateur role', () {
        final organisateur = User(
          uid: 'user-1',
          nom: 'Org',
          email: 'org@test.com',
          role: 'organisateur',
          createdAt: now,
          updatedAt: now,
        );

        expect(organisateur.isOrganisateur, true);
      });

      test('isOrganisateur returns true for admin role', () {
        final admin = User(
          uid: 'user-1',
          nom: 'Admin',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: now,
          updatedAt: now,
        );

        expect(admin.isOrganisateur, true);
      });

      test('isOrganisateur returns false for regular user', () {
        expect(user.isOrganisateur, false);
      });

      test('isAdmin returns true for admin role', () {
        final admin = User(
          uid: 'user-1',
          nom: 'Admin',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: now,
          updatedAt: now,
        );

        expect(admin.isAdmin, true);
      });

      test('isAdmin returns false for non-admin', () {
        expect(user.isAdmin, false);
      });

      test('isVerified returns true when verifie is true', () {
        expect(user.isVerified, true);
      });

      test('isVerified returns false when verifie is false', () {
        final unverifiedUser = User(
          uid: 'user-1',
          nom: 'Test',
          email: 'test@test.com',
          verifie: false,
          createdAt: now,
          updatedAt: now,
        );

        expect(unverifiedUser.isVerified, false);
      });
    });

    group('copyWith', () {
      test('creates a copy with updated fields', () {
        final updated = user.copyWith(
          nom: 'Jane Doe',
          telephone: '987-654-3210',
        );

        expect(updated.nom, 'Jane Doe');
        expect(updated.telephone, '987-654-3210');
        expect(updated.uid, user.uid);
        expect(updated.email, user.email);
      });

      test('preserves original values when no changes', () {
        final copy = user.copyWith();

        expect(copy.uid, user.uid);
        expect(copy.nom, user.nom);
        expect(copy.email, user.email);
      });

      test('updates updatedAt timestamp', () {
        final originalUpdatedAt = user.updatedAt;
        final copy = user.copyWith(nom: 'New Name');

        expect(
          copy.updatedAt.isAfter(originalUpdatedAt) ||
              copy.updatedAt == originalUpdatedAt,
          true,
        );
      });

      test('can add to favoris list', () {
        final updated = user.copyWith(favoris: [...user.favoris, 'event-3']);

        expect(updated.favoris, ['event-1', 'event-2', 'event-3']);
      });
    });
  });
}
