package com.marketplace.repository;

import com.marketplace.entity.OfferEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<OfferEntity, String> {
    @Query("SELECT o FROM OfferEntity o WHERE o.wish.id = :wishId")
    List<OfferEntity> findByWishId(@Param("wishId") String wishId);

    @Query("SELECT o FROM OfferEntity o WHERE o.seller.id = :sellerId")
    List<OfferEntity> findBySellerId(@Param("sellerId") String sellerId);

    List<OfferEntity> findByStatus(String status);
}
