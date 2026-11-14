package com.marketplace.repository;

import com.marketplace.entity.WishEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WishRepository extends JpaRepository<WishEntity, String> {
    @Query("SELECT w FROM WishEntity w WHERE w.buyer.id = :buyerId")
    List<WishEntity> findByBuyerId(@Param("buyerId") String buyerId);

    List<WishEntity> findByCategory(String category);
    List<WishEntity> findByStatus(String status);

    @Query("SELECT w FROM WishEntity w WHERE " +
           "(:query IS NULL OR LOWER(w.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:category IS NULL OR :category = 'All' OR w.category = :category) AND " +
           "(:maxBudget IS NULL OR w.budget <= :maxBudget) " +
           "ORDER BY w.createdAt DESC")
    List<WishEntity> searchWishes(
            @Param("query") String query,
            @Param("category") String category,
            @Param("maxBudget") BigDecimal maxBudget
    );
}
