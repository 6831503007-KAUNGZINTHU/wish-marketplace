package com.marketplace.repository;

import com.marketplace.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, String> {
    @Query("SELECT t FROM TransactionEntity t WHERE t.buyer.id = :buyerId")
    List<TransactionEntity> findByBuyerId(@Param("buyerId") String buyerId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.seller.id = :sellerId")
    List<TransactionEntity> findBySellerId(@Param("sellerId") String sellerId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.wish.id = :wishId")
    Optional<TransactionEntity> findByWishId(@Param("wishId") String wishId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.offer.id = :offerId")
    Optional<TransactionEntity> findByOfferId(@Param("offerId") String offerId);
}
