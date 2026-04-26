package com.eventhub.service;

import com.eventhub.dto.request.LoginRequest;
import com.eventhub.dto.request.RegisterRequest;
import com.eventhub.dto.request.UpdateProfileRequest;
import com.eventhub.dto.response.AuthResponse;
import com.eventhub.dto.response.PageResponse;
import com.eventhub.dto.response.UserResponse;
import com.eventhub.entity.User;
import com.eventhub.exception.*;
import com.eventhub.mapper.UserMapper;
import com.eventhub.repository.UserRepository;
import com.eventhub.security.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Un compte existe déjà avec cet email");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        User user = userMapper.toEntity(request, passwordHash);
        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        UserResponse userResponse = userMapper.toResponse(user);

        log.info("User registered successfully: {}", user.getUid());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(userResponse)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email ou mot de passe incorrect");
        }

        String token = jwtService.generateToken(user);
        UserResponse userResponse = userMapper.toResponse(user);

        log.info("User logged in successfully: {}", user.getUid());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(userResponse)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(String uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String uid, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", uid);

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        user = userMapper.toEntity(user, request);
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchUsers(String keyword, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(keyword, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsersByRole(String role, Pageable pageable) {
        Page<User> page = userRepository.findByRole(role, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return toPageResponse(page);
    }

    @Transactional
    public UserResponse upgradeToOrganisateur(String uid) {
        log.info("Upgrading user to organisateur: {}", uid);

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        user.setRole("organisateur");
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse verifyUser(String uid) {
        log.info("Verifying user: {}", uid);

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        user.setVerifie(true);
        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    public User getUserEntity(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private PageResponse<UserResponse> toPageResponse(Page<User> page) {
        return PageResponse.<UserResponse>builder()
                .content(userMapper.toResponses(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}