package com.marketplace.controller;

import com.marketplace.entity.TransactionEntity;
import com.marketplace.entity.WishEntity;
import com.marketplace.repository.TransactionRepository;
import com.marketplace.repository.WishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final WishRepository wishRepository;

    @GetMapping
    public List<TransactionEntity> listTransactions(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String buyerId,
            @RequestParam(required = false) String sellerId
    ) {
        if (userId != null) {
            return transactionRepository.findAll().stream()
                    .filter(tx -> userId.equals(tx.getBuyerId()) || userId.equals(tx.getSellerId()))
                    .collect(Collectors.toList());
        }
        if (buyerId != null) {
            return transactionRepository.findByBuyerId(buyerId);
        }
        if (sellerId != null) {
            return transactionRepository.findBySellerId(sellerId);
        }
        return transactionRepository.findAll();
    }

    @GetMapping("/{id}")
    public TransactionEntity getTransactionById(@PathVariable String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<TransactionEntity> completeTransaction(@PathVariable String id) {
        TransactionEntity tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        tx.setStatus("COMPLETED");
        tx.setCompletedAt(LocalDateTime.now());
        TransactionEntity saved = transactionRepository.save(tx);

        WishEntity wish = tx.getWish();
        if (wish != null) {
            wish.setStatus("FULFILLED");
            wishRepository.save(wish);
        }

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TransactionEntity> patchTransaction(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates
    ) {
        return updateTransactionFields(id, updates);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionEntity> putTransaction(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates
    ) {
        return updateTransactionFields(id, updates);
    }

    private ResponseEntity<TransactionEntity> updateTransactionFields(String id, Map<String, Object> updates) {
        TransactionEntity tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (updates.containsKey("status") && updates.get("status") != null) {
            String newStatus = String.valueOf(updates.get("status"));
            tx.setStatus(newStatus);
            if ("COMPLETED".equalsIgnoreCase(newStatus) && tx.getCompletedAt() == null) {
                tx.setCompletedAt(LocalDateTime.now());
                if (tx.getWish() != null) {
                    tx.getWish().setStatus("FULFILLED");
                    wishRepository.save(tx.getWish());
                }
            }
        }
        if (updates.containsKey("trackingNumber") && updates.get("trackingNumber") != null) {
            tx.setTrackingNumber(String.valueOf(updates.get("trackingNumber")));
        }
        if (updates.containsKey("buyerReviewed") && updates.get("buyerReviewed") != null) {
            tx.setBuyerReviewed(Boolean.valueOf(String.valueOf(updates.get("buyerReviewed"))));
        }
        if (updates.containsKey("sellerReviewed") && updates.get("sellerReviewed") != null) {
            tx.setSellerReviewed(Boolean.valueOf(String.valueOf(updates.get("sellerReviewed"))));
        }

        return ResponseEntity.ok(transactionRepository.save(tx));
    }
}
