import { logActivity } from "./activityLog.js";

export async function query(pool, sql, params = []) {
  logActivity(sql, params);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function executeWrite(pool, sql, params = []) {
  const [res] = await pool.execute(sql, params);
  logActivity(sql, params, {
    affectedRows: res.affectedRows,
    insertId: res.insertId,
    summary: `affectedRows=${res.affectedRows}`,
  });
  return res;
}

export async function connQuery(conn, sql, params = []) {
  logActivity(sql, params);
  const [rows] = await conn.execute(sql, params);
  return rows;
}

export async function connExecute(conn, sql, params = []) {
  const [res] = await conn.execute(sql, params);
  logActivity(sql, params, {
    affectedRows: res.affectedRows,
    insertId: res.insertId,
    summary: `affectedRows=${res.affectedRows}`,
  });
  return res;
}
