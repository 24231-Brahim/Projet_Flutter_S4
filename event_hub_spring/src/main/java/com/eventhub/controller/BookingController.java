package com.eventhub.controller;

import com.eventhub.dto.request.CreateBookingRequest;
import com.eventhub.dto.response.ApiResponse;
import com.eventhub.dto.response.BookingResponse;
import com.eventhub.dto.response.BookingWithClientSecretResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.security.service.CustomUserDetailsService;
import com.eventhub.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Gestion des réservations")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {

    private final BookingService bookingService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping
    @Operation(summary = "Créer une réservation", description = "Créer une nouvelle réservation")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        String userId = userDetailsService.getCurrentUserId();
        BookingResponse response = bookingService.createBooking(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Réservation créée", response));
    }

    @PostMapping("/{bookingId}/initiate-payment")
    @Operation(summary = "Initier le paiement", description = "Initier le processus de paiement pour une réservation")
    public ResponseEntity<ApiResponse<BookingWithClientSecretResponse>> initiatePayment(
            @PathVariable String bookingId
    ) {
        BookingWithClientSecretResponse response = bookingService.initiatePayment(bookingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{bookingId}/confirm")
    @Operation(summary = "Confirmer la réservation", description = "Confirmer une réservation après paiement")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(
            @PathVariable String bookingId
    ) {
        BookingResponse response = bookingService.confirmBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.success("Réservation confirmée", response));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Détail réservation", description = "Récupérer les détails d'une réservation")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @PathVariable String bookingId
    ) {
        BookingResponse response = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/qr/{qrToken}")
    @Operation(summary = "Réservation par QR", description = "Récupérer une réservation par son token QR")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByQrToken(
            @PathVariable String qrToken
    ) {
        BookingResponse response = bookingService.getBookingByQrToken(qrToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my")
    @Operation(summary = "Mes réservations", description = "Récupérer les réservations de l'utilisateur connecté")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String userId = userDetailsService.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateReservation").descending());
        PageResponse<BookingResponse> response = bookingService.getBookingsByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Réservations d'un événement", description = "Récupérer toutes les réservations d'un événement")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getBookingsByEvent(
            @PathVariable String eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateReservation").descending());
        PageResponse<BookingResponse> response = bookingService.getBookingsByEvent(eventId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{bookingId}/cancel")
    @Operation(summary = "Annuler une réservation", description = "Annuler une réservation")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String bookingId
    ) {
        String userId = userDetailsService.getCurrentUserId();
        BookingResponse response = bookingService.cancelBooking(bookingId, userId);
        return ResponseEntity.ok(ApiResponse.success("Réservation annulée", response));
    }

    @PostMapping("/{bookingId}/scan")
    @Operation(summary = "Scanner une réservation", description = "Scanner le QR code d'une réservation")
    public ResponseEntity<ApiResponse<BookingResponse>> scanBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String bookingId
    ) {
        String userId = userDetailsService.getCurrentUserId();
        BookingResponse response = bookingService.scanBooking(bookingId, userId);
        return ResponseEntity.ok(ApiResponse.success("Réservation scannée", response));
    }
}