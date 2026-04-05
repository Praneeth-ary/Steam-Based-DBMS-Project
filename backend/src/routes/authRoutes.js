import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { query, executeWrite } from "../db/run.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();
const SALT = 12;

function buildUserPayload(u) {
  return {
    id: u.user_id,
    username: u.username,
    email: u.email,
    country: u.country,
    role: u.role,
    developerId: u.developer_id ?? null,
    publisherId: u.publisher_id ?? null,
    developerName: u.developer_name ?? null,
    publisherName: u.publisher_name ?? null,
  };
}

async function loadUserRowByEmail(email) {
  const rows = await query(
    pool,
    `SELECT u.user_id, u.username, u.email, u.country, u.role, u.developer_id, u.publisher_id,
            d.developer_name, p.publisher_name
     FROM users u
     LEFT JOIN developers d ON d.developer_id = u.developer_id
     LEFT JOIN publishers p ON p.publisher_id = u.publisher_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0];
}

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, country, accountType, studioName } = req.body;
    if (!username || !email || !password || !country) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    const type = String(accountType || "consumer").toLowerCase();
    if (!["consumer", "developer", "publisher"].includes(type)) {
      res.status(400).json({ error: "Invalid account type" });
      return;
    }
    if ((type === "developer" || type === "publisher") && !String(studioName || "").trim()) {
      res.status(400).json({ error: "Studio / company name is required for developer and publisher accounts" });
      return;
    }

    const emailLower = String(email).trim().toLowerCase();
    if (type === "developer" && !emailLower.endsWith("@dev.com")) {
      res.status(400).json({ error: "Developer accounts must use an email ending in @dev.com" });
      return;
    }
    if (type === "publisher" && !emailLower.endsWith("@studio.com")) {
      res.status(400).json({ error: "Publisher accounts must use an email ending in @studio.com" });
      return;
    }

    const hash = await bcrypt.hash(password, SALT);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let developerId = null;
      let publisherId = null;
      let role = "Consumer";

      if (type === "developer") {
        const [dr] = await conn.execute(
          "INSERT INTO developers (developer_name, country) VALUES (?, ?)",
          [String(studioName).trim(), country]
        );
        developerId = dr.insertId;
        role = "Developer";
      } else if (type === "publisher") {
        const [pr] = await conn.execute(
          "INSERT INTO publishers (publisher_name, country) VALUES (?, ?)",
          [String(studioName).trim(), country]
        );
        publisherId = pr.insertId;
        role = "Publisher";
      }

      await conn.execute(
        `INSERT INTO users (username, email, password_hash, country, role, developer_id, publisher_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hash, country, role, developerId, publisherId]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const u = await loadUserRowByEmail(email);
    const token = signToken({
      userId: u.user_id,
      role: u.role,
      developerId: u.developer_id ?? null,
      publisherId: u.publisher_id ?? null,
    });
    res.status(201).json({
      token,
      user: buildUserPayload(u),
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      res.status(409).json({ error: "Username or email already exists" });
    else next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const rows = await query(
      pool,
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.country, u.role, u.developer_id, u.publisher_id,
              d.developer_name, p.publisher_name
       FROM users u
       LEFT JOIN developers d ON d.developer_id = u.developer_id
       LEFT JOIN publishers p ON p.publisher_id = u.publisher_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    );
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({
      userId: u.user_id,
      role: u.role,
      developerId: u.developer_id ?? null,
      publisherId: u.publisher_id ?? null,
    });
    res.json({
      token,
      user: buildUserPayload(u),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      pool,
      `SELECT u.user_id, u.username, u.email, u.country, u.role, u.join_date, u.developer_id, u.publisher_id,
              d.developer_name AS developer_name,
              p.publisher_name AS publisher_name
       FROM users u
       LEFT JOIN developers d ON d.developer_id = u.developer_id
       LEFT JOIN publishers p ON p.publisher_id = u.publisher_id
       WHERE u.user_id = ?`,
      [req.user.userId]
    );
    const u = rows[0];
    if (!u) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: u.user_id,
      username: u.username,
      email: u.email,
      country: u.country,
      role: u.role,
      developerId: u.developer_id ?? null,
      publisherId: u.publisher_id ?? null,
      developerName: u.developer_name ?? null,
      publisherName: u.publisher_name ?? null,
      joinDate: u.join_date,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
