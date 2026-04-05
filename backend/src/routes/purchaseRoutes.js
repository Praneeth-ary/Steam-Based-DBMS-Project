import { Router } from "express";
import { pool } from "../db/pool.js";
import { logActivity } from "../db/activityLog.js";
import { connExecute, connQuery, query, executeWrite } from "../db/run.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRoles("Consumer"),
  async (req, res, next) => {
    const userId = req.user.userId;
    const { gameId, paymentMethod } = req.body;
    if (!gameId || !paymentMethod) {
      res.status(400).json({ error: "gameId and paymentMethod required" });
      return;
    }
    if (!["CreditCard", "PayPal", "Wallet"].includes(paymentMethod)) {
      res.status(400).json({ error: "Invalid payment method" });
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      logActivity("BEGIN TRANSACTION", []);

      const [lib] = await connQuery(
        conn,
        "SELECT library_id FROM user_library WHERE user_id = ? AND game_id = ?",
        [userId, gameId]
      );
      if (lib) {
        await conn.rollback();
        logActivity("ROLLBACK", []);
        res.status(409).json({ error: "Game already in library" });
        return;
      }

      const [game] = await connQuery(
        conn,
        "SELECT price FROM games WHERE game_id = ? AND is_active = 1",
        [gameId]
      );
      if (!game) {
        await conn.rollback();
        logActivity("ROLLBACK", []);
        res.status(404).json({ error: "Game not available" });
        return;
      }

      const [offer] = await connQuery(
        conn,
        `SELECT percentage_off FROM offers
         WHERE game_id = ? AND NOW() BETWEEN starting_date AND ending_date
         ORDER BY percentage_off DESC LIMIT 1`,
        [gameId]
      );
      let pricePaid = Number(game.price);
      if (offer) {
        pricePaid =
          Math.round(pricePaid * (1 - Number(offer.percentage_off) / 100) * 100) /
          100;
      }

      const pur = await connExecute(
        conn,
        "INSERT INTO purchases (user_id, game_id, price_paid) VALUES (?, ?, ?)",
        [userId, gameId, pricePaid]
      );
      const purchaseId = pur.insertId;

      const txn =
        "TXN-" +
        Math.random().toString(36).slice(2, 11).toUpperCase() +
        Date.now().toString(36).toUpperCase();
      await connExecute(
        conn,
        `INSERT INTO payments (purchase_id, payment_method, payment_status, transaction_id)
         VALUES (?, ?, 'Completed', ?)`,
        [purchaseId, paymentMethod, txn]
      );

      await connExecute(
        conn,
        `INSERT INTO user_library (user_id, game_id, status) VALUES (?, ?, 'Purchased')`,
        [userId, gameId]
      );

      await conn.commit();
      logActivity("COMMIT", [], { summary: "purchase transaction committed" });

      res.status(201).json({
        message: "Purchase successful",
        purchaseId,
        transactionId: txn,
        pricePaid,
        tablesTouched: ["purchases", "payments", "user_library"],
      });
    } catch (e) {
      await conn.rollback();
      logActivity("ROLLBACK", [], { summary: String(e) });
      next(e);
    } finally {
      conn.release();
    }
  }
);

const LIBRARY_LIST_SQL = `
  SELECT
    g.*,
    ul.playtime_hours,
    ul.last_played,
    ul.added_date,
    ul.library_id,
    ul.download_completed_at,
    CASE
      WHEN ul.download_completed_at IS NULL THEN 'installed'
      ELSE 'playable'
    END AS ownership_status,
    o.percentage_off AS active_offer_pct,
    o.ending_date AS offer_ends_at,
    GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), o.ending_date)) AS offer_seconds_remaining,
    ROUND(g.price * (1 - IFNULL(o.percentage_off, 0) / 100), 2) AS effective_price
  FROM user_library ul
  JOIN games g ON g.game_id = ul.game_id
  LEFT JOIN offers o ON o.game_id = g.game_id
    AND o.offer_id = (
      SELECT o2.offer_id FROM offers o2
      WHERE o2.game_id = g.game_id
        AND NOW() BETWEEN o2.starting_date AND o2.ending_date
      ORDER BY o2.percentage_off DESC, o2.offer_id ASC
      LIMIT 1
    )
  WHERE ul.user_id = ?
  ORDER BY ul.added_date DESC`;

async function sendMyGames(req, res, next) {
  try {
    const rows = await query(pool, LIBRARY_LIST_SQL, [req.user.userId]);
    res.set("Cache-Control", "no-store");
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

router.get("/library", requireAuth, sendMyGames);

router.get("/my-games", requireAuth, sendMyGames);

router.post(
  "/download",
  requireAuth,
  requireRoles("Consumer"),
  async (req, res, next) => {
    try {
      const gameId = Number(req.body.gameId);
      if (!gameId) {
        res.status(400).json({ error: "gameId required" });
        return;
      }
      const result = await executeWrite(
        pool,
        `UPDATE user_library
         SET download_completed_at = CURRENT_TIMESTAMP(3)
         WHERE user_id = ? AND game_id = ? AND download_completed_at IS NULL`,
        [req.user.userId, gameId]
      );
      if (!result.affectedRows) {
        const [row] = await query(
          pool,
          "SELECT library_id, download_completed_at FROM user_library WHERE user_id = ? AND game_id = ?",
          [req.user.userId, gameId]
        );
        if (!row) {
          res.status(404).json({ error: "Game not in your library" });
          return;
        }
        res.json({
          ok: true,
          ownershipStatus: "playable",
          message: "Already installed",
        });
        return;
      }
      res.json({ ok: true, ownershipStatus: "playable" });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/play",
  requireAuth,
  requireRoles("Consumer"),
  async (req, res, next) => {
    try {
      const gameId = Number(req.body.gameId);
      if (!gameId) {
        res.status(400).json({ error: "gameId required" });
        return;
      }
      const result = await executeWrite(
        pool,
        `UPDATE user_library
         SET last_played = CURRENT_TIMESTAMP(3)
         WHERE user_id = ? AND game_id = ? AND download_completed_at IS NOT NULL`,
        [req.user.userId, gameId]
      );
      if (!result.affectedRows) {
        res.status(400).json({ error: "Install the game before playing" });
        return;
      }
      res.json({ ok: true, ownershipStatus: "playable" });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/library/:gameId",
  requireAuth,
  requireRoles("Consumer"),
  async (req, res, next) => {
    try {
      const gameId = Number(req.params.gameId);
      const header = await executeWrite(
        pool,
        "DELETE FROM user_library WHERE user_id = ? AND game_id = ?",
        [req.user.userId, gameId]
      );
      if (!header.affectedRows) {
        res.status(404).json({ error: "Game not in your library" });
        return;
      }
      res.json({ ok: true, message: "Removed from library" });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
