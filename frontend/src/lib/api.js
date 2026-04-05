export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function apiFetch(path, opts = {}) {
  const { token, headers, ...rest } = opts;
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  if (token) h.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl(path), { ...rest, headers: h });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

/** Multipart (e.g. game create/edit with optional cover file). Do not set Content-Type. */
export async function apiFetchForm(path, { token, method = "POST", body }) {
  const h = new Headers();
  if (token) h.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl(path), { method, headers: h, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export function coverSrc(url) {
  if (!url) return "";
  const s = String(url);
  if (s.startsWith("/uploads/")) return apiUrl(s);
  return s;
}

/** Fired when offers are created/updated/deleted so the Offers page can refetch. */
export const GDPS_OFFERS_CHANGED = "gdps-offers-changed";

const OFFERS_BC_NAME = "gdps-offers-v1";
let offersBc = null;

function getOffersBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!offersBc) {
    try {
      offersBc = new BroadcastChannel(OFFERS_BC_NAME);
    } catch {
      return null;
    }
  }
  return offersBc;
}

export function broadcastOffersChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GDPS_OFFERS_CHANGED));
  try {
    getOffersBroadcastChannel()?.postMessage({ type: "offers" });
  } catch {
    /* private mode / quota */
  }
}

/** Same-tab + cross-tab (BroadcastChannel) subscription for catalog/offer mutations. */
export function subscribeOffersRefresh(cb) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(GDPS_OFFERS_CHANGED, handler);
  const bc = getOffersBroadcastChannel();
  bc?.addEventListener("message", handler);
  return () => {
    window.removeEventListener(GDPS_OFFERS_CHANGED, handler);
    bc?.removeEventListener("message", handler);
  };
}
