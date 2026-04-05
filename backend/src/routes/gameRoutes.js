import { Router } from "express";
import { pool } from "../db/pool.js";
import { query, executeWrite } from "../db/run.js";
import { deleteGameCascade } from "../db/deleteGame.js";
import { logActivity } from "../db/activityLog.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";
import {
  getDeveloperById,
  getPublisherById,
  resolveDeveloperId,
  resolvePublisherId,
  getUserCountry,
} from "../db/partnerResolve.js";
import { uploadGameCover } from "../middleware/uploadGameCover.js";
import { listGamesSql, gameByIdSql, recommendedGamesSql } from "../services/gameCatalogService.js";

const router = Router();

function catalogUpload(req, res, next) {
  uploadGameCover.single("cover")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    next();
  });
}

async function resolveCreatePartners(pool, user, body) {
  if (user.role === "Admin") {
    const devId = await getDeveloperById(pool, body.partner_developer_id);
    if (!devId) return { error: "Select a developer from the list" };
    const rawPub = body.partner_publisher_id;
    let pubId = null;
    if (rawPub !== undefined && rawPub !== null && String(rawPub).trim() !== "") {
      const pid = await getPublisherById(pool, rawPub);
      if (!pid) return { error: "Select a publisher from the list" };
      pubId = pid;
    }
    return { devId, pubId };
  }
  if (user.role === "Publisher") {
    if (!user.publisherId) return { error: "No publisher profile linked to this account" };
    const devId = await getDeveloperById(pool, body.partner_developer_id);
    if (!devId) return { error: "Select a developer from the list" };
    return { devId, pubId: user.publisherId };
  }
  return { error: "Forbidden" };
}

function coverFromRequest(req, body) {
  if (req.file) return `/uploads/covers/${req.file.filename}`;
  const u = String(body.cover_url || "").trim();
  return u || null;
}

