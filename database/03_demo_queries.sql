-- Complex demonstration queries (joins, aggregations) — SDD Section 4 / evaluation

-- 1) Catalog with developer, optional publisher, and active offer discount (JOIN + scalar subquery)
SELECT
  g.game_id,
  g.title,
  g.category,
  g.price AS list_price,
  d.developer_name,
  p.publisher_name,
  (
    SELECT o.percentage_off
    FROM offers o
    WHERE o.game_id = g.game_id
      AND NOW() BETWEEN o.starting_date AND o.ending_date
    ORDER BY o.percentage_off DESC
    LIMIT 1
  ) AS active_discount_pct
FROM games g
JOIN developers d ON d.developer_id = g.developer_id
LEFT JOIN publishers p ON p.publisher_id = g.publisher_id
WHERE g.is_active = 1
ORDER BY g.title;

-- 2) Revenue by game (aggregation) — admin analytics
SELECT
  g.game_id,
  g.title,
  COUNT(pur.purchase_id) AS units_sold,
  COALESCE(SUM(pur.price_paid), 0) AS revenue_usd
FROM games g
LEFT JOIN purchases pur ON pur.game_id = g.game_id
GROUP BY g.game_id, g.title
ORDER BY revenue_usd DESC;

-- 3) Purchase → Payment → Library chain (core transactional data model)
SELECT
  pur.purchase_id,
  pur.purchase_date,
  u.username,
  g.title,
  pur.price_paid,
  pay.payment_method,
  pay.payment_status,
  pay.transaction_id,
  ul.library_id,
  ul.playtime_hours,
  ul.status AS library_status
FROM purchases pur
JOIN users u ON u.user_id = pur.user_id
JOIN games g ON g.game_id = pur.game_id
JOIN payments pay ON pay.purchase_id = pur.purchase_id
JOIN user_library ul ON ul.user_id = pur.user_id AND ul.game_id = pur.game_id
ORDER BY pur.purchase_date DESC;

-- 4) Average rating and review count per game
SELECT
  g.game_id,
  g.title,
  COUNT(r.review_id) AS review_count,
  ROUND(AVG(r.rating), 2) AS avg_rating
FROM games g
LEFT JOIN reviews r ON r.game_id = g.game_id
GROUP BY g.game_id, g.title
ORDER BY (avg_rating IS NULL), avg_rating DESC;

-- 5) Consumers eligible to review (own game) but have not reviewed yet
SELECT u.user_id, u.username, g.game_id, g.title
FROM user_library ul
JOIN users u ON u.user_id = ul.user_id
JOIN games g ON g.game_id = ul.game_id
LEFT JOIN reviews r ON r.user_id = ul.user_id AND r.game_id = ul.game_id
WHERE r.review_id IS NULL AND u.role = 'Consumer';

-- 6) Top consumers by spend
SELECT
  u.user_id,
  u.username,
  COUNT(pur.purchase_id) AS purchases,
  SUM(pur.price_paid) AS total_spent
FROM users u
JOIN purchases pur ON pur.user_id = u.user_id
WHERE u.role = 'Consumer'
GROUP BY u.user_id, u.username
ORDER BY total_spent DESC;
