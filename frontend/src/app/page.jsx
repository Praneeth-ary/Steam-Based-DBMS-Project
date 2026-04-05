"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { apiUrl, coverSrc, subscribeOffersRefresh } from "@/lib/api";
import { formatOfferCountdown } from "@/lib/offer-display";
import { useAuth } from "@/context/auth-context";

export default function StorePage() {
  const { user, token } = useAuth();
  const [games, setGames] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (maxPrice) p.set("maxPrice", maxPrice);
    return p.toString();
  }, [q, category, maxPrice]);

  const discoveryMode =
    user?.role === "Consumer" &&
    token &&
    !q.trim() &&
    !category &&
    !maxPrice;

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const useRecommended = discoveryMode;
      const path = useRecommended
        ? "/api/games/recommended"
        : `/api/games${qs ? `?${qs}` : ""}`;
      let url = apiUrl(path);
      if (useRecommended) url += (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const r = await fetch(url, { cache: "no-store", headers });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load");
      setGames(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Could not load catalog — is the API running?");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [discoveryMode, qs, token]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    return subscribeOffersRefresh(() => loadCatalog());
  }, [loadCatalog]);

  const categories = useMemo(() => {
    const s = new Set();
    games.forEach((g) => s.add(g.category));
    return [...s].sort();
  }, [games]);

  const heading = discoveryMode ? "Recommended for you" : "Browse catalog";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Featured &amp; recommended</h1>
          <p className="mt-1 text-sm text-gray-500">
            {discoveryMode
              ? "Owned titles are hidden here. Use search or filters to open the full catalog (with sale-aware sorting)."
              : "MySQL catalog — prices sorted by effective sale price when filtering. Offers refresh live from the database."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title…"
              className="w-56 rounded-full border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm outline-none focus:border-steam-accent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          >
            <option value="">All genres</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step={1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max ₹ (sale)"
            className="w-28 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-gray-400">{heading}</h2>

      {loading ? (
        <p className="text-steam-accent">Loading store…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((g) => {
            const base = Number(g.price);
            const pct = g.active_offer_pct ? Number(g.active_offer_pct) : 0;
            const sale =
              g.effective_price != null
                ? Number(g.effective_price)
                : pct
                  ? Math.round(base * (1 - pct / 100) * 100) / 100
                  : base;
            const fmt = (n) => `₹${Number(n).toFixed(2)}`;
            const countdown =
              pct > 0 ? formatOfferCountdown(g.offer_seconds_remaining) : null;
            const own = g.ownership_status;
            return (
              <Link
                key={g.game_id}
                href={`/game/${g.game_id}`}
                className="group flex flex-col overflow-hidden rounded border border-white/10 bg-steam-card transition hover:border-steam-accent/40 hover:shadow-lg hover:shadow-blue-900/20"
              >
                <div className="relative aspect-[2/3] bg-black/40">
                  {g.cover_url ? (
                    <Image
                      src={coverSrc(g.cover_url)}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="200px"
                      unoptimized
                    />
                  ) : null}
                  {pct > 0 && (
                    <span className="absolute right-2 top-2 rounded bg-steam-green px-2 py-0.5 text-xs font-bold text-white">
                      -{pct}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h2 className="font-bold text-white group-hover:text-steam-accent">{g.title}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {g.category} · {g.developer_name}
                  </p>
                  {own && own !== "not_purchased" && (
                    <p className="mt-1 text-[10px] font-bold uppercase text-amber-400/90">
                      In library · {own === "playable" ? "Installed" : "Not installed"}
                    </p>
                  )}
                  {pct > 0 && countdown && (
                    <p className="mt-1 text-[10px] text-lime-300/90">Offer: {countdown}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div>
                      {pct > 0 ? (
                        <>
                          <span className="text-xs text-gray-500 line-through">{fmt(base)}</span>
                          <span className="ml-2 font-bold text-lime-400">{fmt(sale)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-steam-accent">{fmt(base)}</span>
                      )}
                    </div>
                    <ShoppingBag className="h-4 w-4 text-gray-600 group-hover:text-steam-accent" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
