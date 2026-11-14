package com.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ENTITY 3 of 5: OfferEntity
 * Direct price quote submitted by a verified seller on a specific Wish.
 * Relationships:
 * - Many-To-One with WishEntity (the target request)
 * - Many-To-One with UserEntity (the seller making the offer)
 */
@Entity
@Table(name = "offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    // RELATIONSHIP: Many Offers -> One Target Wish
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "wish_id", nullable = false)
    private WishEntity wish;

    // RELATIONSHIP: Many Offers -> One Seller (UserEntity)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id", nullable = false)
    private UserEntity seller;

    @Transient
    private String wishId;

    @Transient
    private String sellerId;

    @NotNull(message = "Offered price is required")
    @DecimalMin(value = "1.00", message = "Offer price must be positive")
    @Column(name = "offered_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal offeredPrice;

    @Column(name = "target_budget", nullable = false, precision = 10, scale = 2)
    private BigDecimal targetBudget;

    @NotBlank(message = "Offer details and specifications are required")
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, COUNTERED, ACCEPTED, DECLINED, CLOSED, REMOVED_BY_ADMIN

    @Column(name = "counter_price", precision = 10, scale = 2)
    private BigDecimal counterPrice;

    @Column(name = "counter_note", columnDefinition = "TEXT")
    private String counterNote;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonProperty("wishId")
    public String getWishId() {
        return wish != null ? wish.getId() : wishId;
    }

    @JsonProperty("wishTitle")
    public String getWishTitle() {
        return wish != null ? wish.getTitle() : null;
    }

    @JsonProperty("category")
    public String getCategory() {
        return wish != null ? wish.getCategory() : null;
    }

    @JsonProperty("buyerId")
    public String getBuyerId() {
        return (wish != null && wish.getBuyer() != null) ? wish.getBuyer().getId() : null;
    }

    @JsonProperty("buyerName")
    public String getBuyerName() {
        return (wish != null && wish.getBuyer() != null) ? wish.getBuyer().getName() : null;
    }

    @JsonProperty("sellerId")
    public String getSellerId() {
        return seller != null ? seller.getId() : sellerId;
    }

    @JsonProperty("sellerName")
    public String getSellerName() {
        return seller != null ? seller.getName() : null;
    }

    @JsonProperty("sellerRating")
    public BigDecimal getSellerRating() {
        return seller != null ? seller.getRating() : BigDecimal.valueOf(5.0);
    }

    @JsonProperty("sellerReviewCount")
    public Integer getSellerReviewCount() {
        return seller != null ? seller.getReviewCount() : 0;
    }
}
