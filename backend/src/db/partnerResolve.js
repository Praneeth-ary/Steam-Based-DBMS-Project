import { query, executeWrite } from "./run.js";

export async function getDeveloperById(pool, id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;
  const rows = await query(
    pool,
    "SELECT developer_id FROM developers WHERE developer_id = ? LIMIT 1",
    [n]
  );
  return rows[0]?.developer_id ?? null;
}

export async function getPublisherById(pool, id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) return null;
  const rows = await query(
    pool,
    "SELECT publisher_id FROM publishers WHERE publisher_id = ? LIMIT 1",
    [n]
  );
  return rows[0]?.publisher_id ?? null;
}

export async function resolveDeveloperId(pool, name, country) {
  const t = (name || "").trim();
  if (!t) return null;
  const existing = await query(
    pool,
    "SELECT developer_id FROM developers WHERE developer_name = ? LIMIT 1",
    [t]
  );
  if (existing[0]) return existing[0].developer_id;
  const c = (country || "India").trim() || "India";
  await executeWrite(
    pool,
    "INSERT INTO developers (developer_name, country) VALUES (?, ?)",
    [t, c]
  );
  const row = await query(
    pool,
    "SELECT developer_id FROM developers WHERE developer_name = ? ORDER BY developer_id DESC LIMIT 1",
    [t]
  );
  return row[0]?.developer_id ?? null;
}

export async function resolvePublisherId(pool, name, country) {
  const t = (name || "").trim();
  if (!t) return null;
  const existing = await query(
    pool,
    "SELECT publisher_id FROM publishers WHERE publisher_name = ? LIMIT 1",
    [t]
  );
  if (existing[0]) return existing[0].publisher_id;
  const c = (country || "India").trim() || "India";
  await executeWrite(
    pool,
    "INSERT INTO publishers (publisher_name, country) VALUES (?, ?)",
    [t, c]
  );
  const row = await query(
    pool,
    "SELECT publisher_id FROM publishers WHERE publisher_name = ? ORDER BY publisher_id DESC LIMIT 1",
    [t]
  );
  return row[0]?.publisher_id ?? null;
}

export async function getUserCountry(pool, userId) {
  const rows = await query(pool, "SELECT country FROM users WHERE user_id = ?", [userId]);
  return rows[0]?.country || "India";
}
