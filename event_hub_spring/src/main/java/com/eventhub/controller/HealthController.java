package com.eventhub.controller;

import com.eventhub.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Vérifier l'état de l'API")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "timestamp", LocalDateTime.now(),
                "service", "EventHub API",
                "version", "1.0.0"
        );
        return ResponseEntity.ok(ApiResponse.success(health));
    }

    @GetMapping("/")
    @Operation(summary = "Root endpoint", description = "Point d'entrée de l'API")
    public ResponseEntity<ApiResponse<Map<String, String>>> root() {
        Map<String, String> info = Map.of(
                "name", "EventHub API",
                "version", "1.0.0",
                "documentation", "/swagger-ui.html"
        );
        return ResponseEntity.ok(ApiResponse.success(info));
    }
}