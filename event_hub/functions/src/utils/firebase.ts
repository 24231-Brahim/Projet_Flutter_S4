import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();
const storage = getStorage().bucket();
const messaging = getMessaging();

export { db, storage, messaging, FieldValue };

export interface User {
  uid: string;
  nom: string;
  email: string;
  telephone?: string;
  photoURL?: string;
  role: 'user' | 'organisateur' | 'admin';
  favoris: string[];
  fcmToken?: string;
  deleted?: boolean;
  verifie?: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Event {
  eventId: string;
  organisateurId: string;
  titre: string;
  description: string;
  categorie: string;
  imageURL?: string;
  lieu: string;
  localisation?: FirebaseFirestore.GeoPoint;
  dateDebut: FirebaseFirestore.Timestamp;
  dateFin: FirebaseFirestore.Timestamp;
  capaciteTotale: number;
  placesRestantes: number;
  estPublie: boolean;
  statut: 'draft' | 'published' | 'cancelled' | 'completed';
  tags: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Ticket {
  ticketId: string;
  type: 'standard' | 'vip' | 'early_bird';
  prix: number;
  quantiteDisponible: number;
  quantiteVendue: number;
  description?: string;
  actif: boolean;
}

export interface Booking {
  bookingId: string;
  userId: string;
  eventId: string;
  ticketId: string;
  quantite: number;
  montantTotal: number;
  devise: string;
  statut: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  qrCodeToken?: string;
  qrCodeURL?: string;
  pdfURL?: string;
  paymentId?: string;
  scannedAt?: FirebaseFirestore.Timestamp;
  reminderSent24h?: boolean;
  reminderSent1h?: boolean;
  dateReservation: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeClientSecret: string;
  montant: number;
  devise: string;
  statut: 'pending' | 'succeeded' | 'failed' | 'refunded';
  methode: 'card' | 'apple_pay' | 'google_pay';
  datePaiement: FirebaseFirestore.Timestamp;
}

export interface Notification {
  notifId: string;
  userId: string;
  titre: string;
  corps: string;
  type: 'booking_confirmed' | 'event_reminder' | 'ticket_ready' | 'cancellation' | 'promotion';
  data?: Record<string, string>;
  lue: boolean;
  envoyeAt: FirebaseFirestore.Timestamp;
}

export interface Review {
  reviewId: string;
  userId: string;
  eventId: string;
  note: number;
  commentaire: string;
  verifie: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Category {
  categoryId: string;
  nom: string;
  icone: string;
  couleur: string;
}
