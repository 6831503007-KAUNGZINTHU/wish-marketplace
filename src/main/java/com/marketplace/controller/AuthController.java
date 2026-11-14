package com.marketplace.controller;

import com.marketplace.entity.UserEntity;
import com.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<UserEntity> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        UserEntity user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email.trim()))
                        .findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found")));

        if (password != null && !password.isBlank() && user.getPassword() != null && !user.getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }

        return ResponseEntity.ok(user);
    }

    @PostMapping("/register")
    public ResponseEntity<UserEntity> register(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String email = payload.get("email");
        String password = payload.getOrDefault("password", "password123");
        String avatarUrl = payload.get("avatarUrl");

        if (email == null || email.isBlank() || name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and email are required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        var existingOpt = userRepository.findByEmail(normalizedEmail);
        if (existingOpt.isPresent()) {
            UserEntity existing = existingOpt.get();
            if (password != null && !password.isBlank()) {
                existing.setPassword(password);
            }
            if (avatarUrl != null && !avatarUrl.isBlank()) {
                existing.setAvatarUrl(avatarUrl);
            }
            return ResponseEntity.ok(userRepository.save(existing));
        }

        UserEntity newUser = UserEntity.builder()
                .id("user-" + System.currentTimeMillis())
                .name(name.trim())
                .email(normalizedEmail)
                .password(password)
                .avatarUrl(avatarUrl)
                .rating(BigDecimal.valueOf(5.00))
                .reviewCount(0)
                .verified(true)
                .admin(false)
                .warningCount(0)
                .joinedDate("Just now")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(newUser));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<UserEntity> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String newPassword = payload.get("password");

        if (email == null || email.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and new password are required");
        }

        UserEntity user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email.trim()))
                        .findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));

        user.setPassword(newPassword);
        return ResponseEntity.ok(userRepository.save(user));
    }
}
