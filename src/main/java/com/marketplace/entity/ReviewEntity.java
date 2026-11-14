package com.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ENTITY 5 of 5: ReviewEntity
 * Peer reputation feedback attached to a completed Transaction.
 * Relationships:
 * - Many-To-One with TransactionEntity
 * - Many-To-One with UserEntity (author/fromUser)
 * - Many-To-One with UserEntity (subject/toUser)
 */
@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    // RELATIONSHIP: Review belongs to a Transaction
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id", nullable = false)
    private TransactionEntity transaction;

    // RELATIONSHIP: Author of the review
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_user_id", nullable = false)
    private UserEntity fromUser;

    // RELATIONSHIP: Recipient receiving the score
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_user_id", nullable = false)
    private UserEntity toUser;

    @Transient
    private String transactionId;

    @Transient
    private String fromUserId;

    @Transient
    private String toUserId;

    @NotNull(message = "Star rating is required")
    @Min(value = 1, message = "Rating must be at least 1 star")
    @Max(value = 5, message = "Rating cannot exceed 5 stars")
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @NotBlank(message = "Review comment is required")
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonProperty("transactionId")
    public String getTransactionId() {
        return transaction != null ? transaction.getId() : transactionId;
    }

    @JsonProperty("fromUserId")
    public String getFromUserId() {
        return fromUser != null ? fromUser.getId() : fromUserId;
    }

    @JsonProperty("fromUserName")
    public String getFromUserName() {
        return fromUser != null ? fromUser.getName() : null;
    }

    @JsonProperty("toUserId")
    public String getToUserId() {
        return toUser != null ? toUser.getId() : toUserId;
    }

    @JsonProperty("toUserName")
    public String getToUserName() {
        return toUser != null ? toUser.getName() : null;
    }
}
