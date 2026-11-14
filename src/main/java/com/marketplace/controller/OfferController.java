package com.marketplace.controller;

import com.marketplace.entity.OfferEntity;
import com.marketplace.entity.TransactionEntity;
import com.marketplace.entity.UserEntity;
import com.marketplace.entity.WishEntity;
import com.marketplace.repository.OfferRepository;
import com.marketplace.repository.TransactionRepository;
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
@RequestMapping("/api/offers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OfferController {

    private final OfferRepository offerRepository;
    private final WishRepository wishRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping
    public List<OfferEntity> listOffers(
            @RequestParam(required = false) String wishId,
            @RequestParam(required = false) String sellerId,
            @RequestParam(required = false) String status
    ) {
        if (wishId != null) return offerRepository.findByWishId(wishId);
        if (sellerId != null) return offerRepository.findBySellerId(sellerId);
        if (status != null) return offerRepository.findByStatus(status);
        return offerRepository.findAll();
    }

    @GetMapping("/{id}")
    public OfferEntity getOfferById(@PathVariable String id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
    }

    @PostMapping
    public ResponseEntity<OfferEntity> createOffer(@Valid @RequestBody OfferEntity offer) {
        if (offer.getId() == null || offer.getId().isBlank()) {
            offer.setId("OFF-" + (int) (Math.random() * 9000 + 1000));
        }

        // Resolve WishEntity if wishId or wish.id was supplied
        String targetWishId = (offer.getWish() != null && offer.getWish().getId() != null)
                ? offer.getWish().getId()
                : offer.getWishId();
        if (targetWishId != null) {
            WishEntity wish = wishRepository.findById(targetWishId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target wish not found: " + targetWishId));
            offer.setWish(wish);
            if (offer.getTargetBudget() == null) {
                offer.setTargetBudget(wish.getBudget());
            }
            wish.setOffersCount((wish.getOffersCount() == null ? 0 : wish.getOffersCount()) + 1);
            if ("OPEN".equals(wish.getStatus())) {
                wish.setStatus("OFFER_RECEIVED");
            }
            wishRepository.save(wish);
        }

        // Resolve Seller UserEntity if sellerId or seller.id was supplied
        String targetSellerId = (offer.getSeller() != null && offer.getSeller().getId() != null)
                ? offer.getSeller().getId()
                : offer.getSellerId();
        if (targetSellerId != null) {
            UserEntity seller = userRepository.findById(targetSellerId)
                    .orElseGet(() -> userRepository.findById("user-alex")
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seller not found: " + targetSellerId)));
            offer.setSeller(seller);
        }

        if (offer.getStatus() == null || offer.getStatus().isBlank()) {
            offer.setStatus("PENDING");
        }

        OfferEntity saved = offerRepository.save(offer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Update / Edit / Decline / Undo-Decline / Counter Offer
    @PutMapping("/{id}")
    public ResponseEntity<OfferEntity> updateOffer(@PathVariable String id, @RequestBody OfferEntity updateData) {
        OfferEntity existing = offerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found with id: " + id));

        if (updateData.getOfferedPrice() != null) {
            existing.setOfferedPrice(updateData.getOfferedPrice());
        }
        if (updateData.getDetails() != null) {
            existing.setDetails(updateData.getDetails());
        }
        if (updateData.getStatus() != null) {
            existing.setStatus(updateData.getStatus());
        }
        if (updateData.getCounterPrice() != null) {
            existing.setCounterPrice(updateData.getCounterPrice());
        }
        if (updateData.getCounterNote() != null) {
            existing.setCounterNote(updateData.getCounterNote());
        }

        OfferEntity saved = offerRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Accept Offer -> creates associated TransactionEntity
    @PostMapping("/{id}/accept")
    public ResponseEntity<TransactionEntity> acceptOffer(@PathVariable String id) {
        OfferEntity offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));

        offer.setStatus("ACCEPTED");
        offerRepository.save(offer);

        WishEntity wish = offer.getWish();
        if (wish != null) {
            wish.setStatus("MATCHED");
            wishRepository.save(wish);
        }

        TransactionEntity tx = TransactionEntity.builder()
                .id("TX-" + (int) (Math.random() * 9000 + 1000))
                .wish(wish)
                .offer(offer)
                .buyer(wish != null ? wish.getBuyer() : null)
                .seller(offer.getSeller())
                .agreedPrice(offer.getOfferedPrice())
                .status("IN_PROGRESS")
                .trackingNumber("TH-KERRY-" + (int) (Math.random() * 900000 + 100000))
                .buyerReviewed(false)
                .sellerReviewed(false)
                .build();

        TransactionEntity savedTx = transactionRepository.save(tx);
        return ResponseEntity.ok(savedTx);
    }

    // Remove Offer as Administrator or Withdraw Offer as Seller
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeOrWithdrawOffer(
            @PathVariable String id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false, defaultValue = "false") boolean withdraw
    ) {
        OfferEntity offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));

        WishEntity wish = offer.getWish();

        if (withdraw) {
            offerRepository.deleteById(id);
        } else {
            offer.setStatus("REMOVED_BY_ADMIN");
            offerRepository.save(offer);
        }

        if (wish != null) {
            int activeOffers = (int) offerRepository.findByWishId(wish.getId()).stream()
                    .filter(o -> "PENDING".equalsIgnoreCase(o.getStatus()))
                    .count();
            wish.setOffersCount(activeOffers);
            wishRepository.save(wish);
        }

        return ResponseEntity.noContent().build();
    }
}
