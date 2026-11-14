package com.marketplace.controller;

import com.marketplace.entity.ReviewEntity;
import com.marketplace.entity.TransactionEntity;
import com.marketplace.entity.UserEntity;
import com.marketplace.repository.ReviewRepository;
import com.marketplace.repository.TransactionRepository;
import com.marketplace.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<ReviewEntity> listReviews(
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String toUserId,
            @RequestParam(required = false) String fromUserId
    ) {
        if (transactionId != null) return reviewRepository.findByTransactionId(transactionId);
        if (toUserId != null) return reviewRepository.findByToUserId(toUserId);
        if (fromUserId != null) return reviewRepository.findByFromUserId(fromUserId);
        return reviewRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<ReviewEntity> createReview(@Valid @RequestBody ReviewEntity review) {
        if (review.getId() == null || review.getId().isBlank()) {
            review.setId("REV-" + (int) (Math.random() * 9000 + 1000));
        }

        String txId = (review.getTransaction() != null && review.getTransaction().getId() != null)
                ? review.getTransaction().getId()
                : review.getTransactionId();
        if (txId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "transactionId is required");
        }

        TransactionEntity tx = transactionRepository.findById(txId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + txId));
        review.setTransaction(tx);

        String fromId = (review.getFromUser() != null && review.getFromUser().getId() != null)
                ? review.getFromUser().getId()
                : review.getFromUserId();
        UserEntity fromUser = fromId != null
                ? userRepository.findById(fromId).orElse(tx.getBuyer())
                : tx.getBuyer();
        review.setFromUser(fromUser);

        String toId = (review.getToUser() != null && review.getToUser().getId() != null)
                ? review.getToUser().getId()
                : review.getToUserId();
        UserEntity toUser = toId != null
                ? userRepository.findById(toId).orElse(tx.getSeller())
                : tx.getSeller();
        review.setToUser(toUser);

        ReviewEntity saved = reviewRepository.save(review);

        // Update Transaction reviewed flags
        if (fromUser != null && tx.getSeller() != null && fromUser.getId().equals(tx.getSeller().getId())) {
            tx.setSellerReviewed(true);
        } else {
            tx.setBuyerReviewed(true);
        }
        transactionRepository.save(tx);

        // Recalculate recipient user rating and reviewCount
        if (toUser != null) {
            List<ReviewEntity> userReviews = reviewRepository.findByToUserId(toUser.getId());
            int count = userReviews.size();
            if (count > 0) {
                double avg = userReviews.stream()
                        .mapToInt(ReviewEntity::getRating)
                        .average()
                        .orElse(5.0);
                toUser.setRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
                toUser.setReviewCount(Math.max(toUser.getReviewCount() == null ? 0 : toUser.getReviewCount() + 1, count));
                userRepository.save(toUser);
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
