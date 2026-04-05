import { Router } from "express";
import { pool } from "../db/pool.js";
import { query, executeWrite } from "../db/run.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const sql = `
      SELECT o.*, g.title, g.price AS list_price, g.cover_url, g.category,
        ROUND(g.price * (1 - o.percentage_off / 100), 2) AS sale_price
      FROM offers o
      JOIN games g ON g.game_id = o.game_id
      WHERE g.is_active = 1 AND NOW() BETWEEN o.starting_date AND o.ending_date
      ORDER BY o.percentage_off DESC`;
    const rows = await query(pool, sql);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

async function assertGameOfferAccess(req, gameId) {
  const id = Number(gameId);
  const [g] = await query(pool, "SELECT publisher_id FROM games WHERE game_id = ?", [id]);
  if (!g) return { ok: false, status: 404, error: "Game not found" };
  if (req.user.role === "Admin") return { ok: true, game: g };
  if (
    req.user.role === "Publisher" &&
    g.publisher_id != null &&
    Number(g.publisher_id) === Number(req.user.publisherId)
  ) {
    return { ok: true, game: g };
  }
  return { ok: false, status: 403, error: "You cannot manage offers for this game" };
}

async function assertOfferRowAccess(req, offerId) {
  const id = Number(offerId);
  const rows = await query(pool, "SELECT offer_id, game_id FROM offers WHERE offer_id = ?", [id]);
  const o = rows[0];
  if (!o) return { ok: false, status: 404, error: "Offer not found" };
  return assertGameOfferAccess(req, o.game_id);
}

router.get(
  "/manage",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  async (req, res, next) => {
    try {
      let sql = `
        SELECT o.*, g.title, g.price AS list_price, g.is_active
        FROM offers o
        JOIN games g ON g.game_id = o.game_id`;
      const params = [];
      if (req.user.role === "Publisher") {
        sql += " WHERE g.publisher_id = ?";
        params.push(req.user.publisherId);
      }
      sql += " ORDER BY g.title, o.offer_id";
      const rows = await query(pool, sql, params);
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  async (req, res, next) => {
    try {
      const { gameId, starting_date, ending_date, percentage_off } = req.body;
      const gid = Number(gameId);
      if (!gid || !starting_date || !ending_date || percentage_off == null) {
        res.status(400).json({ error: "gameId, starting_date, ending_date, percentage_off required" });
        return;
      }
      const pct = Number(percentage_off);
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        res.status(400).json({ error: "percentage_off must be between 1 and 100" });
        return;
      }
      const gate = await assertGameOfferAccess(req, gid);
      if (!gate.ok) {
        res.status(gate.status).json({ error: gate.error });
        return;
      }
      await executeWrite(
        pool,
        `INSERT INTO offers (game_id, starting_date, ending_date, percentage_off)
         VALUES (?, ?, ?, ?)`,
        [gid, starting_date, ending_date, pct]
      );
      const rows = await query(pool, "SELECT * FROM offers ORDER BY offer_id DESC LIMIT 1");
      res.status(201).json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:offerId",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  async (req, res, next) => {
    try {
      const offerId = Number(req.params.offerId);
      const gate = await assertOfferRowAccess(req, offerId);
      if (!gate.ok) {
        res.status(gate.status).json({ error: gate.error });
        return;
      }
      const b = req.body;
      const fields = [];
      const vals = [];
      if (b.starting_date !== undefined) {
        fields.push("starting_date = ?");
        vals.push(b.starting_date);
      }
      if (b.ending_date !== undefined) {
        fields.push("ending_date = ?");
        vals.push(b.ending_date);
      }
      if (b.percentage_off !== undefined) {
        const pct = Number(b.percentage_off);
        if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
          res.status(400).json({ error: "percentage_off must be between 1 and 100" });
          return;
        }
        fields.push("percentage_off = ?");
        vals.push(pct);
      }
      if (!fields.length) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }
      vals.push(offerId);
      await executeWrite(pool, `UPDATE offers SET ${fields.join(", ")} WHERE offer_id = ?`, vals);
      const rows = await query(pool, "SELECT * FROM offers WHERE offer_id = ?", [offerId]);
      res.json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:offerId",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  async (req, res, next) => {
    try {
      const offerId = Number(req.params.offerId);
      const gate = await assertOfferRowAccess(req, offerId);
      if (!gate.ok) {
        res.status(gate.status).json({ error: gate.error });
        return;
      }
      await executeWrite(pool, "DELETE FROM offers WHERE offer_id = ?", [offerId]);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
