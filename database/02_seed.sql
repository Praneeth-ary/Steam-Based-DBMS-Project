-- Seed data: ≥10 rows per table (SDD demo). Passwords: admin123 / dev123 / consumer123

SET NAMES utf8mb4;
USE gdps;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE offers;
TRUNCATE TABLE reviews;
TRUNCATE TABLE payments;
TRUNCATE TABLE purchases;
TRUNCATE TABLE user_library;
TRUNCATE TABLE games;
TRUNCATE TABLE developers;
TRUNCATE TABLE publishers;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO developers (developer_id, developer_name, country) VALUES
(1, 'Aurora Interactive', 'US'),
(2, 'Nexus Forge', 'DE'),
(3, 'Crimson Byte Studios', 'JP'),
(4, 'Polar North Games', 'CA'),
(5, 'Starlight Labs', 'FR'),
(6, 'Ironclad Entertainment', 'UK'),
(7, 'Velvet Pixel', 'SE'),
(8, 'Driftline Creative', 'KR'),
(9, 'Obsidian Loop', 'PL'),
(10, 'Helix Orbit', 'IN');

INSERT INTO users (user_id, username, email, password_hash, country, role, join_date, developer_id, publisher_id) VALUES
(1, 'admin', 'admin@gdps.com', '$2b$12$yXp3R.7Lakdm83KX.UsFKOqu39uvgQeQWT9ibRMEYp2yGMEmAMte.', 'IN', 'Admin', '2025-01-01 10:00:00', NULL, NULL),
(2, 'dev_aurora', 'aurora@dev.com', '$2b$12$x2/PdVvsmhYqflLk/BQHUe7K8teAcaCZkUKX53OxZ.uZvveGX0s8C', 'US', 'Developer', '2025-02-15 11:00:00', 1, NULL),
(3, 'dev_nexus', 'nexus@dev.com', '$2b$12$x2/PdVvsmhYqflLk/BQHUe7K8teAcaCZkUKX53OxZ.uZvveGX0s8C', 'DE', 'Developer', '2025-03-01 09:30:00', 2, NULL),
(4, 'player_elena', 'elena@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'ES', 'Consumer', '2025-04-10 12:00:00', NULL, NULL),
(5, 'player_marcus', 'marcus@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'UK', 'Consumer', '2025-04-11 13:00:00', NULL, NULL),
(6, 'player_sofia', 'sofia@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'IT', 'Consumer', '2025-05-02 14:00:00', NULL, NULL),
(7, 'player_ken', 'ken@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'JP', 'Consumer', '2025-05-20 15:00:00', NULL, NULL),
(8, 'player_ava', 'ava@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'FR', 'Consumer', '2025-06-01 16:00:00', NULL, NULL),
(9, 'player_liam', 'liam@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'CA', 'Consumer', '2025-06-15 17:00:00', NULL, NULL),
(10, 'player_zoe', 'zoe@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'AU', 'Consumer', '2025-07-01 18:00:00', NULL, NULL),
(11, 'player_extra', 'extra@mail.local', '$2b$12$1/2L2JK1QUWW2Xsq9rKTiOTzImXX08dMwVd7VL.wNdIgEhB6ssBly', 'BR', 'Consumer', '2025-07-15 19:00:00', NULL, NULL),
(12, 'pub_global', 'globalplay@studio.com', '$2b$12$x2/PdVvsmhYqflLk/BQHUe7K8teAcaCZkUKX53OxZ.uZvveGX0s8C', 'US', 'Publisher', '2025-01-06 10:00:00', NULL, 1);



INSERT INTO publishers (publisher_id, publisher_name, country) VALUES
(1, 'Global Play Partners', 'US'),
(2, 'Euro Digital Distro', 'DE'),
(3, 'Tokyo Game Press', 'JP'),
(4, 'Maple Leaf Interactive', 'CA'),
(5, 'Seine Software SA', 'FR'),
(6, 'Thames Publishing Ltd', 'UK'),
(7, 'Nordic Bytes AB', 'SE'),
(8, 'Han River Media', 'KR'),
(9, 'Vistula Digital', 'PL'),
(10, 'Monsoon Interactive', 'IN');

INSERT INTO games (game_id, title, description, price, release_date, category, is_active, developer_id, publisher_id, cover_url) VALUES
(1, 'Neon Drift 2077', 'Open-world cyber racing RPG.', 59.99, '2024-03-01', 'RPG', 1, 1, 1, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
(2, 'Echoes of Aether', 'Narrative puzzle adventure.', 39.99, '2024-04-12', 'Adventure', 1, 2, 2, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'),
(3, 'Titanfall Tactics', 'Turn-based mech strategy.', 49.99, '2024-05-20', 'Strategy', 1, 3, 3, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'),
(4, 'Frostbound', 'Survival co-op in endless winter.', 29.99, '2024-06-01', 'Survival', 1, 4, 4, 'https://images.unsplash.com/photo-1493711662162-e26ffde2da36?w=400'),
(5, 'Solar Sails', 'Naval combat in space.', 44.99, '2024-07-10', 'Action', 1, 5, 5, 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400'),
(6, 'Dungeon Almanac', 'Roguelike deck-builder.', 24.99, '2024-08-05', 'Indie', 1, 6, 6, 'https://images.unsplash.com/photo-1509198397868-b475b111c546?w=400'),
(7, 'Velvet Samurai', 'Stylish action slasher.', 54.99, '2024-09-15', 'Action', 1, 7, 7, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400'),
(8, 'Metro Mind', 'Psychological horror walking sim.', 19.99, '2024-10-01', 'Horror', 1, 8, 8, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
(9, 'Lattice Logic', 'Minimalist programming puzzler.', 14.99, '2024-11-20', 'Puzzle', 1, 9, 9, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'),
(10, 'Monsoon Racing', 'Arcade street racing.', 34.99, '2025-01-08', 'Racing', 1, 10, 10, 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400'),
(11, 'Skyforge Chronicles', 'MMO-lite co-op RPG.', 69.99, '2025-02-14', 'RPG', 1, 1, 1, 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400'),
(12, 'Pixel Frontier', 'Retro platformer anthology.', 9.99, '2023-12-01', 'Platformer', 1, 2, 2, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'),
(13, 'Cyber Haven Protocol', 'Hack the megacity: story-driven cyber RPG with faction wars.', 45.99, '2025-03-01', 'RPG', 1, 3, 3, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'),
(14, 'Ember & Steel', 'Souls-like combat in a dying fantasy empire.', 39.99, '2025-01-20', 'Action', 1, 4, 4, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400'),
(15, 'Courtside Dynasty 2026', 'Franchise basketball sim with full career mode.', 59.99, '2025-09-01', 'Sports', 1, 5, 5, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'),
(16, 'Whispering Woods', 'Cozy exploration and crafting in a living forest.', 22.99, '2024-11-05', 'Adventure', 1, 6, 6, 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400'),
(17, 'Orbital Mechanics', 'Build stations, mine asteroids, trade routes across the belt.', 34.99, '2025-02-28', 'Simulation', 1, 7, 7, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'),
(18, 'Neon Samurai Zero', 'Fast slash-runner through a rain-soaked megacity.', 49.99, '2025-04-10', 'Action', 1, 8, 8, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'),
(19, 'Ancient Realms Online', 'Classic tab-target MMO with huge raids.', 19.99, '2024-06-18', 'MMORPG', 1, 9, 9, 'https://images.unsplash.com/photo-1509198397868-b475b111c546?w=400'),
(20, 'Tank Battalion World', 'WW2-inspired tactical RTS with destructible maps.', 29.99, '2025-05-12', 'Strategy', 1, 10, 10, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'),
(21, 'Rhythm Galaxy', 'Chart-topping tracks and a neon lane-runner campaign.', 17.99, '2024-12-01', 'Music', 1, 1, 2, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'),
(22, 'Shadow Agent', 'Gadget-heavy stealth in a globe-trotting spy thriller.', 42.99, '2025-03-22', 'Stealth', 1, 2, 3, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
(23, 'Cosmic Miner', 'Idle-clicker meets deep space logistics.', 7.99, '2024-08-30', 'Casual', 1, 3, 4, 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400'),
(24, 'BattleCards Legends', 'Collectible card battler with seasonal leagues.', 12.99, '2025-01-05', 'Card Game', 1, 4, 5, 'https://images.unsplash.com/photo-1611996575749-79a3a250c948?w=400'),
(25, 'Project Mirage VR', 'Room-scale puzzles and zero-G arenas.', 59.99, '2025-06-01', 'VR', 1, 5, 6, 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400'),
(26, 'Serpent''s Oath', 'Party-based RPG with moral choices that reshape the world.', 54.99, '2025-04-18', 'RPG', 1, 6, 7, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
(27, 'Starforge Tactics', 'Fleet battles with orbital terrain and crew morale systems.', 36.99, '2025-05-22', 'Strategy', 1, 7, 8, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'),
(28, 'Jungle Run Royale', 'Speedrun battle royale through collapsing ruins and vines.', 19.99, '2025-06-03', 'Action', 1, 8, 9, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'),
(29, 'Crystal Forge Saga', 'Craft gear from living crystals in a co-op action RPG.', 47.99, '2025-06-18', 'RPG', 1, 9, 10, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'),
(30, 'Dockyard Simulator', 'Restore historic ships, hire crews, and sail contracts.', 32.99, '2025-07-01', 'Simulation', 1, 10, 1, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'),
(31, 'Prism Break Arena', 'Arena shooter with light-bending abilities and zero-G zones.', 28.99, '2025-07-12', 'FPS', 1, 1, 2, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'),
(32, 'Eclipse Protocol', 'Sci-fi detective visual novel with branching timelines.', 21.99, '2025-07-25', 'Adventure', 1, 2, 3, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'),
(33, 'Mesa Sunrise Stories', 'Anthology walking sim across interconnected desert towns.', 16.99, '2025-08-05', 'Indie', 1, 3, 4, 'https://images.unsplash.com/photo-1509316785289-025f5f846846?w=400'),
(34, 'Iron Vanguard FPS', 'Boots-on-ground shooter with destructible cover.', 44.99, '2025-08-14', 'FPS', 1, 4, 5, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'),
(35, 'Cloudskipper', 'Relaxing sky-island builder and chill exploration.', 13.99, '2025-08-28', 'Casual', 1, 5, 6, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'),
(36, 'Alchemy Online', 'Co-op potion economy MMO with player-run shops.', 24.99, '2025-09-02', 'MMORPG', 1, 6, 7, 'https://images.unsplash.com/photo-1509198397868-b475b111c546?w=400');

INSERT INTO offers (offer_id, game_id, starting_date, ending_date, percentage_off) VALUES
(1, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 25.00),
(2, 2, '2026-02-01 00:00:00', '2026-08-01 00:00:00', 15.00),
(3, 3, '2026-03-01 00:00:00', '2026-09-01 00:00:00', 20.00),
(4, 4, '2026-01-15 00:00:00', '2026-07-15 00:00:00', 10.00),
(5, 5, '2026-04-01 00:00:00', '2026-10-01 00:00:00', 30.00),
(6, 6, '2026-05-01 00:00:00', '2026-11-01 00:00:00', 40.00),
(7, 7, '2026-01-01 00:00:00', '2026-06-01 00:00:00', 12.50),
(8, 8, '2026-02-14 00:00:00', '2026-12-24 00:00:00', 50.00),
(9, 9, '2026-06-01 00:00:00', '2026-12-31 00:00:00', 33.33),
(10, 10, '2026-03-20 00:00:00', '2026-09-20 00:00:00', 18.00),
(11, 11, '2026-04-04 00:00:00', '2026-10-04 00:00:00', 22.00),
(12, 12, '2026-01-01 00:00:00', '2027-01-01 00:00:00', 5.00),
(13, 13, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 20.00),
(14, 15, '2026-02-01 00:00:00', '2026-08-31 00:00:00', 25.00),
(15, 17, '2026-03-01 00:00:00', '2026-09-30 00:00:00', 15.00),
(16, 19, '2026-01-15 00:00:00', '2026-12-15 00:00:00', 35.00),
(17, 21, '2026-04-01 00:00:00', '2026-10-01 00:00:00', 30.00),
(18, 23, '2026-01-01 00:00:00', '2027-01-01 00:00:00', 50.00),
(19, 25, '2026-05-01 00:00:00', '2026-11-01 00:00:00', 18.00),
(20, 26, '2026-02-14 00:00:00', '2026-12-24 00:00:00', 12.00),
(21, 27, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 14.00),
(22, 28, '2026-02-01 00:00:00', '2026-08-01 00:00:00', 20.00),
(23, 29, '2026-03-01 00:00:00', '2026-09-01 00:00:00', 18.00),
(24, 30, '2026-01-15 00:00:00', '2026-07-15 00:00:00', 11.00),
(25, 31, '2026-04-01 00:00:00', '2026-10-01 00:00:00', 22.00),
(26, 32, '2026-05-01 00:00:00', '2026-11-01 00:00:00', 16.00),
(27, 33, '2026-01-01 00:00:00', '2026-06-01 00:00:00', 9.00),
(28, 34, '2026-06-01 00:00:00', '2026-12-31 00:00:00', 25.00),
(29, 35, '2026-03-20 00:00:00', '2026-09-20 00:00:00', 30.00),
(30, 36, '2026-02-14 00:00:00', '2027-01-01 00:00:00', 17.50);

INSERT INTO purchases (purchase_id, user_id, game_id, purchase_date, price_paid) VALUES
(1, 4, 1, '2025-08-01 10:00:00', 59.99),
(2, 4, 2, '2025-08-02 11:00:00', 39.99),
(3, 5, 1, '2025-08-03 12:00:00', 59.99),
(4, 5, 3, '2025-08-04 13:00:00', 49.99),
(5, 6, 4, '2025-08-05 14:00:00', 29.99),
(6, 6, 5, '2025-08-06 15:00:00', 44.99),
(7, 7, 6, '2025-08-07 16:00:00', 24.99),
(8, 7, 7, '2025-08-08 17:00:00', 54.99),
(9, 8, 8, '2025-08-09 18:00:00', 19.99),
(10, 8, 9, '2025-08-10 19:00:00', 14.99),
(11, 9, 10, '2025-08-11 20:00:00', 34.99),
(12, 10, 11, '2025-08-12 21:00:00', 69.99);

INSERT INTO payments (payment_id, purchase_id, payment_method, payment_status, transaction_id) VALUES
(1, 1, 'CreditCard', 'Completed', 'TXN-SEED-0001'),
(2, 2, 'PayPal', 'Completed', 'TXN-SEED-0002'),
(3, 3, 'Wallet', 'Completed', 'TXN-SEED-0003'),
(4, 4, 'CreditCard', 'Completed', 'TXN-SEED-0004'),
(5, 5, 'PayPal', 'Completed', 'TXN-SEED-0005'),
(6, 6, 'CreditCard', 'Completed', 'TXN-SEED-0006'),
(7, 7, 'Wallet', 'Completed', 'TXN-SEED-0007'),
(8, 8, 'PayPal', 'Completed', 'TXN-SEED-0008'),
(9, 9, 'CreditCard', 'Completed', 'TXN-SEED-0009'),
(10, 10, 'Wallet', 'Completed', 'TXN-SEED-0010'),
(11, 11, 'CreditCard', 'Completed', 'TXN-SEED-0011'),
(12, 12, 'PayPal', 'Completed', 'TXN-SEED-0012');

INSERT INTO user_library (library_id, user_id, game_id, added_date, playtime_hours, last_played, download_completed_at, status) VALUES
(1, 4, 1, '2025-08-01 10:05:00', 42.5, '2026-03-20 20:00:00', '2025-08-01 10:10:00', 'Purchased'),
(2, 4, 2, '2025-08-02 11:05:00', 12.0, '2026-03-18 19:00:00', NULL, 'Purchased'),
(3, 5, 1, '2025-08-03 12:05:00', 5.0, '2026-02-10 10:00:00', '2025-08-03 12:06:00', 'Purchased'),
(4, 5, 3, '2025-08-04 13:05:00', 88.2, '2026-03-21 21:00:00', '2025-08-04 13:06:00', 'Purchased'),
(5, 6, 4, '2025-08-05 14:05:00', 3.5, '2026-01-05 12:00:00', NULL, 'Purchased'),
(6, 6, 5, '2025-08-06 15:05:00', 120.0, '2026-03-22 08:00:00', '2025-08-06 15:07:00', 'Purchased'),
(7, 7, 6, '2025-08-07 16:05:00', 200.0, '2026-03-22 09:00:00', '2025-08-07 16:06:00', 'Purchased'),
(8, 7, 7, '2025-08-08 17:05:00', 15.0, '2026-03-15 14:00:00', NULL, 'Purchased'),
(9, 8, 8, '2025-08-09 18:05:00', 6.0, '2026-02-28 22:00:00', '2025-08-09 18:07:00', 'Purchased'),
(10, 8, 9, '2025-08-10 19:05:00', 45.0, '2026-03-10 16:00:00', '2025-08-10 19:08:00', 'Purchased'),
(11, 9, 10, '2025-08-11 20:05:00', 9.9, '2026-03-01 11:00:00', NULL, 'Purchased'),
(12, 10, 11, '2025-08-12 21:05:00', 30.0, '2026-03-22 12:00:00', '2025-08-12 21:08:00', 'Purchased');

INSERT INTO reviews (review_id, user_id, game_id, rating, review_text, review_date) VALUES
(1, 4, 1, 9, 'Stunning world-building and tight driving feel.', '2025-09-01 10:00:00'),
(2, 4, 2, 8, 'Puzzles are clever; story pacing drags slightly in act 2.', '2025-09-02 11:00:00'),
(3, 5, 1, 7, 'Great visuals, grindy late game.', '2025-09-03 12:00:00'),
(4, 5, 3, 10, 'Best tactics game this year.', '2025-09-04 13:00:00'),
(5, 6, 4, 6, 'Brutal but rewarding survival loop.', '2025-09-05 14:00:00'),
(6, 6, 5, 8, 'Naval space battles feel epic.', '2025-09-06 15:00:00'),
(7, 7, 6, 9, 'Roguelike perfection for deck fans.', '2025-09-07 16:00:00'),
(8, 7, 7, 8, 'Stylish combat, short campaign.', '2025-09-08 17:00:00'),
(9, 8, 8, 7, 'Unsettling atmosphere; not for everyone.', '2025-09-09 18:00:00'),
(10, 8, 9, 9, 'Elegant puzzles, great soundtrack.', '2025-09-10 19:00:00'),
(11, 9, 10, 8, 'Arcade handling is spot-on.', '2025-09-11 20:00:00'),
(12, 10, 11, 9, 'Co-op RPG done right.', '2025-09-12 21:00:00');

SET FOREIGN_KEY_CHECKS = 1;


ALTER TABLE users AUTO_INCREMENT = 13;
ALTER TABLE developers AUTO_INCREMENT = 11;
ALTER TABLE publishers AUTO_INCREMENT = 11;
ALTER TABLE games AUTO_INCREMENT = 37;
ALTER TABLE offers AUTO_INCREMENT = 31;
ALTER TABLE purchases AUTO_INCREMENT = 13;
ALTER TABLE payments AUTO_INCREMENT = 13;
ALTER TABLE user_library AUTO_INCREMENT = 13;
ALTER TABLE reviews AUTO_INCREMENT = 13;
