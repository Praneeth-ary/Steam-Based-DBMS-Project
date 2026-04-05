import { Router } from "express";
import { pool } from "../db/pool.js";
import { query, executeWrite } from "../db/run.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const sql = `
      SELECT r.*, g.title AS game_title, g.game_id
      FROM reviews r
      JOIN games g ON g.game_id = r.game_id
      WHERE r.user_id = ?
      ORDER BY r.review_date DESC`;
    const rows = await query(pool, sql, [req.user.userId]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/game/:gameId", async (req, res, next) => {
  try {
    const gameId = Number(req.params.gameId);
    const sql = `
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON u.user_id = r.user_id
      WHERE r.game_id = ?
      ORDER BY r.review_date DESC`;
    const rows = await query(pool, sql, [gameId]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireAuth,
  requireRoles("Consumer"),
  async (req, res, next) => {
    try {
      const { gameId, rating, reviewText } = req.body;
      if (!gameId || rating == null || !reviewText) {
        res.status(400).json({ error: "gameId, rating, reviewText required" });
        return;
      }
      if (rating < 1 || rating > 10) {
        res.status(400).json({ error: "Rating must be 1-10" });
        return;
      }
      const [owns] = await query(
        pool,
        "SELECT library_id FROM user_library WHERE user_id = ? AND game_id = ?",
        [req.user.userId, gameId]
      );
      if (!owns) {
        res.status(403).json({
          error: "Only owners (user_library) may review this game",
        });
        return;
      }
      await executeWrite(
        pool,
        `INSERT INTO reviews (user_id, game_id, rating, review_text)
         VALUES (?, ?, ?, ?)`,
        [req.user.userId, gameId, rating, reviewText]
      );
      const rows = await query(
        pool,
        `SELECT r.*, u.username FROM reviews r
         JOIN users u ON u.user_id = r.user_id
         WHERE r.user_id = ? AND r.game_id = ?`,
        [req.user.userId, gameId]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        res.status(409).json({ error: "You already reviewed this game" });
      else next(e);
    }
  }
);

router.delete("/entry/:reviewId", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.reviewId);
    const rows = await query(
      pool,
      "SELECT review_id, user_id FROM reviews WHERE review_id = ?",
      [id]
    );
    const rev = rows[0];
    if (!rev) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    const isOwner = rev.user_id === req.user.userId;
    const isAdmin = req.user.role === "Admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "You can only delete your own reviews" });
      return;
    }
    await executeWrite(pool, "DELETE FROM reviews WHERE review_id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
