import { Router } from "express";
import { pool } from "../db/pool.js";
import { query } from "../db/run.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth, requireRoles("Developer", "Publisher", "Admin"));

function statsQuery(whereClause, params = []) {
  return query(
    pool,
    `SELECT
      g.game_id,
      g.title,
      g.price,
      g.is_active,
      g.release_date,
      g.category,
      COUNT(DISTINCT pur.purchase_id) AS purchases,
      COALESCE(SUM(pur.price_paid), 0) AS revenue_usd,
      COUNT(DISTINCT r.review_id) AS review_count,
      ROUND(AVG(r.rating), 2) AS avg_rating,
      COALESCE(SUM(ul.playtime_hours), 0) AS total_playtime_hours,
      COUNT(DISTINCT ul.user_id) AS unique_owners
    FROM games g
    LEFT JOIN purchases pur ON pur.game_id = g.game_id
    LEFT JOIN reviews r ON r.game_id = g.game_id
    LEFT JOIN user_library ul ON ul.game_id = g.game_id
    ${whereClause}
    GROUP BY g.game_id, g.title, g.price, g.is_active, g.release_date, g.category
    ORDER BY revenue_usd DESC`,
    params
  );
}

router.get("/stats", async (req, res, next) => {
  try {
    if (req.user.role === "Admin") {
      const rows = await statsQuery("");
      res.json({ games: rows });
      return;
    }
    if (req.user.role === "Developer") {
      const did = req.user.developerId;
      if (!did) {
        res.status(400).json({ error: "No developer profile linked" });
        return;
      }
      const rows = await statsQuery("WHERE g.developer_id = ?", [did]);
      res.json({ games: rows });
      return;
    }
    if (req.user.role === "Publisher") {
      const pid = req.user.publisherId;
      if (!pid) {
        res.status(400).json({ error: "No publisher profile linked" });
        return;
      }
      const rows = await statsQuery("WHERE g.publisher_id = ?", [pid]);
      res.json({ games: rows });
      return;
    }
    res.status(403).json({ error: "Forbidden" });
  } catch (e) {
    next(e);
  }
});

export default router;
