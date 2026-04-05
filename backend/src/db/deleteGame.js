import { connExecute, connQuery } from "./run.js";

/**
 * Remove a game and dependent rows (payments → purchases → library/reviews/offers).
 * Caller must manage transaction (begin/commit/rollback).
 */
export async function deleteGameCascade(conn, gameId) {
  const purchases = await connQuery(
    conn,
    "SELECT purchase_id FROM purchases WHERE game_id = ?",
    [gameId]
  );
  for (const row of purchases) {
    await connExecute(conn, "DELETE FROM payments WHERE purchase_id = ?", [
      row.purchase_id,
    ]);
  }
  await connExecute(conn, "DELETE FROM purchases WHERE game_id = ?", [gameId]);
  await connExecute(conn, "DELETE FROM user_library WHERE game_id = ?", [gameId]);
  await connExecute(conn, "DELETE FROM reviews WHERE game_id = ?", [gameId]);
  await connExecute(conn, "DELETE FROM offers WHERE game_id = ?", [gameId]);
  await connExecute(conn, "DELETE FROM games WHERE game_id = ?", [gameId]);
}
