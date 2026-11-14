# Wish Marketplace - Reverse E-Commerce Platform
## Spring Boot 3.3.4 + Spring Data JPA + H2 Database + React

Wish Marketplace is a reverse e-commerce platform where buyers post specific demand requests ("wishes") with their target budget, category, and product photos, and verified sellers compete by submitting direct price offers or counter-offers. Once a buyer accepts an offer, the system creates a transaction order to manage delivery tracking and allows both parties to leave ratings and reviews upon completion.

---

## GROUP MEMBERS

    6831503007  Kaung Zin Thu
    6831503008  Kyal Sin Linn Latt
    6831503044  Natthanon Phromplod
    6831503061  Patcharapol BuaNgoen
    6831503088  Yoon Eain San

---

## How to Run the Project

This repository is a Maven Spring Boot project (`pom.xml` at the root) configured to use an in-memory **H2 database** by default (`spring.profiles.active=h2`), so no external database installation is required.

### Step 1: Clone the Repository

    git clone https://github.com/6831503007-KAUNGZINTHU/wish-marketplace.git
    cd wish-marketplace

### Step 2: Run with Maven from the Root Directory

    mvn spring-boot:run

### Step 3: Open the Application in Your Browser
- **Application URL (Port 8080)**: `http://localhost:8080`
- **H2 Database Console**: `http://localhost:8080/h2-console`
  - **JDBC URL**: `jdbc:h2:mem:wishmarket_db`
  - **User Name**: `sa`
  - **Password**: *(leave empty)*

### Step 4: Test Login Credentials
- **Buyer / Seller Login**: `sarah@example.com` (Password: `password123`)
- **Seller Login**: `alex@example.com` (Password: `password123`)
- **Admin Login**: `admin@wishmarket.com` (Password: `password123`)
- You can log in using any seeded Buyer, Seller, or Admin account (or switch between demo accounts directly from the top navigation bar, or register a new account).

---

## Member Responsibilities & Features

- **6831503007  Kaung Zin Thu — Wish Demand Management & Search (`WishController`, `WishEntity`, `WishRepository`, `WebConfig`)**
  - Designed and implemented buyer wish creation, editing, deletion, category filtering, budget filtering, and keyword search REST endpoints (`/api/wishes`).
  - Configured Spring Boot static SPA serving (`WebConfig`) and integrated frontend wish browsing and creation flows.

- **6831503008  Kyal Sin Linn Latt — Seller Offer & Counter-Offer System (`OfferController`, `OfferEntity`, `OfferRepository`)**
  - Implemented seller offer submission, editing, declining, undo-decline, counter-offer negotiation, and offer withdrawal endpoints (`/api/offers`).
  - Integrated buyer/seller offer comparison views and status transitions in the frontend.

- **6831503044  Natthanon Phromplod — Order Matching & Transaction Lifecycle (`TransactionController`, `TransactionEntity`, `TransactionRepository`)**
  - Implemented the offer acceptance workflow that transitions wishes to `MATCHED` and creates order transactions (`/api/offers/{id}/accept`, `/api/transactions`).
  - Built order tracking number updates, delivery completion, and transaction history views.

- **6831503061  Patcharapol BuaNgoen — User Accounts, Authentication & Profile (`UserController`, `AuthController`, `UserEntity`, `UserRepository`)**
  - Implemented user registration, login authentication, password reset, and profile update endpoints (`/api/auth/*`, `/api/users/*`).
  - Built user profile management, verification status handling, and user-specific wish/offer history endpoints.

- **6831503088  Yoon Eain San — Rating & Review System, Moderation & H2 Database (`ReviewController`, `ReviewEntity`, `ReviewRepository`, `schema.sql`, `data.sql`)**
  - Implemented mutual post-transaction reviews (`/api/reviews`) with automatic user rating and review count recalculation.
  - Designed the relational database schema (`schema.sql`), seeded initial marketplace data (`data.sql`), and configured admin moderation features.

---

