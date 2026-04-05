"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [devStats, setDevStats] = useState(null);
  const [myReviews, setMyReviews] = useState(null);
  const [gameSearch, setGameSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !token) return;
    if (
      user.role !== "Developer" &&
      user.role !== "Publisher" &&
      user.role !== "Admin"
    )
      return;
    apiFetch("/api/developer/stats", { token })
      .then(setDevStats)
      .catch((e) => toast.error(e.message));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token || user.role !== "Consumer") return;
    apiFetch("/api/reviews/me", { token })
      .then(setMyReviews)
      .catch((e) => toast.error(e.message));
  }, [user, token]);

  if (loading || !user) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const canPublish =
    user.role === "Admin" ||
    (user.role === "Publisher" && user.publisherId != null);

  const catalogGames = devStats?.games || [];
  const q = gameSearch.trim().toLowerCase();
  const filteredCatalog = catalogGames.filter(
    (g) =>
      !q ||
      (g.title && g.title.toLowerCase().includes(q)) ||
      String(g.game_id ?? "").includes(q)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        {canPublish && (
          <Link
            href="/games/new"
            className="inline-flex items-center justify-center gap-2 rounded bg-steam-accent px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            Add new game
          </Link>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-steam-card p-6">
          <h2 className="text-sm font-bold uppercase text-gray-500">Profile</h2>
          <p className="mt-2 text-white">{user.username}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          <p className="mt-2 inline-block rounded bg-white/10 px-2 py-1 text-xs font-bold">
            {user.role}
          </p>
          {user.developerId != null && (
            <p className="mt-2 text-xs text-gray-500">Developer ID: {user.developerId}</p>
          )}
          {user.publisherId != null && (
            <p className="mt-2 text-xs text-gray-500">Publisher ID: {user.publisherId}</p>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-steam-card p-6">
          <h2 className="text-sm font-bold uppercase text-gray-500">Role capabilities</h2>
          <ul className="mt-3 list-inside list-disc text-sm text-gray-300">
            {user.role === "Admin" && (
              <>
                <li>Full platform analytics, offers, and catalog</li>
                <li>User moderation hooks</li>
              </>
            )}
            {user.role === "Developer" && (
              <>
                <li>Edit your games&apos; details except price, publisher, and offers</li>
                <li>Register with an <code className="text-steam-accent">@dev.com</code> email</li>
              </>
            )}
            {user.role === "Publisher" && (
              <>
                <li>Publish games and manage offers for your catalog</li>
                <li>Register with an <code className="text-steam-accent">@studio.com</code> email</li>
              </>
            )}
            {user.role === "Consumer" && (
              <>
                <li>Browse, purchase, review owned titles</li>
                <li>See live SQL in DB mode during checkout</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {user.role === "Consumer" && myReviews && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-6">
          <h2 className="text-lg font-bold text-white">Your reviews</h2>
          <p className="text-sm text-gray-500">Everything you&apos;ve posted (newest first)</p>
          <ul className="mt-4 space-y-3">
            {myReviews.length === 0 && (
              <li className="text-sm text-gray-500">You haven&apos;t reviewed any games yet.</li>
            )}
            {myReviews.map((r) => (
              <li
                key={r.review_id}
                className="rounded border border-white/10 bg-steam-card/50 p-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/game/${r.game_id}`} className="font-bold text-steam-accent hover:underline">
                    {r.game_title}
                  </Link>
                  <span className="text-amber-400">{r.rating}/10</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(r.review_date), "MMM d, yyyy")}
                </p>
                <p className="mt-2 text-gray-300">{r.review_text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {devStats && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Your catalog analytics</h2>
              <p className="text-sm text-gray-500">Aggregations over purchases &amp; reviews</p>
            </div>
            <input
              type="search"
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              placeholder="Search games…"
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white sm:max-w-xs"
            />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {filteredCatalog.length === 0 && (
              <li className="text-gray-500">No games match your search.</li>
            )}
            {filteredCatalog.map((g) => (
              <li key={g.game_id ?? g.title} className="flex justify-between border-b border-white/5 py-2">
                <Link href={`/game/${g.game_id}`} className="text-steam-accent hover:underline">
                  {g.title}
                </Link>
                <span className="text-gray-400">
                  sales {g.purchases ?? 0} · Avg Rating {g.avg_rating ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user.role === "Consumer" && (
        <p className="text-sm text-gray-500">
          Tip: open{" "}
          <a href={apiUrl("/api/offers")} className="text-steam-accent hover:underline">
            /api/offers
          </a>{" "}
          to inspect JSON joins.
        </p>
      )}
    </div>
  );
}
