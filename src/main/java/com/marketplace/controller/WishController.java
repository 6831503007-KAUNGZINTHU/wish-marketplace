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

import java.math.BigDecimal;
import java.util.List;

/**
 * Controller for Wish entity.
 * Fulfills all 5 Controller Methods:
 * 1. Listing & Searching
 * 2. Creating
 * 3. Updating
 * 4. Deleting
 * 5. Managing Related Entities (child Offers)
 */
@RestController
@RequestMapping("/api/wishes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WishController {

    private final WishRepository wishRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    // CONTROL 1: LISTING & SEARCHING
    @GetMapping
    public List<WishEntity> listWishes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "All") String category,
            @RequestParam(required = false) BigDecimal maxBudget
    ) {
        return wishRepository.searchWishes(query, category, maxBudget);
    }

    @GetMapping("/{id}")
    public WishEntity getWishById(@PathVariable String id) {
        return wishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wish not found with id: " + id));
    }

    // CONTROL 2: CREATING
    @PostMapping
    public ResponseEntity<WishEntity> createWish(@Valid @RequestBody WishEntity wish) {
        if (wish.getId() == null || wish.getId().isBlank()) {
            wish.setId("WISH-" + (int) (Math.random() * 9000 + 1000));
        }

        String resolvedBuyerId = null;
        if (wish.getBuyer() != null && wish.getBuyer().getId() != null) {
            resolvedBuyerId = wish.getBuyer().getId();
        } else if (wish.getBuyerId() != null && !wish.getBuyerId().isBlank()) {
            resolvedBuyerId = wish.getBuyerId();
        } else {
            resolvedBuyerId = "user-sarah";
        }

        final String targetBuyerId = resolvedBuyerId;
        UserEntity buyer = userRepository.findById(targetBuyerId)
                .orElseGet(() -> userRepository.findById("user-sarah")
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Buyer does not exist: " + targetBuyerId)));
        wish.setBuyer(buyer);

        if (wish.getStatus() == null || wish.getStatus().isBlank()) {
            wish.setStatus("OPEN");
        }
        if (wish.getOffersCount() == null) {
            wish.setOffersCount(0);
        }
        if (wish.getIsFlagged() == null) {
            wish.setIsFlagged(false);
        }

        WishEntity saved = wishRepository.save(wish);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // CONTROL 3: UPDATING
    @PutMapping("/{id}")
    public ResponseEntity<WishEntity> updateWish(@PathVariable String id, @RequestBody WishEntity updateData) {
        WishEntity existing = wishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wish not found with id: " + id));

        if (updateData.getTitle() != null) existing.setTitle(updateData.getTitle());
        if (updateData.getBrand() != null) existing.setBrand(updateData.getBrand());
        if (updateData.getBudget() != null) existing.setBudget(updateData.getBudget());
        if (updateData.getDescription() != null) existing.setDescription(updateData.getDescription());
        if (updateData.getCategory() != null) existing.setCategory(updateData.getCategory());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        if (updateData.getImageUrl() != null) existing.setImageUrl(updateData.getImageUrl());
        if (updateData.getIsFlagged() != null) existing.setIsFlagged(updateData.getIsFlagged());
        if (updateData.getOffersCount() != null) existing.setOffersCount(updateData.getOffersCount());

        return ResponseEntity.ok(wishRepository.save(existing));
    }

    // CONTROL 4: DELETING
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWish(@PathVariable String id) {
        if (!wishRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Wish not found with id: " + id);
        }
        wishRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // CONTROL 5: MANAGING RELATED ENTITIES (Fetch or attach child Offers to this Wish)
    @GetMapping("/{id}/offers")
    public List<OfferEntity> getOffersForWish(@PathVariable String id) {
        if (!wishRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Wish not found with id: " + id);
        }
        return offerRepository.findByWishId(id);
    }

    @PostMapping("/{id}/offers")
    public ResponseEntity<OfferEntity> createOfferForWish(
            @PathVariable String id,
            @Valid @RequestBody OfferEntity offer
    ) {
        WishEntity wish = wishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wish not found with id: " + id));

        if (offer.getId() == null || offer.getId().isBlank()) {
            offer.setId("OFF-" + (int) (Math.random() * 9000 + 1000));
        }

        String resolvedSellerId = null;
        if (offer.getSeller() != null && offer.getSeller().getId() != null) {
            resolvedSellerId = offer.getSeller().getId();
        } else if (offer.getSellerId() != null && !offer.getSellerId().isBlank()) {
            resolvedSellerId = offer.getSellerId();
        } else {
            resolvedSellerId = "user-alex";
        }

        final String targetSellerId = resolvedSellerId;
        UserEntity seller = userRepository.findById(targetSellerId)
                .orElseGet(() -> userRepository.findById("user-alex")
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seller does not exist: " + targetSellerId)));

        offer.setSeller(seller);
        offer.setWish(wish);
        if (offer.getTargetBudget() == null) {
            offer.setTargetBudget(wish.getBudget());
        }
        if (offer.getStatus() == null || offer.getStatus().isBlank()) {
            offer.setStatus("PENDING");
        }

        wish.setOffersCount((wish.getOffersCount() == null ? 0 : wish.getOffersCount()) + 1);
        if ("OPEN".equals(wish.getStatus())) {
            wish.setStatus("OFFER_RECEIVED");
        }

        OfferEntity savedOffer = offerRepository.save(offer);
        wishRepository.save(wish);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedOffer);
    }
}
