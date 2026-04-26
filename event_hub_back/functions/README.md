# EventHub Firebase Backend

Complete backend implementation for EventHub smart event booking mobile application.

## Architecture

```
functions/
├── src/
│   ├── index.ts           # Exports all functions
│   ├── auth.ts           # Firebase Auth triggers
│   ├── events.ts         # Event management
│   ├── bookings.ts       # Booking system
│   ├── tickets.ts        # QR/PDF ticket generation
│   ├── payments.ts       # Stripe integration
│   ├── notifications.ts  # FCM push notifications
│   ├── reviews.ts        # Event reviews & ratings
│   ├── admin.ts          # Admin dashboard
│   ├── triggers.ts       # Firestore triggers
│   └── utils/
│       ├── errors.ts     # Custom error classes
│       ├── crypto.ts     # QR token signing (HMAC-SHA256)
│       ├── firebase.ts   # Firestore types & helpers
│       ├── stripe.ts     # Stripe client
│       ├── sendgrid.ts   # Email templates
│       └── validators.ts # Zod validation schemas
```

## Features

### Authentication
- Auto-create user document on signup
- Welcome email via SendGrid
- Profile management

### Events
- Create/update/publish/cancel events
- Full-text search with location filtering
- Category-based browsing
- Ticket type management

### Bookings
- Atomic seat reservation with Firestore transactions
- Stripe payment integration
- Automatic ticket generation on confirmation

### Tickets
- HMAC-signed QR codes for secure validation
- PDF ticket generation with event branding
- Ticket scanning for event check-in

### Payments
- Stripe PaymentIntent flow
- Webhook handling for all payment states
- Automatic refunds on cancellation

### Notifications
- FCM push notifications
- Scheduled event reminders (24h, 1h)
- In-app notification system

### Reviews
- Verified review system
- Rating aggregation
- Event rating statistics

## Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Environment
Set Firebase config:
```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  stripe.webhook_secret="whsec_..." \
  sendgrid.api_key="SG..." \
  sendgrid.from_email="noreply@eventhub.app" \
  qr.hmac_secret="your-32-char-secret"
```

### 3. Deploy
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules,storage:rules
```

### 4. Emulator Testing
```bash
firebase emulators:start
```

## API Reference

### Events
- `createEvent` - Create a new event (organizer only)
- `publishEvent` - Publish event for bookings
- `cancelEvent` - Cancel event and refund attendees
- `getUpcomingEvents` - List published events with filters
- `searchEvents` - Full-text search

### Bookings
- `createBooking` - Reserve tickets (atomic transaction)
- `confirmBooking` - Confirm after payment
- `cancelBooking` - Cancel with refund policy
- `getUserBookings` - User booking history

### Tickets
- `validateTicket` - Scan QR and mark as used
- `addTicket` - Add ticket type to event
- `getEventTickets` - List event tickets

### Admin
- `verifyOrganisateur` - Promote user to organizer
- `getDashboardStats` - Platform statistics

## Security

All functions validate:
1. Authentication (Firebase Auth token)
2. Authorization (role-based)
3. Input validation (Zod schemas)
4. Resource ownership

## Error Handling

Custom error codes:
- `unauthenticated` - No valid auth token
- `permission-denied` - Insufficient permissions
- `not-found` - Resource doesn't exist
- `invalid-argument` - Validation failed
- `already-exists` - Duplicate entry

## Firestore Indexes

Required indexes are defined in `firestore.indexes.json`:
- Events by publish status + date
- Events by category + date
- Bookings by user + date
- Reviews by event + date

## Environment Variables

| Variable | Description |
|----------|-------------|
| `stripe.secret_key` | Stripe secret API key |
| `stripe.webhook_secret` | Stripe webhook signing secret |
| `sendgrid.api_key` | SendGrid API key |
| `sendgrid.from_email` | Default sender email |
| `qr.hmac_secret` | Secret for QR token signing |

## License

MIT
