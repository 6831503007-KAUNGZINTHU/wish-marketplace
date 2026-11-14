package com.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ENTITY 2 of 5: WishEntity
 * Reverse e-commerce demand request posted by a buyer.
 * Relationships:
 * - Many-To-One with UserEntity (buyer)
 * - One-To-Many with OfferEntity (proposals submitted by sellers)
 * - One-To-One with TransactionEntity (when matched)
 */
@Entity
@Table(name = "wishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @NotBlank(message = "Wish title is required")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "brand", length = 100)
    private String brand;

    @NotBlank(message = "Category is required")
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "1.00", message = "Budget must be at least 1.00")
    @Column(name = "budget", nullable = false, precision = 10, scale = 2)
    private BigDecimal budget;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, OFFER_RECEIVED, MATCHED, FULFILLED, CANCELLED

    @Column(name = "offers_count")
    @Builder.Default
    private Integer offersCount = 0;

    @Column(name = "is_flagged")
    @Builder.Default
    private Boolean isFlagged = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // RELATIONSHIP: Many Wishes -> One Buyer (UserEntity)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private UserEntity buyer;

    // Optional transient buyerId for flat JSON creation requests
    @Transient
    private String buyerId;

    @JsonProperty("buyerId")
    public String getBuyerId() {
        return buyer != null ? buyer.getId() : buyerId;
    }

    @JsonProperty("buyerName")
    public String getBuyerName() {
        return buyer != null ? buyer.getName() : null;
    }

    @JsonProperty("buyerAvatar")
    public String getBuyerAvatar() {
        return buyer != null ? buyer.getAvatarUrl() : null;
    }

    @JsonProperty("buyerRating")
    public BigDecimal getBuyerRating() {
        return buyer != null ? buyer.getRating() : BigDecimal.valueOf(5.0);
    }

    // RELATIONSHIP: One Wish -> Many Offers (OfferEntity)
    @OneToMany(mappedBy = "wish", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<OfferEntity> offers = new ArrayList<>();

    // Helper method to add an offer and keep bidirectional integrity
    public void addOffer(OfferEntity offer) {
        offers.add(offer);
        offer.setWish(this);
        this.offersCount = (this.offersCount == null ? 0 : this.offersCount) + 1;
        if ("OPEN".equals(this.status)) {
            this.status = "OFFER_RECEIVED";
        }
    }
}
