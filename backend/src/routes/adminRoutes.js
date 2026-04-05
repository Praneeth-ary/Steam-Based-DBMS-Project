import { Router } from "express";
import { pool } from "../db/pool.js";
import { query, executeWrite } from "../db/run.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth, requireRoles("Admin"));

router.get("/stats", async (_req, res, next) => {
  try {
    const rev = await query(
      pool,
      `SELECT COALESCE(SUM(price_paid), 0) AS total_revenue FROM purchases`
    );
    const users = await query(
      pool,
      `SELECT
        COUNT(*) AS total_users,
        SUM(role = 'Consumer') AS consumers,
        SUM(role = 'Developer') AS developers,
        SUM(role = 'Publisher') AS publishers,
        SUM(role = 'Admin') AS admins
       FROM users`
    );
    const top = await query(
      pool,
      `SELECT g.game_id, g.title, COUNT(p.purchase_id) AS sales, SUM(p.price_paid) AS revenue
       FROM games g
       LEFT JOIN purchases p ON p.game_id = g.game_id
       GROUP BY g.game_id, g.title
       ORDER BY sales DESC
       LIMIT 10`
    );
    res.json({
      totalRevenue: Number(rev[0]?.total_revenue ?? 0),
      users: users[0],
      topGames: top,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/developers", async (_req, res, next) => {
  try {
    const rows = await query(
      pool,
      "SELECT developer_id, developer_name FROM developers ORDER BY developer_name"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/publishers", async (_req, res, next) => {
  try {
    const rows = await query(
      pool,
      "SELECT publisher_id, publisher_name FROM publishers ORDER BY publisher_name"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/users", async (_req, res, next) => {
  try {
    const rows = await query(
      pool,
      `SELECT user_id, username, email, country, role, join_date, developer_id, publisher_id FROM users ORDER BY user_id`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!role || !["Admin", "Developer", "Publisher", "Consumer"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    await executeWrite(pool, "UPDATE users SET role = ? WHERE user_id = ?", [
      role,
      id,
    ]);
    const rows = await query(
      pool,
      "SELECT user_id, username, email, role, developer_id, publisher_id FROM users WHERE user_id = ?",
      [id]
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.delete("/reviews/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await executeWrite(pool, "DELETE FROM reviews WHERE review_id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/games", async (_req, res, next) => {
  try {
    const rows = await query(
      pool,
      `SELECT
        g.*,
        d.developer_name,
        p.publisher_name,
        COUNT(DISTINCT pur.purchase_id) AS units_sold,
        COALESCE(SUM(pur.price_paid), 0) AS revenue_usd,
        COUNT(DISTINCT r.review_id) AS review_count,
        ROUND(AVG(r.rating), 2) AS avg_rating,
        COALESCE(SUM(ul.playtime_hours), 0) AS total_playtime_hours,
        COUNT(DISTINCT ul.library_id) AS library_copies
       FROM games g
       JOIN developers d ON d.developer_id = g.developer_id
       LEFT JOIN publishers p ON p.publisher_id = g.publisher_id
       LEFT JOIN purchases pur ON pur.game_id = g.game_id
       LEFT JOIN reviews r ON r.game_id = g.game_id
       LEFT JOIN user_library ul ON ul.game_id = g.game_id
       GROUP BY g.game_id, g.title, g.description, g.price, g.release_date, g.category,
         g.is_active, g.developer_id, g.publisher_id, g.cover_url,
         d.developer_name, p.publisher_name
       ORDER BY g.game_id`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