## Architecture & Project Structure

    /
    ├── pom.xml                                  # Root Maven configuration (Java 17, Spring Boot 3.3.4)
    ├── package.json                             # React + Vite frontend dependencies & scripts
    ├── vite.config.ts                           # Vite proxy (/api -> :8080) & static build config
    ├── src/
    │   ├── main/
    │   │   ├── java/com/marketplace/
    │   │   │   ├── WishMarketplaceApplication.java
    │   │   │   ├── controller/
    │   │   │   │   ├── WishController.java          # /api/wishes (List/Search, Create, Update, Delete, Related Offers)
    │   │   │   │   ├── OfferController.java         # /api/offers (List, Create, Update/Decline/Counter, Accept -> Transaction, Delete)
    │   │   │   │   ├── TransactionController.java   # /api/transactions (List, Filter by User, Complete Order, Update Tracking)
    │   │   │   │   ├── ReviewController.java        # /api/reviews (List, Create Review & Recalculate User Rating)
    │   │   │   │   ├── UserController.java          # /api/users (List, Get, Create, Update Profile, User Wishes/Offers)
    │   │   │   │   ├── AuthController.java          # /api/auth (Login, Register, Reset Password)
    │   │   │   │   └── WebConfig.java               # Global CORS & SPA root forwarding
    │   │   │   ├── entity/
    │   │   │   │   ├── UserEntity.java              # Entity 1: users
    │   │   │   │   ├── WishEntity.java              # Entity 2: wishes
    │   │   │   │   ├── OfferEntity.java             # Entity 3: offers
    │   │   │   │   ├── TransactionEntity.java       # Entity 4: transactions
    │   │   │   │   └── ReviewEntity.java            # Entity 5: reviews
    │   │   │   └── repository/
    │   │   │       ├── UserRepository.java
    │   │   │       ├── WishRepository.java
    │   │   │       ├── OfferRepository.java
    │   │   │       ├── TransactionRepository.java
    │   │   │       └── ReviewRepository.java
    │   │   └── resources/
    │   │       ├── application.properties           # Spring Boot & H2 database configuration
    │   │       ├── schema.sql                       # Relational DDL for all 5 entities
    │   │       ├── data.sql                         # Initial seed data for users, wishes, offers, transactions, and reviews
    │   │       └── static/                          # Compiled frontend assets served at http://localhost:8080
    │   ├── services/
    │   │   └── api.ts                               # Frontend REST client connecting React state to Spring Boot /api/*
    │   ├── components/                              # React UI components
    │   └── App.tsx                                  # Main React application

---

## 5 Related JPA Entity Classes

1. **`UserEntity` (`users`)**
   - `@OneToMany(mappedBy = "buyer")` → `List<WishEntity>`
   - `@OneToMany(mappedBy = "seller")` → `List<OfferEntity>`
   - `@OneToMany(mappedBy = "toUser")` → `List<ReviewEntity>`
2. **`WishEntity` (`wishes`)**
   - `@ManyToOne` → `UserEntity` (`buyer_id`)
   - `@OneToMany(mappedBy = "wish", cascade = CascadeType.ALL, orphanRemoval = true)` → `List<OfferEntity>`
3. **`OfferEntity` (`offers`)**
   - `@ManyToOne` → `WishEntity` (`wish_id`)
   - `@ManyToOne` → `UserEntity` (`seller_id`)
4. **`TransactionEntity` (`transactions`)**
   - `@OneToOne` → `WishEntity` (`wish_id`) & `OfferEntity` (`offer_id`)
   - `@ManyToOne` → `UserEntity` (`buyer_id`) & `UserEntity` (`seller_id`)
   - `@OneToMany(mappedBy = "transaction")` → `List<ReviewEntity>`
5. **`ReviewEntity` (`reviews`)**
   - `@ManyToOne` → `TransactionEntity` (`transaction_id`), `UserEntity` (`from_user_id`), and `UserEntity` (`to_user_id`)