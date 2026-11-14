package com.marketplace.controller;

import com.marketplace.entity.OfferEntity;
import com.marketplace.entity.UserEntity;
import com.marketplace.entity.WishEntity;
import com.marketplace.repository.OfferRepository;
import com.marketplace.repository.UserRepository;
import com.marketplace.repository.WishRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final WishRepository wishRepository;
    private final OfferRepository offerRepository;

    @GetMapping
    public List<UserEntity> listUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public UserEntity getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PostMapping
    public ResponseEntity<UserEntity> createUser(@Valid @RequestBody UserEntity user) {
        if (user.getId() == null || user.getId().isBlank()) {
            user.setId("user-" + System.currentTimeMillis());
        }
        if (user.getJoinedDate() == null || user.getJoinedDate().isBlank()) {
            user.setJoinedDate("Just now");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword("password123");
        }
        UserEntity saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserEntity> updateUser(@PathVariable String id, @RequestBody UserEntity updateData) {
        UserEntity existing = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (updateData.getName() != null) existing.setName(updateData.getName());
        if (updateData.getEmail() != null) existing.setEmail(updateData.getEmail());
        if (updateData.getPhone() != null) existing.setPhone(updateData.getPhone());
        if (updateData.getAvatarUrl() != null) existing.setAvatarUrl(updateData.getAvatarUrl());
        if (updateData.getPassword() != null) existing.setPassword(updateData.getPassword());
        if (updateData.getWarningCount() != null) existing.setWarningCount(updateData.getWarningCount());
        if (updateData.getRating() != null) existing.setRating(updateData.getRating());
        if (updateData.getReviewCount() != null) existing.setReviewCount(updateData.getReviewCount());

        return ResponseEntity.ok(userRepository.save(existing));
    }

    @GetMapping("/{id}/wishes")
    public List<WishEntity> getUserWishes(@PathVariable String id) {
        return wishRepository.findByBuyerId(id);
    }

    @GetMapping("/{id}/offers")
    public List<OfferEntity> getUserOffers(@PathVariable String id) {
        return offerRepository.findBySellerId(id);
    }
}
