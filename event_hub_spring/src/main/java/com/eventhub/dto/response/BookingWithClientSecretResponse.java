package com.eventhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingWithClientSecretResponse {

    private String bookingId;
    private String clientSecret;
    private String paymentId;
    private Double montantTotal;
    private String statut;
}