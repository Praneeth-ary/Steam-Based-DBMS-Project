"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiUrl, coverSrc, subscribeOffersRefresh } from "@/lib/api";

const SORT_OPTIONS = [
  { id: "pct_desc", label: "Discount % (high → low)" },
  { id: "pct_asc", label: "Discount % (low → high)" },
  { id: "latest", label: "Latest offers (newest start date)" },
  { id: "name_asc", label: "Name (A–Z)" },
  { id: "name_desc", label: "Name (Z–A)" },
  { id: "price_asc", label: "Sale price (low → high)" },
  { id: "price_desc", label: "Sale price (high → low)" },
];

function sortOffers(list, sort) {
  const out = [...list];
  const num = (x) => Number(x) || 0;
  const ts = (d) => new Date(d).getTime() || 0;
  switch (sort) {
    case "name_asc":
      return out.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" }));
    case "name_desc":
      return out.sort((a, b) => String(b.title).localeCompare(String(a.title), undefined, { sensitivity: "base" }));
    case "latest":
      return out.sort((a, b) => {
        const byStart = ts(b.starting_date) - ts(a.starting_date);
        return byStart !== 0 ? byStart : num(b.offer_id) - num(a.offer_id);
      });
    case "price_asc":
      return out.sort((a, b) => num(a.sale_price) - num(b.sale_price));
    case "price_desc":
      return out.sort((a, b) => num(b.sale_price) - num(a.sale_price));
    case "pct_asc":
      return out.sort((a, b) => num(a.percentage_off) - num(b.percentage_off));
    case "pct_desc":
    default:
      return out.sort((a, b) => num(b.percentage_off) - num(a.percentage_off));
  }
}

export default function OffersPage() {
  const pathname = usePathname();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("pct_desc");

  const loadOffers = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) setLoading(true);
    try {
      const url = `${apiUrl("/api/offers")}?_=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load offers");
      setRows(Array.isArray(d) ? d : []);
    } catch (e) {
      if (!silent) toast.error(e.message || "Failed to load offers");
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/offers") return;
    loadOffers();
  }, [pathname, loadOffers]);

  useEffect(() => {
    const unsub = subscribeOffersRefresh(() => {
      if (pathname === "/offers") loadOffers({ silent: true });
    });
    return unsub;
  }, [pathname, loadOffers]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible" && pathname === "/offers") loadOffers({ silent: true });
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pathname, loadOffers]);

  useEffect(() => {
    if (pathname !== "/offers") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadOffers({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [pathname, loadOffers]);

  const sorted = useMemo(() => sortOffers(rows, sort), [rows, sort]);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-black text-white">Special offers</h1>
      <p className="mb-4 text-sm text-gray-500">
        Only games with an offer active <strong className="text-gray-400">right now</strong> (start ≤ today ≤
        end), same filter as <code className="text-steam-accent">GET /api/offers</code>. The list refreshes when
        you return to this tab, after edits in this or another tab, every ~30s while visible, or when you
        click Refresh.
      </p>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
          <span className="font-bold text-gray-400">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => loadOffers()}
          disabled={loading}
          className="rounded border border-white/20 px-4 py-2 text-sm font-bold text-steam-accent hover:bg-white/5 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {loading && rows.length === 0 && (
        <p className="mb-6 text-sm text-gray-500">Loading offers…</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {sorted.map((o) => (
          <Link
            key={o.offer_id}
            href={`/game/${o.game_id}`}
            className="flex gap-4 overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-steam-card p-4"
          >
            <div className="relative h-32 w-24 shrink-0">
              {o.cover_url && (
                <Image
                  src={coverSrc(o.cover_url)}
                  alt=""
                  fill
                  className="rounded object-cover"
                  sizes="96px"
                  unoptimized
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="rounded bg-lime-600 px-2 py-0.5 text-xs font-black text-white">
                -{Number(o.percentage_off).toFixed(0)}%
              </span>
              <h2 className="mt-2 truncate font-bold text-white">{o.title}</h2>
              <p className="text-xs text-gray-500">{o.category}</p>
              <p className="mt-2">
                <span className="text-gray-500 line-through">
                  ₹{Number(o.list_price).toFixed(2)}
                </span>
                <span className="ml-2 text-xl font-black text-lime-400">
                  ₹{Number(o.sale_price).toFixed(2)}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      {!loading && !sorted.length && (
        <p className="text-gray-500">No active offers right now. Add or extend an offer on a game (admin / publisher).</p>
      )}
    </div>
  );
}
