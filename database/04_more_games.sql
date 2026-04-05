-- Optional: add catalog titles if you already ran an older 02_seed.sql (only had 12 games).
-- Safe to run multiple times (INSERT IGNORE skips duplicates).

USE gdps;
SET NAMES utf8mb4;

INSERT IGNORE INTO games (game_id, title, description, price, release_date, category, is_active, developer_id, publisher_id, cover_url) VALUES
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
(26, 'Serpent''s Oath', 'Party-based RPG with moral choices that reshape the world.', 54.99, '2025-04-18', 'RPG', 1, 6, 7, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400');

INSERT IGNORE INTO offers (offer_id, game_id, starting_date, ending_date, percentage_off) VALUES
(13, 13, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 20.00),
(14, 15, '2026-02-01 00:00:00', '2026-08-31 00:00:00', 25.00),
(15, 17, '2026-03-01 00:00:00', '2026-09-30 00:00:00', 15.00),
(16, 19, '2026-01-15 00:00:00', '2026-12-15 00:00:00', 35.00),
(17, 21, '2026-04-01 00:00:00', '2026-10-01 00:00:00', 30.00),
(18, 23, '2026-01-01 00:00:00', '2027-01-01 00:00:00', 50.00),
(19, 25, '2026-05-01 00:00:00', '2026-11-01 00:00:00', 18.00),
(20, 26, '2026-02-14 00:00:00', '2026-12-24 00:00:00', 12.00);
