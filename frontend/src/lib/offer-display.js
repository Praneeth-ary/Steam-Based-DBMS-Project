/** Human-readable remaining time for an active offer (server sends seconds until offer_ends_at). */
export function formatOfferCountdown(secondsRemaining) {
  const s = Number(secondsRemaining);
  if (!Number.isFinite(s) || s <= 0) return null;
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m left`;
  return "<1m left";
}
