# EventHub API - Backend Spring Boot

Backend REST API pour l'application EventHub Flutter - Gestion d'événements et réservations.

## 🏗️ Architecture

```
event_hub_spring/
├── src/main/java/com/eventhub/
│   ├── config/              # Configuration (CORS, OpenAPI)
│   ├── controller/          # REST Controllers
│   ├── dto/
│   │   ├── request/         # DTOs de requête
│   │   └── response/        # DTOs de réponse
│   ├── entity/              # Entités JPA
│   ├── exception/           # Exception handling
│   ├── mapper/              # Mappers (Entity ↔ DTO)
│   ├── repository/          # Interfaces JPA
│   ├── security/            # Spring Security + JWT
│   │   ├── config/
│   │   ├── filter/
│   │   └── service/
│   └── service/             # Logique métier
└── src/main/resources/
    └── application.yml      # Configuration
```

## 🔑 Fonctionnalités

### Authentification & Autorisation
- Inscription / Connexion
- JWT Token (24h expiration)
- Roles: `user`, `organisateur`, `admin`
- Password BCrypt hashing

### Gestion des Événements
- CRUD complet
- Publication / Annulation
- Recherche par catégorie, mot-clé
- Filtrage (à venir, passés)
- Statistiques (notes, avis)

### Gestion des Tickets
- Types: standard, vip, early_bird
- Gestion des stocks
- Prix et descriptions

### Gestion des Réservations
- Création avec paiement simulé
- QR Code token pour scanning
- Confirmation / Annulation
- Scanning des billets

### Système d'Avis
- Notes 1-5 étoiles
- Commentaires
- Statistiques par événement

### Notifications
- Création et envoi
- Marquage comme lu
- Compteur de non-lus

## 🔗 Endpoints Principaux

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion

### Utilisateurs
- `GET /api/v1/users/me` - Profil actuel
- `PUT /api/v1/users/me` - Modifier profil
- `GET /api/v1/users/{uid}` - Profil utilisateur

### Événements
- `GET /api/v1/events` - Liste (public)
- `GET /api/v1/events/{id}` - Détail
- `POST /api/v1/events` - Créer (auth)
- `PUT /api/v1/events/{id}` - Modifier (auth)
- `POST /api/v1/events/{id}/publish` - Publier
- `POST /api/v1/events/{id}/cancel` - Annuler

### Tickets
- `GET /api/v1/tickets/event/{eventId}` - Tickets d'un événement
- `POST /api/v1/tickets` - Créer ticket

### Réservations
- `POST /api/v1/bookings` - Créer réservation
- `GET /api/v1/bookings/my` - Mes réservations
- `POST /api/v1/bookings/{id}/cancel` - Annuler
- `POST /api/v1/bookings/{id}/scan` - Scanner

### Avis
- `GET /api/v1/events/{id}/reviews` - Avis d'un événement
- `POST /api/v1/events/{id}/reviews` - Laisser un avis

### Notifications
- `GET /api/v1/notifications/my` - Mes notifications
- `PUT /api/v1/notifications/{id}/read` - Marquer lu

## 🚀 Démarrage

### Prérequis
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### Configuration

```bash
# Créer la base de données
createdb eventhub
```

Modifier `application.yml` avec vos credentials PostgreSQL :

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/eventhub
    username: postgres
    password: votre_password
```

### Lancement

```bash
cd event_hub_spring
mvn spring-boot:run
```

### API Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## 🔐 Sécurité

| Endpoint | Accès |
|----------|-------|
| `GET /api/v1/events` | Public |
| `POST /api/v1/auth/**` | Public |
| `POST /api/v1/events` | ORGANISATEUR, ADMIN |
| `GET /api/v1/bookings/my` | Authentifié |

## 🗄️ Base de Données

### Schéma

```sql
-- Users
CREATE TABLE users (
    uid UUID PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    verifie BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Events
CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    organisateur_id UUID REFERENCES users(uid),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100),
    lieu VARCHAR(255),
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    capacite_totale INT,
    places_restantes INT,
    est_publie BOOLEAN,
    statut VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Tickets
CREATE TABLE tickets (
    ticket_id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(event_id),
    type VARCHAR(50),
    prix DECIMAL(10,2),
    quantite_disponible INT,
    actif BOOLEAN
);

-- Bookings
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(uid),
    event_id UUID REFERENCES events(event_id),
    ticket_id UUID REFERENCES tickets(ticket_id),
    quantite INT,
    montant_total DECIMAL(10,2),
    statut VARCHAR(20),
    qr_code_token VARCHAR(255),
    date_reservation TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY,
    user_uid UUID REFERENCES users(uid),
    event_id UUID REFERENCES events(event_id),
    note INT CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    notif_id UUID PRIMARY KEY,
    user_uid UUID REFERENCES users(uid),
    titre VARCHAR(255),
    corps TEXT,
    type VARCHAR(50),
    lue BOOLEAN DEFAULT FALSE,
    envoye_at TIMESTAMP
);
```

## 📝 Choix Techniques

### Transformation Flutter → Spring Boot

| Flutter/Dart | Spring Boot |
|--------------|-------------|
| `String uid` | `@Id @GeneratedValue UUID` |
| `DateTime` | `LocalDateTime` |
| `List<String> favoris` | `@ElementCollection` |
| `GeoPoint` | `latitude/longitude` (Double) |
| `bool` | `Boolean` |
| `final` immuable | Entity avec getters/setters (JPA) |

### Points Clés

1. **UUID au lieu de Firebase IDs** - Génération automatique
2. **Relations JPA** - `@ManyToOne`, `@OneToMany` pour les FK
3. **Stateless** - JWT avec Spring Security
4. **Pagination** - `Pageable` avec `Page<T>`
5. **Validation** - Bean Validation (`@NotNull`, `@Email`, etc.)

## 🔧 Tests

```bash
mvn test
```

## 📦 Déploiement

```bash
# Build
mvn clean package -DskipTests

# Docker (optionnel)
docker build -t eventhub-api .
docker run -p 8080:8080 eventhub-api
```

## 📄 Licence

MIT License