-- Adds games 27–36 and offers 21–30 (INSERT IGNORE) for databases already seeded with games 1–26.
USE gdps;
SET NAMES utf8mb4;

INSERT IGNORE INTO games (game_id, title, description, price, release_date, category, is_active, developer_id, publisher_id, cover_url) VALUES
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

INSERT IGNORE INTO offers (offer_id, game_id, starting_date, ending_date, percentage_off) VALUES
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
