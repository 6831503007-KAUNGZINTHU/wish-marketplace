package com.marketplace.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * ENTITY 1 of 5: UserEntity
 * Represents a registered participant (buyer, seller, or administrator).
 * Relationships:
 * - One-To-Many with WishEntity (Wishes posted by this user as Buyer)
 * - One-To-Many with OfferEntity (Offers submitted by this user as Seller)
 * - One-To-Many with ReviewEntity (Reviews authored or received)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password", length = 100)
    @Builder.Default
    private String password = "password123";

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.valueOf(5.00);

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean verified = false;

    @Column(name = "is_admin")
    @Builder.Default
    private Boolean admin = false;

    @Column(name = "warning_count")
    @Builder.Default
    private Integer warningCount = 0;

    @Column(name = "joined_date", length = 50)
    @Builder.Default
    private String joinedDate = "Just now";

    @JsonProperty("isAdmin")
    public Boolean getIsAdmin() {
        return admin;
    }

    @JsonProperty("avatar")
    public String getAvatar() {
        return avatarUrl;
    }

    // RELATIONSHIP: One User -> Many Wishes (as Buyer)
    @OneToMany(mappedBy = "buyer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<WishEntity> wishes = new ArrayList<>();

    // RELATIONSHIP: One User -> Many Offers (as Seller)
    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<OfferEntity> offers = new ArrayList<>();

    // RELATIONSHIP: One User -> Many Reviews (received)
    @OneToMany(mappedBy = "toUser", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReviewEntity> receivedReviews = new ArrayList<>();
}
