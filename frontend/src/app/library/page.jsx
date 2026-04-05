"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, coverSrc } from "@/lib/api";
import { formatOfferCountdown } from "@/lib/offer-display";
import { useAuth } from "@/context/auth-context";

export default function LibraryPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadLibrary = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch("/api/purchase/library", { token });
    setRows(data);
  }, [token]);

  useEffect(() => {
    loadLibrary().catch((e) => toast.error(e.message));
  }, [loadLibrary]);

  async function removeFromLibrary(gameId) {
    if (!token) return;
    try {
      await apiFetch(`/api/purchase/library/${gameId}`, { method: "DELETE", token });
      toast.success("Removed from your library");
      await loadLibrary();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function downloadGame(gameId) {
    if (!token) return;
    setBusyId(gameId);
    try {
      await apiFetch("/api/purchase/download", {
        method: "POST",
        token,
        body: JSON.stringify({ gameId }),
      });
      toast.success("Download complete — ready to play");
      await loadLibrary();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function playGame(gameId) {
    if (!token) return;
    setBusyId(gameId);
    try {
      await apiFetch("/api/purchase/play", {
        method: "POST",
        token,
        body: JSON.stringify({ gameId }),
      });
      toast.success("Launching… (simulated)");
      await loadLibrary();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  const canRemove = user.role === "Consumer";

  return (
    <div>
      <h1 className="mb-6 text-3xl font-black text-white">My games</h1>
      <p className="mb-6 text-sm text-gray-500">
        <strong className="text-gray-400">Download</strong> simulates install (<code className="text-steam-accent">download_completed_at</code> in{" "}
        <code className="text-steam-accent">user_library</code>). Then use <strong className="text-gray-400">Play</strong> to update{" "}
        <code className="text-steam-accent">last_played</code>.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((g) => {
          const playable = g.ownership_status === "playable";
          const countdown =
            g.active_offer_pct && Number(g.active_offer_pct) > 0
              ? formatOfferCountdown(g.offer_seconds_remaining)
              : null;
          return (
            <div
              key={g.game_id}
              className="flex gap-4 overflow-hidden rounded border border-white/10 bg-steam-card p-3"
            >
              <Link
                href={`/game/${g.game_id}`}
                className="flex min-w-0 flex-1 gap-4 hover:opacity-90"
              >
                <div className="relative h-24 w-20 shrink-0 bg-black/40">
                  {g.cover_url && (
                    <Image
                      src={coverSrc(g.cover_url)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-white">{g.title}</h2>
                  <p className="text-xs text-gray-500">
                    {Number(g.playtime_hours).toFixed(1)} h · added{" "}
                    {new Date(g.added_date).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-gray-500">
                    {playable ? "Installed · playable" : "Owned · not installed"}
                  </p>
                  {countdown && (
                    <p className="mt-1 text-[10px] text-lime-300/90">Offer ends in {countdown}</p>
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 flex-col justify-center gap-2">
                {user.role === "Consumer" &&
                  (playable ? (
                    <button
                      type="button"
                      disabled={busyId === g.game_id}
                      onClick={() => playGame(g.game_id)}
                      className="inline-flex items-center justify-center gap-1 rounded bg-lime-600 px-3 py-2 text-xs font-bold text-white hover:bg-lime-500 disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {busyId === g.game_id ? "…" : "Play"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === g.game_id}
                      onClick={() => downloadGame(g.game_id)}
                      className="inline-flex items-center justify-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {busyId === g.game_id ? "…" : "Download"}
                    </button>
                  ))}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeFromLibrary(g.game_id)}
                    className="rounded p-2 text-gray-500 hover:bg-red-500/20 hover:text-red-300"
                    title="Remove from library"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!rows.length && <p className="text-gray-500">Your library is empty — buy a game first.</p>}
    </div>
  );
}
