package com.eventhub.security.config;

import com.eventhub.security.filter.JwtAuthenticationFilter;
import com.eventhub.security.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configure(http))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/v1/events/public/**",
                                "/ws/**",
                                "/actuator/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/favicon.ico",
                                "/error"
                        ).permitAll()

                        // Event search and categories (public)
                        .requestMatchers(HttpMethod.GET, "/api/v1/events").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/*/reviews").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/*/reviews/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events/*/tickets").permitAll()

                        // Admin only endpoints
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // Organisateur endpoints
                        .requestMatchers(HttpMethod.POST, "/api/v1/events").hasAnyRole("ORGANISATEUR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/events/**").hasAnyRole("ORGANISATEUR", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/events/**").hasAnyRole("ORGANISATEUR", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/tickets/**").hasAnyRole("ORGANISATEUR", "ADMIN")

                        // Authenticated endpoints
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(401);
                            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Accès non autorisé\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json");
                            response.setStatus(403);
                            response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Accès refusé\"}");
                        })
                );

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}