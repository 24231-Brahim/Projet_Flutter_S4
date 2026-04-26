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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

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

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtService.getExpirationTime());
        response.setUser(userResponse);
        return response;
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

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtService.getExpirationTime());
        response.setUser(userResponse);
        return response;
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

        userMapper.updateEntity(user, request);
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
        PageResponse<UserResponse> response = new PageResponse<>();
        response.setContent(userMapper.toResponses(page.getContent()));
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}