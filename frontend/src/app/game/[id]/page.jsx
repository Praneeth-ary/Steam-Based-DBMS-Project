"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Play, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch,
  apiUrl,
  broadcastOffersChanged,
  coverSrc,
  subscribeOffersRefresh,
} from "@/lib/api";
import { formatOfferCountdown } from "@/lib/offer-display";
import { GameCatalogForm } from "@/components/game-catalog-form";
import { GameOfferPanel } from "@/components/game-offer-panel";
import { useAuth } from "@/context/auth-context";

export default function GameDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [libBusy, setLibBusy] = useState(false);
  const [rating, setRating] = useState(8);
  const [text, setText] = useState("");
  const [method, setMethod] = useState("CreditCard");

  const refreshGame = useCallback(async () => {
    if (!id) return;
    const h = new Headers();
    if (token) h.set("Authorization", `Bearer ${token}`);
    const r = await fetch(`${apiUrl(`/api/games/${id}`)}?t=${Date.now()}`, {
      cache: "no-store",
      headers: h,
    });
    const g = await r.json();
    if (!r.ok) throw new Error(g.error || "Failed to load game");
    setGame(g);
  }, [id, token]);

  async function refreshReviews() {
    const r = await fetch(apiUrl(`/api/reviews/game/${id}`));
    setReviews(await r.json());
  }

  useEffect(() => {
    if (!id) return;
    refreshGame().catch(() => toast.error("Failed to load game"));
    fetch(apiUrl(`/api/reviews/game/${id}`))
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, [id, refreshGame]);

  useEffect(() => {
    return subscribeOffersRefresh(() => {
      refreshGame().catch(() => {});
    });
  }, [refreshGame]);

  if (!game) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const base = Number(game.price);
  const pct = game.active_offer_pct ? Number(game.active_offer_pct) : 0;
  const sale =
    game.effective_price != null
      ? Number(game.effective_price)
      : pct
        ? Math.round(base * (1 - pct / 100) * 100) / 100
        : base;
  const fmtInr = (n) => `₹${Number(n).toFixed(2)}`;
  const offerLeft = pct > 0 ? formatOfferCountdown(game.offer_seconds_remaining) : null;
  const ownStatus = game.ownership_status ?? "not_purchased";

  async function downloadOwned() {
    if (!token || !game) return;
    setLibBusy(true);
    try {
      await apiFetch("/api/purchase/download", {
        method: "POST",
        token,
        body: JSON.stringify({ gameId: game.game_id }),
      });
      toast.success("Download complete");
      await refreshGame();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLibBusy(false);
    }
  }

  async function playOwned() {
    if (!token || !game) return;
    setLibBusy(true);
    try {
      await apiFetch("/api/purchase/play", {
        method: "POST",
        token,
        body: JSON.stringify({ gameId: game.game_id }),
      });
      toast.success("Launching… (simulated)");
      await refreshGame();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLibBusy(false);
    }
  }

  async function buy() {
    const g = game;
    if (!g) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "Consumer") {
      toast.message(
        "Only consumer accounts can purchase. Catalog accounts manage games from the dashboard or store editor."
      );
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/purchase", {
        method: "POST",
        token,
        body: JSON.stringify({
          gameId: g.game_id,
          paymentMethod: method,
        }),
      });
      toast.success(
        `Purchase complete. TXN ${res.transactionId}. Tables: ${res.tablesTouched?.join(", ")}`
      );
      await refreshGame();
      router.push("/library");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    const g = game;
    if (!g) return;
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        token,
        body: JSON.stringify({
          gameId: g.game_id,
          rating,
          reviewText: text,
        }),
      });
      toast.success("Review saved");
      setText("");
      await refreshReviews();
      try {
        await refreshGame();
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteReviewEntry(reviewId) {
    if (!token) return;
    try {
      if (user?.role === "Admin") {
        await apiFetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE", token });
      } else {
        await apiFetch(`/api/reviews/entry/${reviewId}`, { method: "DELETE", token });
      }
      toast.success("Review removed");
      await refreshReviews();
      try {
        await refreshGame();
      } catch {
        /* ignore */
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteCatalogGame() {
    const g = game;
    if (!g || !token) return;
    const okDev =
      user?.role === "Developer" &&
      user.developerId != null &&
      Number(g.developer_id) === Number(user.developerId);
    const okPub =
      user?.role === "Publisher" &&
      user.publisherId != null &&
      g.publisher_id != null &&
      Number(g.publisher_id) === Number(user.publisherId);
    if (!okDev && !okPub) return;
    if (
      !confirm(
        `Permanently remove “${g.title}” from the platform? This deletes purchases, library rows, reviews, and offers for everyone.`
      )
    )
      return;
    try {
      await apiFetch(`/api/games/${g.game_id}`, { method: "DELETE", token });
      toast.success("Game removed");
      broadcastOffersChanged();
      router.push("/");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const canPurchase = user?.role === "Consumer";
  const canReview = user?.role === "Consumer";
  const canDeleteCatalogGame =
    (user?.role === "Developer" &&
      user.developerId != null &&
      Number(game.developer_id) === Number(user.developerId)) ||
    (user?.role === "Publisher" &&
      user.publisherId != null &&
      game.publisher_id != null &&
      Number(game.publisher_id) === Number(user.publisherId));

  const canEditGameMeta =
    user &&
    token &&
    (user.role === "Admin" ||
      (user.role === "Developer" &&
        user.developerId != null &&
        Number(game.developer_id) === Number(user.developerId)) ||
      (user.role === "Publisher" &&
        user.publisherId != null &&
        game.publisher_id != null &&
        Number(game.publisher_id) === Number(user.publisherId)));

  const reviewCount = Number(game.review_count ?? 0);
  const avgRating =
    game.avg_rating != null && game.avg_rating !== ""
      ? Number(game.avg_rating)
      : null;
  const hasRatings = reviewCount > 0 && avgRating != null && !Number.isNaN(avgRating);

  const cover = coverSrc(game.cover_url);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-steam-card">
          <div className="grid gap-6 p-6 md:grid-cols-[200px_1fr]">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-black/40">
              {cover ? (
                <Image
                  src={cover}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized
                />
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">{game.title}</h1>
              <p className="mt-2 text-sm text-gray-400">
                {game.developer_name}
                {game.publisher_name ? ` · ${game.publisher_name}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-steam-accent">
                  {game.category}
                </span>
                {hasRatings ? (
                  <span className="text-sm text-amber-400">
                    Avg Rating {avgRating.toFixed(2)} / 10
                    <span className="text-gray-500">
                      {" "}
                      · {reviewCount} {reviewCount === 1 ? "rating" : "ratings"}
                    </span>
                  </span>
                ) : (
                  <p className="text-sm italic text-gray-500">
                    No rating yet. Be one of the first to try this game!
                  </p>
                )}
              </div>
              <p className="mt-6 leading-relaxed text-gray-300">{game.description}</p>

              {canEditGameMeta && user && token && (
                <div className="mt-8 rounded-lg border border-steam-accent/30 bg-black/30 p-4">
                  <p className="text-xs font-bold uppercase text-steam-accent">
                    {user.role === "Admin"
                      ? "Admin — edit listing"
                      : user.role === "Developer"
                        ? "Developer — edit listing"
                        : "Publisher — edit listing"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {user.role === "Developer"
                      ? "Update listing details you are allowed to change. Price, publisher, and offers are not editable here."
                      : "Partners from the catalog lists, INR price, genre, about, thumbnail file or URL."}
                  </p>
                  <div className="mt-4">
                    <GameCatalogForm
                      key={`${game.game_id}-${game.cover_url}-${game.price}`}
                      mode="edit"
                      user={user}
                      token={token}
                      gameId={game.game_id}
                      initial={game}
                      cancelHref="/"
                      onSuccess={async () => {
                        await refreshGame();
                        await refreshReviews();
                      }}
                    />
                  </div>
                  <GameOfferPanel
                    gameId={game.game_id}
                    token={token}
                    user={user}
                    gamePublisherId={game.publisher_id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
            Reviews
          </h2>
          <div className="space-y-3">
            {!reviews.length && <p className="text-gray-500">No reviews yet.</p>}
            {reviews.map((rev) => (
              <div
                key={rev.review_id}
                className="rounded border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-white">{rev.username}</span>
                    <span className="ml-2 text-amber-400">{rev.rating}/10</span>
                  </div>
                  {user &&
                    token &&
                    (user.role === "Admin" || rev.user_id === user.id) && (
                      <button
                        type="button"
                        onClick={() => deleteReviewEntry(rev.review_id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-500/20 hover:text-red-300"
                        title="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(rev.review_date), "MMM d, yyyy")}
                </p>
                <p className="mt-2 text-gray-300">{rev.review_text}</p>
              </div>
            ))}
          </div>

          {canReview && (
            <div className="mt-6 rounded border border-dashed border-steam-accent/40 p-4">
              <p className="mb-3 text-sm text-gray-400">
                Post a review only if the game is in your library (enforced by API + DB).
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="text-sm">
                  Rating (1–10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="ml-2 w-16 rounded border border-white/10 bg-black/30 px-2 py-1"
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Your thoughts…"
                  className="min-w-[200px] flex-1 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={submitReview}
                  className="rounded bg-steam-accent px-4 py-2 text-sm font-bold text-black"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border border-white/10 bg-[#101822] p-6">
        <div>
          {pct > 0 ? (
            <>
              <p className="text-sm text-gray-500 line-through">{fmtInr(base)}</p>
              <p className="text-3xl font-black text-lime-400">{fmtInr(sale)}</p>
              <p className="text-xs text-steam-green">{pct}% off via OFFER</p>
              {offerLeft && (
                <p className="mt-2 text-xs font-bold text-amber-200/90">Offer ends in {offerLeft}</p>
              )}
            </>
          ) : (
            <p className="text-3xl font-black text-white">{fmtInr(base)}</p>
          )}
        </div>
        {canPurchase && ownStatus === "not_purchased" ? (
          <>
            <label className="block text-xs font-bold uppercase text-gray-500">Payment</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="CreditCard">CreditCard</option>
              <option value="PayPal">PayPal</option>
              <option value="Wallet">Wallet</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={buy}
              className="w-full rounded bg-gradient-to-r from-lime-700 to-lime-600 py-3 text-center text-sm font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
            >
              {busy ? "Processing…" : "Purchase"}
            </button>
            <p className="text-[11px] leading-relaxed text-gray-500">
              Prices in INR. Atomic transaction: <code className="text-steam-accent">purchases</code>,{" "}
              <code className="text-steam-accent">payments</code>,{" "}
              <code className="text-steam-accent">user_library</code>.
            </p>
          </>
        ) : canPurchase && ownStatus === "installed" ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Owned — install to your library client (simulated).</p>
            <button
              type="button"
              disabled={libBusy}
              onClick={downloadOwned}
              className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {libBusy ? "Working…" : "Download"}
            </button>
            <Link href="/library" className="block text-center text-sm text-steam-accent hover:underline">
              Open My games
            </Link>
          </div>
        ) : canPurchase && ownStatus === "playable" ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Installed — ready to play.</p>
            <button
              type="button"
              disabled={libBusy}
              onClick={playOwned}
              className="flex w-full items-center justify-center gap-2 rounded bg-lime-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {libBusy ? "…" : "Play"}
            </button>
            <Link href="/library" className="block text-center text-sm text-steam-accent hover:underline">
              Open My games
            </Link>
          </div>
        ) : (
          <div className="rounded border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200/90">
            {user?.role === "Admin" && (
              <>
                <p className="font-bold text-white">Admin account</p>
                <p className="mt-2 text-xs text-gray-400">
                  Purchases are disabled. Edit prices, reviews, and games from the{" "}
                  <Link href="/admin" className="text-steam-accent hover:underline">
                    Admin panel
                  </Link>
                  .
                </p>
              </>
            )}
            {(user?.role === "Developer" || user?.role === "Publisher") && (
              <p className="text-xs text-gray-400">
                Catalog accounts cannot purchase. Use a consumer account to buy games.
              </p>
            )}
            {canDeleteCatalogGame && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-bold uppercase text-red-400/90">
                  {user.role === "Developer" ? "Developer" : "Publisher"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  You can delete this listing because it is tied to your account.
                </p>
                <button
                  type="button"
                  onClick={deleteCatalogGame}
                  className="mt-2 w-full rounded border border-red-500/40 bg-red-950/30 py-2 text-center text-xs font-bold text-red-300 hover:bg-red-950/50"
                >
                  Delete this game
                </button>
              </div>
            )}
            {!user && (
              <Link href="/login" className="text-steam-accent hover:underline">
                Sign in as a consumer to purchase
              </Link>
            )}
          </div>
        )}
        <Link href="/" className="block text-center text-sm text-steam-accent hover:underline">
          ← Back to store
        </Link>
      </aside>
    </div>
  );
}
