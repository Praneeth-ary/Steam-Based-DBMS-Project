/**
 * Store catalog: offers, effective pricing, ownership status, recommendation queries.
 *
 * ownershipStatus (API):
 * - not_purchased — no library row
 * - installed — owned, download not simulated yet → show "Download"
 * - playable — download_completed_at set → show "Play"
 */

const OFFER_JOIN = `
  LEFT JOIN offers o ON o.game_id = g.game_id
    AND o.offer_id = (
      SELECT o2.offer_id FROM offers o2
      WHERE o2.game_id = g.game_id
        AND NOW() BETWEEN o2.starting_date AND o2.ending_date
      ORDER BY o2.percentage_off DESC, o2.offer_id ASC
      LIMIT 1
    )`;

function ownershipCase() {
  return `
    CASE
      WHEN ul.library_id IS NULL THEN 'not_purchased'
      WHEN ul.download_completed_at IS NULL THEN 'installed'
      ELSE 'playable'
    END AS ownership_status`;
}

export function listGamesSql(uidPlaceholder) {
  return `
    SELECT
      g.*,
      d.developer_name,
      o.percentage_off AS active_offer_pct,
      o.ending_date AS offer_ends_at,
      GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), o.ending_date)) AS offer_seconds_remaining,
      ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) AS effective_price,
      ${ownershipCase()}
    FROM games g
    JOIN developers d ON d.developer_id = g.developer_id
    ${OFFER_JOIN}
    LEFT JOIN user_library ul ON ul.game_id = g.game_id AND ul.user_id = ${uidPlaceholder}
    WHERE g.is_active = 1
      AND (? = '' OR g.title LIKE CONCAT('%', ?, '%'))
      AND (? = '' OR g.category = ?)
      AND (? IS NULL OR ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) >= ?)
      AND (? IS NULL OR ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) <= ?)
    ORDER BY effective_price ASC, g.price ASC, g.title ASC`;
}

export function gameByIdSql(uidPlaceholder) {
  return `
    SELECT
      g.*,
      d.developer_name,
      p.publisher_name,
      o.percentage_off AS active_offer_pct,
      o.ending_date AS offer_ends_at,
      GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), o.ending_date)) AS offer_seconds_remaining,
      ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) AS effective_price,
      (
        SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.game_id = g.game_id
      ) AS avg_rating,
      (
        SELECT COUNT(*) FROM reviews r2 WHERE r2.game_id = g.game_id
      ) AS review_count,
      ${ownershipCase()}
    FROM games g
    JOIN developers d ON d.developer_id = g.developer_id
    LEFT JOIN publishers p ON p.publisher_id = g.publisher_id
    ${OFFER_JOIN}
    LEFT JOIN user_library ul ON ul.game_id = g.game_id AND ul.user_id = ${uidPlaceholder}
    WHERE g.game_id = ?
    LIMIT 1`;
}

/** Recommended: active games not in the user's library (consumer-focused). */
export function recommendedGamesSql() {
  return `
    SELECT
      g.*,
      d.developer_name,
      o.percentage_off AS active_offer_pct,
      o.ending_date AS offer_ends_at,
      GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), o.ending_date)) AS offer_seconds_remaining,
      ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) AS effective_price,
      'not_purchased' AS ownership_status
    FROM games g
    JOIN developers d ON d.developer_id = g.developer_id
    ${OFFER_JOIN}
    WHERE g.is_active = 1
      AND g.game_id NOT IN (
        SELECT ul.game_id FROM user_library ul WHERE ul.user_id = ?
      )
    ORDER BY effective_price ASC, g.price ASC, g.title ASC
    LIMIT 48`;
}
