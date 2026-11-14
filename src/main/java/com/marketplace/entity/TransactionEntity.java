package com.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ENTITY 4 of 5: TransactionEntity
 * Represents a matched commercial deal formed when a buyer accepts an offer.
 * Relationships:
 * - One-To-One with WishEntity (the fulfilled wish)
 * - One-To-One with OfferEntity (the winning offer)
 * - Many-To-One with UserEntity (buyer)
 * - Many-To-One with UserEntity (seller)
 * - One-To-Many with ReviewEntity (feedback left for this transaction)
 */
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    // RELATIONSHIP: Links the fulfilled Wish
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "wish_id", nullable = false)
    private WishEntity wish;

    // RELATIONSHIP: Links the accepted Offer
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offer_id", nullable = false)
    private OfferEntity offer;

    // RELATIONSHIP: Buyer User
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private UserEntity buyer;

    // RELATIONSHIP: Seller User
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private UserEntity seller;

    @NotNull(message = "Agreed price is required")
    @DecimalMin(value = "0.01", message = "Price must be positive")
    @Column(name = "agreed_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal agreedPrice;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "buyer_reviewed")
    @Builder.Default
    private Boolean buyerReviewed = false;

    @Column(name = "seller_reviewed")
    @Builder.Default
    private Boolean sellerReviewed = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @JsonProperty("wishId")
    public String getWishId() {
        return wish != null ? wish.getId() : null;
    }

    @JsonProperty("wishTitle")
    public String getWishTitle() {
        return wish != null ? wish.getTitle() : null;
    }

    @JsonProperty("offerId")
    public String getOfferId() {
        return offer != null ? offer.getId() : null;
    }

    @JsonProperty("category")
    public String getCategory() {
        return wish != null ? wish.getCategory() : null;
    }

    @JsonProperty("targetBudget")
    public BigDecimal getTargetBudget() {
        return wish != null ? wish.getBudget() : agreedPrice;
    }

    @JsonProperty("buyerId")
    public String getBuyerId() {
        return buyer != null ? buyer.getId() : null;
    }

    @JsonProperty("buyerName")
    public String getBuyerName() {
        return buyer != null ? buyer.getName() : null;
    }

    @JsonProperty("sellerId")
    public String getSellerId() {
        return seller != null ? seller.getId() : null;
    }

    @JsonProperty("sellerName")
    public String getSellerName() {
        return seller != null ? seller.getName() : null;
    }

    // RELATIONSHIP: One Transaction -> Multiple Reviews (Buyer and Seller reviews)
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReviewEntity> reviews = new ArrayList<>();
}