router.get(
  "/meta/developers",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  async (_req, res, next) => {
    try {
      const rows = await query(
        pool,
        "SELECT developer_id, developer_name, country FROM developers ORDER BY developer_name"
      );
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/meta/publishers",
  requireAuth,
  requireRoles("Admin"),
  async (_req, res, next) => {
    try {
      const rows = await query(
        pool,
        "SELECT publisher_id, publisher_name, country FROM publishers ORDER BY publisher_name"
      );
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const category = req.query.category || "";
    const minP = req.query.minPrice;
    const maxP = req.query.maxPrice;
    const uid = req.user?.userId ?? 0;
    const minV = minP !== undefined && minP !== "" ? Number(minP) : null;
    const maxV = maxP !== undefined && maxP !== "" ? Number(maxP) : null;
    const sql = listGamesSql("?");
    const rows = await query(pool, sql, [
      uid,
      q,
      q,
      category,
      category,
      minV,
      minV,
      maxV,
      maxV,
    ]);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/recommended", optionalAuth, async (req, res, next) => {
  try {
    const uid =
      req.user?.role === "Consumer" && req.user.userId != null ? req.user.userId : 0;
    const sql = recommendedGamesSql();
    const rows = await query(pool, sql, [uid]);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    const uid = req.user?.userId ?? 0;
    const sql = gameByIdSql("?");
    const rows = await query(pool, sql, [uid, id]);
    if (!rows.length) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireAuth,
  requireRoles("Admin", "Publisher"),
  catalogUpload,
  async (req, res, next) => {
    try {
      const b = req.body;
      const resolved = await resolveCreatePartners(pool, req.user, b);
      if (resolved.error) {
        res.status(400).json({ error: resolved.error });
        return;
      }
      const { devId, pubId } = resolved;
      const coverUrl = coverFromRequest(req, b);
      const insertSql = `INSERT INTO games (title, description, price, release_date, category, is_active, developer_id, publisher_id, cover_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertParams = [
        String(b.title ?? ""),
        String(b.description ?? ""),
        Number(b.price),
        String(b.release_date ?? ""),
        String(b.category ?? ""),
        b.is_active !== undefined ? (b.is_active === "false" || b.is_active === false ? 0 : 1) : 1,
        devId,
        pubId,
        coverUrl,
      ];
      await executeWrite(pool, insertSql, insertParams);
      const rows = await query(pool, "SELECT * FROM games ORDER BY game_id DESC LIMIT 1");
      res.status(201).json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  requireRoles("Admin", "Developer", "Publisher"),
  catalogUpload,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const [g] = await query(
        pool,
        "SELECT developer_id, publisher_id FROM games WHERE game_id = ?",
        [id]
      );
      if (!g) {
        res.status(404).json({ error: "Game not found" });
        return;
      }
      if (req.user.role === "Developer" && g.developer_id !== req.user.developerId) {
        res.status(403).json({ error: "Cannot modify another developer's game" });
        return;
      }
      if (
        req.user.role === "Publisher" &&
        (g.publisher_id == null || g.publisher_id !== req.user.publisherId)
      ) {
        res.status(403).json({ error: "Cannot modify games not linked to your publisher account" });
        return;
      }

      const b = req.body;
      const country = await getUserCountry(pool, req.user.userId);
      const fields = [];
      const vals = [];

      if (req.user.role === "Developer") {
        if (b.price !== undefined && b.price !== "") {
          res.status(403).json({ error: "Developers cannot change game price" });
          return;
        }
        if (
          b.partner_publisher_name !== undefined ||
          b.partner_publisher_id !== undefined ||
          b.publisher_id !== undefined
        ) {
          res.status(403).json({ error: "Developers cannot change publisher assignment" });
          return;
        }
      }

      if (req.user.role === "Admin") {
        if (b.partner_developer_id !== undefined && String(b.partner_developer_id).trim() !== "") {
          const did = await getDeveloperById(pool, b.partner_developer_id);
          if (!did) {
            res.status(400).json({ error: "Invalid developer" });
            return;
          }
          fields.push("developer_id = ?");
          vals.push(did);
        } else {
          const pd = b.partner_developer_name;
          if (pd !== undefined && String(pd).trim() !== "") {
            const did = await resolveDeveloperId(pool, pd, country);
            if (!did) {
              res.status(400).json({ error: "Invalid partner developer name" });
              return;
            }
            fields.push("developer_id = ?");
            vals.push(did);
          }
        }
        if (b.partner_publisher_id !== undefined) {
          const t = String(b.partner_publisher_id || "").trim();
          if (t) {
            const pid = await getPublisherById(pool, t);
            if (!pid) {
              res.status(400).json({ error: "Invalid publisher" });
              return;
            }
            fields.push("publisher_id = ?");
            vals.push(pid);
          } else {
            fields.push("publisher_id = ?");
            vals.push(null);
          }
        } else if (b.partner_publisher_name !== undefined) {
          const t = String(b.partner_publisher_name || "").trim();
          if (t) {
            const pid = await resolvePublisherId(pool, t, country);
            fields.push("publisher_id = ?");
            vals.push(pid);
          } else {
            fields.push("publisher_id = ?");
            vals.push(null);
          }
        }
      } else if (req.user.role === "Publisher") {
        if (b.partner_developer_id !== undefined && String(b.partner_developer_id).trim() !== "") {
          const did = await getDeveloperById(pool, b.partner_developer_id);
          if (!did) {
            res.status(400).json({ error: "Invalid developer" });
            return;
          }
          fields.push("developer_id = ?");
          vals.push(did);
        } else if (b.partner_developer_name !== undefined) {
          const t = String(b.partner_developer_name || "").trim();
          if (t) {
            const did = await resolveDeveloperId(pool, t, country);
            if (!did) {
              res.status(400).json({ error: "Invalid partner developer name" });
              return;
            }
            fields.push("developer_id = ?");
            vals.push(did);
          }
        }
      }

      const map = [
        ["title", b.title],
        ["description", b.description],
        [
          "price",
          req.user.role === "Developer"
            ? undefined
            : b.price !== undefined && b.price !== ""
              ? Number(b.price)
              : undefined,
        ],
        ["release_date", b.release_date],
        ["category", b.category],
        ["is_active", b.is_active !== undefined ? (b.is_active === "false" || b.is_active === false ? 0 : 1) : undefined],
      ];
      if (req.user.role === "Admin" && b.publisher_id !== undefined && b.partner_publisher_name === undefined) {
        map.push(["publisher_id", b.publisher_id === null || b.publisher_id === "" ? null : Number(b.publisher_id)]);
      }
      for (const [k, v] of map) {
        if (v !== undefined) {
          fields.push(`${k} = ?`);
          vals.push(v);
        }
      }

      const newCover = coverFromRequest(req, b);
      if (req.file) {
        fields.push("cover_url = ?");
        vals.push(newCover);
      } else if (b.cover_url !== undefined) {
        const u = String(b.cover_url || "").trim();
        fields.push("cover_url = ?");
        vals.push(u || null);
      }

      if (!fields.length) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }
      vals.push(id);
      await executeWrite(
        pool,
        `UPDATE games SET ${fields.join(", ")} WHERE game_id = ?`,
        vals
      );
      const rows = await query(pool, "SELECT * FROM games WHERE game_id = ?", [id]);
      res.json(rows[0]);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireRoles("Admin", "Developer", "Publisher"),
  async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const rows = await query(
        pool,
        "SELECT developer_id, publisher_id FROM games WHERE game_id = ?",
        [id]
      );
      const g = rows[0];
      if (!g) {
        res.status(404).json({ error: "Game not found" });
        return;
      }
      if (req.user.role === "Developer" && g.developer_id !== req.user.developerId) {
        res.status(403).json({ error: "You can only delete your own games" });
        return;
      }
      if (
        req.user.role === "Publisher" &&
        (g.publisher_id == null || g.publisher_id !== req.user.publisherId)
      ) {
        res.status(403).json({ error: "You can only delete games linked to your publisher account" });
        return;
      }
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        logActivity("BEGIN TRANSACTION", []);
        await deleteGameCascade(conn, id);
        await conn.commit();
        logActivity("COMMIT", [], { summary: "game cascade delete" });
        res.json({ ok: true, message: "Game removed from the platform for everyone" });
      } catch (e) {
        await conn.rollback();
        logActivity("ROLLBACK", [], { summary: String(e) });
        next(e);
      } finally {
        conn.release();
      }
    } catch (e) {
      next(e);
    }
  }
);

export default router;
