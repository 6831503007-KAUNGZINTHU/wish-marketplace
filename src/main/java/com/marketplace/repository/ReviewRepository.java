package com.marketplace.repository;

import com.marketplace.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, String> {
    @Query("SELECT r FROM ReviewEntity r WHERE r.transaction.id = :transactionId")
    List<ReviewEntity> findByTransactionId(@Param("transactionId") String transactionId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.toUser.id = :toUserId")
    List<ReviewEntity> findByToUserId(@Param("toUserId") String toUserId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.fromUser.id = :fromUserId")
    List<ReviewEntity> findByFromUserId(@Param("fromUserId") String fromUserId);
}
