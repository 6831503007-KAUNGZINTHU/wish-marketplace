-- ====================================================================
-- Wish Marketplace: 5 Related Relational Entities DDL Schema
-- Compatible with both H2 In-Memory and MySQL / Cloud SQL
-- ====================================================================

DROP TABLE IF EXISTS warnings;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS wishes;
DROP TABLE IF EXISTS users;

-- 1. USERS Entity Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(100) DEFAULT 'password123',
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    warning_count INT DEFAULT 0,
    joined_date VARCHAR(50) NOT NULL
);

-- 2. WISHES Entity Table (Demand Request, Many-To-One with User)
CREATE TABLE wishes (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(1000),
    buyer_id VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    offers_count INT DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wish_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. OFFERS Entity Table (Seller Price Proposal, Many-To-One with Wish, Many-To-One with Seller User)
CREATE TABLE offers (
    id VARCHAR(64) PRIMARY KEY,
    wish_id VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    offered_price DECIMAL(10, 2) NOT NULL,
    target_budget DECIMAL(10, 2) NOT NULL,
    details TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    counter_price DECIMAL(10, 2) NULL,
    counter_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offer_wish FOREIGN KEY (wish_id) REFERENCES wishes(id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. TRANSACTIONS Entity Table (Matched Order, links Wish, winning Offer, Buyer, and Seller)
CREATE TABLE transactions (
    id VARCHAR(64) PRIMARY KEY,
    wish_id VARCHAR(64) NOT NULL,
    offer_id VARCHAR(64) NOT NULL,
    buyer_id VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    agreed_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    tracking_number VARCHAR(100),
    buyer_reviewed BOOLEAN DEFAULT FALSE,
    seller_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_tx_wish FOREIGN KEY (wish_id) REFERENCES wishes(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. REVIEWS Entity Table (Rating & Feedback for a Transaction, Many-To-One with Transaction & Users)
CREATE TABLE reviews (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    from_user_id VARCHAR(64) NOT NULL,
    to_user_id VARCHAR(64) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_from FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_to FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indices for fast searching and foreign key joins
CREATE INDEX idx_wishes_buyer ON wishes(buyer_id);
CREATE INDEX idx_wishes_category ON wishes(category);
CREATE INDEX idx_offers_wish ON offers(wish_id);
CREATE INDEX idx_offers_seller ON offers(seller_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_reviews_tx ON reviews(transaction_id);
