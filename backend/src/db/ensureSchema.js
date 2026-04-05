/**
 * Aligns older local databases with the current app.
 * Safe to run on every startup; each block is idempotent.
 */
export async function ensureSchema(pool) {
  const conn = await pool.getConnection();
  try {
    const [[dbRow]] = await conn.query("SELECT DATABASE() AS name");
    const schema = dbRow?.name;
    if (!schema) {
      console.warn("[db] ensureSchema: no database selected; skipping");
      return;
    }

    const [[pub]] = await conn.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'publishers'`,
      [schema]
    );
    if (Number(pub.c) === 0) {
      await conn.query(`
        CREATE TABLE publishers (
          publisher_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          publisher_name VARCHAR(100) NOT NULL,
          country VARCHAR(50) NOT NULL,
          PRIMARY KEY (publisher_id),
          KEY idx_publishers_country (country)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      console.log("[db] Created missing table publishers");
    }

    const [[pubCol]] = await conn.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'publisher_id'`,
      [schema]
    );
    if (Number(pubCol.c) === 0) {
      await conn.query(
        `ALTER TABLE users MODIFY COLUMN role ENUM('Admin','Developer','Publisher','Consumer') NOT NULL DEFAULT 'Consumer'`
      );
      const [[dev]] = await conn.query(
        `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'developer_id'`,
        [schema]
      );
      const addCol =
        Number(dev.c) > 0
          ? "ADD COLUMN publisher_id INT UNSIGNED NULL AFTER developer_id"
          : "ADD COLUMN publisher_id INT UNSIGNED NULL";
      await conn.query(
        `ALTER TABLE users ${addCol},
          ADD UNIQUE KEY uq_users_publisher_id (publisher_id),
          ADD CONSTRAINT fk_users_publisher FOREIGN KEY (publisher_id)
            REFERENCES publishers (publisher_id) ON DELETE SET NULL ON UPDATE CASCADE`
      );
      console.log("[db] Added users.publisher_id (Publisher role support)");
    }

    const [[dlCol]] = await conn.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_library' AND COLUMN_NAME = 'download_completed_at'`,
      [schema]
    );
    if (Number(dlCol.c) === 0) {
      await conn.query(
        `ALTER TABLE user_library ADD COLUMN download_completed_at DATETIME NULL AFTER last_played`
      );
      console.log("[db] Added user_library.download_completed_at (Download / Play states)");
    }
  } finally {
    conn.release();
  }
}
