const MAX = 80;
const entries = [];

function guessTables(sql) {
  const t = new Set();
  const upper = sql.replace(/\s+/g, " ").trim().toUpperCase();
  const add = (m) => {
    if (m?.[1]) t.add(m[1].toLowerCase());
  };
  add(upper.match(/INSERT\s+INTO\s+`?([a-z_]+)`?/i));
  add(upper.match(/UPDATE\s+`?([a-z_]+)`?/i));
  add(upper.match(/DELETE\s+FROM\s+`?([a-z_]+)`?/i));
  const from = [...sql.matchAll(/\bFROM\s+`?([a-z_]+)`?/gi)];
  const join = [...sql.matchAll(/\bJOIN\s+`?([a-z_]+)`?/gi)];
  for (const m of from) t.add(m[1].toLowerCase());
  for (const m of join) t.add(m[1].toLowerCase());
  return [...t];
}

function opType(sql) {
  const u = sql.trim().toUpperCase();
  if (u.startsWith("BEGIN") || u.startsWith("COMMIT") || u.startsWith("ROLLBACK"))
    return "transaction";
  if (u.startsWith("INSERT") || u.startsWith("UPDATE") || u.startsWith("DELETE"))
    return "write";
  return "read";
}

export function logActivity(sql, params, meta) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
    tables: guessTables(sql),
    operation: opType(sql),
    affectedRows: meta?.affectedRows,
    insertId: meta?.insertId,
    summary: meta?.summary,
  };
  entries.push(entry);
  if (entries.length > MAX) entries.shift();
  return entry;
}

export function getActivity() {
  return [...entries].reverse();
}

export function clearActivity() {
  entries.length = 0;
}
