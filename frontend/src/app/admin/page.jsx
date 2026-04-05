"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUrl, broadcastOffersChanged } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminOffersSection } from "@/components/admin-offers-section";

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewsByGame, setReviewsByGame] = useState({});
  const [priceDraft, setPriceDraft] = useState({});
  const [gameSearch, setGameSearch] = useState("");

  const loadGames = useCallback(() => {
    if (!token) return Promise.resolve();
    return apiFetch("/api/admin/games", { token }).then(setGames);
  }, [token]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "Admin")) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !user || user.role !== "Admin") return;
    apiFetch("/api/admin/stats", { token })
      .then(setStats)
      .catch((e) => toast.error(e.message));
    loadGames().catch((e) => toast.error(e.message));
  }, [token, user, loadGames]);

  async function toggleReviews(gameId) {
    if (expandedId === gameId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(gameId);
    if (!reviewsByGame[gameId]) {
      const r = await fetch(apiUrl(`/api/reviews/game/${gameId}`));
      const list = await r.json();
      setReviewsByGame((prev) => ({ ...prev, [gameId]: list }));
    }
  }

  async function savePrice(gameId) {
    const v = priceDraft[gameId];
    if (v == null || v === "") {
      toast.error("Enter a price");
      return;
    }
    const num = Number(v);
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Invalid price");
      return;
    }
    try {
      await apiFetch(`/api/games/${gameId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ price: num }),
      });
      toast.success("Price updated");
      broadcastOffersChanged();
      setPriceDraft((d) => {
        const n = { ...d };
        delete n[gameId];
        return n;
      });
      await loadGames();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteGame(gameId, title) {
    if (!confirm(`Permanently delete “${title}” for all users? This removes library rows, reviews, offers, and purchase-linked data.`)) return;
    try {
      await apiFetch(`/api/games/${gameId}`, { method: "DELETE", token });
      toast.success("Game deleted platform-wide");
      broadcastOffersChanged();
      setExpandedId(null);
      await loadGames();
      const s = await apiFetch("/api/admin/stats", { token });
      setStats(s);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteReview(reviewId, gameId) {
    try {
      await apiFetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE", token });
      toast.success("Review deleted");
      const r = await fetch(apiUrl(`/api/reviews/game/${gameId}`));
      const list = await r.json();
      setReviewsByGame((prev) => ({ ...prev, [gameId]: list }));
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (!user || user.role !== "Admin") return null;

  const q = gameSearch.trim().toLowerCase();
  const filteredGames = games.filter(
    (g) =>
      !q ||
      (g.title && g.title.toLowerCase().includes(q)) ||
      (g.developer_name && g.developer_name.toLowerCase().includes(q)) ||
      String(g.game_id).includes(q)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black text-white">Admin</h1>
        <Link
          href="/games/new"
          className="inline-flex items-center justify-center gap-2 rounded bg-steam-accent px-4 py-2 text-sm font-bold text-black hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          Add new game
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        Manage catalog pricing, add titles, edit thumbnails and genres on store pages, remove reviews,
        and delete games globally. You cannot purchase games as admin.
      </p>

      {!stats ? (
        <p className="text-gray-500">Loading aggregates…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-steam-card p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Total revenue (INR)</p>
            <p className="mt-2 text-3xl font-black text-lime-400">
              ₹{stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-steam-card p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Users</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.users.total_users}</p>
            <p className="text-xs text-gray-500">
              C {stats.users.consumers} · D {stats.users.developers} · P{" "}
              {stats.users.publishers ?? 0} · A {stats.users.admins}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-steam-card p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Health</p>
            <p className="mt-2 text-2xl font-bold text-steam-accent">OK</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white">Games &amp; catalog detail</h2>
          <input
            type="search"
            value={gameSearch}
            onChange={(e) => setGameSearch(e.target.value)}
            placeholder="Search games or developers…"
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white sm:max-w-xs"
          />
        </div>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">Game</th>
              <th className="p-3">Developer</th>
              <th className="p-3">Price</th>
              <th className="p-3">Sales</th>
              <th className="p-3">Revenue</th>
              <th className="p-3">Reviews</th>
              <th className="p-3">Avg Rating</th>
              <th className="p-3">Library</th>
              <th className="p-3">Playtime Σ</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No games in the catalog.
                </td>
              </tr>
            ) : filteredGames.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No games match your search.
                </td>
              </tr>
            ) : null}
            {filteredGames.map((g) => (
              <Fragment key={g.game_id}>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleReviews(g.game_id)}
                      className="flex items-center gap-1 font-medium text-white hover:text-steam-accent"
                    >
                      {expandedId === g.game_id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {g.title}
                    </button>
                    <p className="mt-1 text-xs text-gray-500">{g.category} · ID {g.game_id}</p>
                    <Link
                      href={`/game/${g.game_id}`}
                      className="text-xs text-steam-accent hover:underline"
                    >
                      Store page
                    </Link>
                  </td>
                  <td className="p-3 text-gray-400">{g.developer_name}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder={Number(g.price).toFixed(2)}
                        value={priceDraft[g.game_id] ?? ""}
                        onChange={(e) =>
                          setPriceDraft((d) => ({ ...d, [g.game_id]: e.target.value }))
                        }
                        className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => savePrice(g.game_id)}
                        className="rounded bg-steam-accent p-1.5 text-black hover:opacity-90"
                        title="Save price"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300">{g.units_sold}</td>
                  <td className="p-3 text-lime-400">₹{Number(g.revenue_usd).toFixed(2)}</td>
                  <td className="p-3">{g.review_count}</td>
                  <td className="p-3">{g.avg_rating ?? "—"}</td>
                  <td className="p-3">{g.library_copies}</td>
                  <td className="p-3 text-gray-400">
                    {Number(g.total_playtime_hours).toFixed(1)} h
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => deleteGame(g.game_id, g.title)}
                      className="rounded p-2 text-red-400 hover:bg-red-500/20"
                      title="Delete game for everyone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {expandedId === g.game_id && (
                  <tr className="bg-black/30">
                    <td colSpan={10} className="p-4">
                      <p className="mb-2 text-xs font-bold uppercase text-gray-500">Reviews</p>
                      <div className="space-y-2">
                        {(reviewsByGame[g.game_id] || []).length === 0 && (
                          <p className="text-sm text-gray-500">No reviews.</p>
                        )}
                        {(reviewsByGame[g.game_id] || []).map((rev) => (
                          <div
                            key={rev.review_id}
                            className="flex items-start justify-between gap-2 rounded border border-white/10 p-3"
                          >
                            <div>
                              <span className="font-bold text-white">{rev.username}</span>
                              <span className="ml-2 text-amber-400">{rev.rating}/10</span>
                              <p className="mt-1 text-sm text-gray-300">{rev.review_text}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteReview(rev.review_id, g.game_id)}
                              className="shrink-0 text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AdminOffersSection token={token} search={gameSearch} />

      {stats && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-6">
          <h2 className="text-lg font-bold text-white">Top games (by sales)</h2>
          <ul className="mt-4 space-y-2">
            {stats.topGames.map((g) => (
              <li
                key={g.game_id}
                className="flex justify-between border-b border-white/5 py-2 text-sm"
              >
                <span>{g.title}</span>
                <span className="text-gray-400">
                  {g.sales} sales · ₹{Number(g.revenue).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
