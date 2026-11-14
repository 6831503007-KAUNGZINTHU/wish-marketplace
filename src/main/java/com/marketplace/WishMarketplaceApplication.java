package com.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application Entry Point
 * Demonstrates Spring Boot 3 + Spring Data JPA with 5 Related Entities
 * Deployed on Google Cloud Run & Connected to H2 / Cloud SQL MySQL
 */
@SpringBootApplication
public class WishMarketplaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(WishMarketplaceApplication.class, args);
    }
}
