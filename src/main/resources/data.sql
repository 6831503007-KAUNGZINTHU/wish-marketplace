-- ====================================================================
-- Initial Seed Data for 5 Related Entities (H2 & MySQL Compatible)
-- ====================================================================

-- 1. Insert Users (Demo password for all accounts: password123)
INSERT INTO users (id, name, email, password, phone, avatar_url, rating, review_count, is_verified, is_admin, warning_count, joined_date)
VALUES 
('user-sarah', 'Sarah Jenkins', 'sarah@example.com', 'password123', '+1 (555) 234-8901', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 4.90, 14, true, false, 0, 'March 2024'),
('user-alex', 'Alex Miller', 'alex@example.com', 'password123', '+1 (555) 892-4112', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 4.90, 8, true, false, 1, 'January 2024'),
('user-elena', 'Elena Rostova', 'elena@example.com', 'password123', '+1 (555) 391-0042', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 5.00, 31, true, false, 0, 'February 2024'),
('user-marcus', 'Marcus Chen', 'marcus@example.com', 'password123', '+1 (555) 774-1920', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', 4.70, 9, false, false, 0, 'April 2024'),
('user-admin', 'Marketplace Admin', 'admin@wishmarket.com', 'password123', '+1 (555) 000-1122', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 5.00, 0, true, true, 0, 'System Admin');

-- 2. Insert Wishes (Demand Posts with Product Images)
INSERT INTO wishes (id, title, brand, category, budget, description, image_url, buyer_id, status, offers_count, is_flagged)
VALUES
('WISH-1001', 'iPhone 15 Pro (128GB, Natural Titanium)', 'Apple', 'Electronics', 27500.00, 'Looking for an unlocked iPhone 15 Pro in clean condition. 90%+ battery health with original box preferred.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', 'user-sarah', 'OFFER_RECEIVED', 2, false),
('WISH-1002', 'Sony WH-1000XM5 Wireless Headphones', 'Sony', 'Electronics', 7900.00, 'Looking for black Sony XM5 headphones with original carrying case and cables. Working active noise cancelation required.', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', 'user-alex', 'OPEN', 0, false),
('WISH-1003', 'Nike Air Jordan 1 Retro High (Size 10.5)', 'Nike', 'Fashion', 7500.00, 'Seeking authentic pair in great condition with original box and clean soles.', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80', 'user-sarah', 'OPEN', 0, false),
('WISH-1004', 'Nintendo Switch OLED Model (White)', 'Nintendo', 'Collectibles', 8500.00, 'Looking for a clean Switch OLED console with TV dock, HDMI cable, power adapter, and working Joy-Cons.', 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&auto=format&fit=crop&q=80', 'user-alex', 'OFFER_RECEIVED', 1, false),
('WISH-1005', 'Handmade Stoneware Ceramic Coffee Mug Set', 'Artisan Studio', 'Crafts', 1500.00, 'Looking for artisan handcrafted pottery mugs with earthy glaze, 12-14oz capacity. Dishwasher safe preferred.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 'user-sarah', 'OPEN', 0, false),
('WISH-1006', 'Vintage Distressed Leather Motorcycle Jacket (Size L)', 'Schott NYC', 'Fashion', 4500.00, 'Looking for genuine distressed dark brown or black leather biker jacket in good wearable condition with heavy brass zippers.', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80', 'user-alex', 'OPEN', 0, false),
('WISH-1007', 'Ceremonial Grade Uji Matcha Green Tea Powder (100g)', 'Marukyu Koyamaen', 'Food', 1350.00, 'Seeking authentic first-harvest ceremonial grade Japanese matcha from Uji, Kyoto. Sealed tin with vibrant emerald color and smooth umami flavor.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 'user-sarah', 'OFFER_RECEIVED', 1, false),
('WISH-1008', 'Mid-Century Modern Walnut Arc Floor Lamp', 'West Elm', 'Home', 5800.00, 'Looking for a clean curved walnut and brushed brass arc floor lamp with heavy marble base and fabric drum shade in warm white.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80', 'user-alex', 'OPEN', 0, false),
('WISH-1009', 'First Edition Dune Hardcover (1965 Chilton)', 'Chilton Books', 'Books', 32500.00, 'Collectible science fiction book in good condition with dust jacket preserved.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 'user-sarah', 'MATCHED', 1, false),
('WISH-9901', 'Vintage IBM Model M Mechanical Keyboard (1989)', 'IBM', 'Collectibles', 6500.00, 'Original buckling spring clicky keyboard with blue badge, PS/2 cable, and all keycaps intact.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80', 'user-alex', 'FULFILLED', 1, false);

-- 3. Insert Offers (Seller Price Proposals)
INSERT INTO offers (id, wish_id, seller_id, offered_price, target_budget, details, status)
VALUES
('OFF-5001', 'WISH-1001', 'user-alex', 26500.00, 27500.00, 'I have an unlocked iPhone 15 Pro 128GB in Natural Titanium with 94% battery health, original box, and USB-C braided cable. Zero scratches on screen.', 'PENDING'),
('OFF-5002', 'WISH-1001', 'user-elena', 27000.00, 27500.00, 'Mint condition iPhone 15 Pro with AppleCare+ coverage, original packaging, and MagSafe clear case included.', 'PENDING'),
('OFF-5003', 'WISH-1004', 'user-sarah', 7900.00, 8500.00, 'Includes original box, tempered glass screen protector pre-installed, white OLED dock, Joy-Con grip, and all original cables.', 'PENDING'),
('OFF-5004', 'WISH-1007', 'user-alex', 1250.00, 1350.00, 'Freshly imported sealed 100g tin of Marukyu Koyamaen Isuzu ceremonial Uji matcha, stored chilled.', 'PENDING'),
('OFF-5005', 'WISH-1009', 'user-elena', 31000.00, 32500.00, 'Authentic Chilton printing with archival Mylar protective cover over original dust jacket. Insured express shipping.', 'ACCEPTED'),
('OFF-5006', 'WISH-9901', 'user-sarah', 6200.00, 6500.00, 'Cleaned and tested 1989 Model M part 1391401 with detachable SDL to PS/2 cable and active USB converter included.', 'ACCEPTED');

-- 4. Insert Transactions (Matched Orders)
INSERT INTO transactions (id, wish_id, offer_id, buyer_id, seller_id, agreed_price, status, tracking_number, buyer_reviewed, seller_reviewed)
VALUES
('TX-9001', 'WISH-1009', 'OFF-5005', 'user-sarah', 'user-elena', 31000.00, 'IN_PROGRESS', 'TH-KERRY-88492019', false, false),
('TX-9002', 'WISH-9901', 'OFF-5006', 'user-alex', 'user-sarah', 6200.00, 'COMPLETED', 'TH-EMS-781293847', true, true);

-- 5. Insert Reviews (Transaction Feedback)
INSERT INTO reviews (id, transaction_id, from_user_id, to_user_id, rating, comment)
VALUES
('REV-3001', 'TX-9002', 'user-alex', 'user-sarah', 5, 'Superb vintage keyboard in museum condition! Quick shipping and impeccable packaging.'),
('REV-3002', 'TX-9002', 'user-sarah', 'user-alex', 5, 'Smooth and prompt payment! Alex is an outstanding buyer.');
