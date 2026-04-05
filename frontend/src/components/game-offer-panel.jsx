"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, broadcastOffersChanged } from "@/lib/api";

function toDatetimeLocal(mysqlOrIso) {
  const d = new Date(mysqlOrIso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fromDatetimeLocal(v) {
  if (!v) return "";
  return v.replace("T", " ") + ":00";
}

export function GameOfferPanel({ gameId, token, user, gamePublisherId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState({ start: "", end: "", pct: "10" });
  const [draft, setDraft] = useState({});

  const canManage =
    user?.role === "Admin" ||
    (user?.role === "Publisher" &&
      user.publisherId != null &&
      gamePublisherId != null &&
      Number(gamePublisherId) === Number(user.publisherId));

  const load = useCallback(async () => {
    if (!token || !canManage) return;
    setLoading(true);
    try {
      const all = await apiFetch("/api/offers/manage", { token });
      setRows(all.filter((o) => Number(o.game_id) === Number(gameId)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, canManage, gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addOffer(e) {
    e.preventDefault();
    if (!newRow.start || !newRow.end) {
      toast.error("Start and end required");
      return;
    }
    const pct = Number(newRow.pct);
    if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
      toast.error("Discount must be 1–100%");
      return;
    }
    try {
      await apiFetch("/api/offers", {
        method: "POST",
        token,
        body: JSON.stringify({
          gameId: Number(gameId),
          starting_date: fromDatetimeLocal(newRow.start),
          ending_date: fromDatetimeLocal(newRow.end),
          percentage_off: pct,
        }),
      });
      toast.success("Offer added");
      setNewRow({ start: "", end: "", pct: "10" });
      await load();
      broadcastOffersChanged();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function saveOffer(offerId) {
    const d = draft[offerId] || {};
    if (!d.start && !d.end && d.pct === undefined) {
      toast.error("Change a field first");
      return;
    }
    try {
      const body = {};
      if (d.start !== undefined && d.start !== "") body.starting_date = fromDatetimeLocal(d.start);
      if (d.end !== undefined && d.end !== "") body.ending_date = fromDatetimeLocal(d.end);
      if (d.pct !== undefined && d.pct !== "") {
        const pct = Number(d.pct);
        if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
          toast.error("Discount must be 1–100%");
          return;
        }
        body.percentage_off = pct;
      }
      if (!Object.keys(body).length) {
        toast.error("Nothing to save");
        return;
      }
      await apiFetch(`/api/offers/${offerId}`, { method: "PATCH", token, body: JSON.stringify(body) });
      toast.success("Offer updated");
      setDraft((x) => {
        const n = { ...x };
        delete n[offerId];
        return n;
      });
      await load();
      broadcastOffersChanged();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function removeOffer(offerId) {
    if (!confirm("Remove this offer?")) return;
    try {
      await apiFetch(`/api/offers/${offerId}`, { method: "DELETE", token });
      toast.success("Offer removed");
      await load();
      broadcastOffersChanged();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!canManage) return null;

  return (
    <div className="mt-6 rounded-lg border border-lime-500/30 bg-lime-950/10 p-4">
      <p className="text-xs font-bold uppercase text-lime-400">Store offers (discount %)</p>
      <p className="mt-1 text-xs text-gray-500">
        Active when today is between start and end. You can stack multiple rows; the store shows the
        best current discount.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Loading offers…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.length === 0 && <li className="text-sm text-gray-500">No offers for this game yet.</li>}
          {rows.map((o) => (
            <li
              key={`${o.offer_id}-${o.starting_date}-${o.ending_date}-${o.percentage_off}`}
              className="flex flex-col gap-2 rounded border border-white/10 bg-black/30 p-3 text-sm sm:flex-row sm:flex-wrap sm:items-end"
            >
              <label className="text-xs text-gray-400">
                Start
                <input
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(o.starting_date)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [o.offer_id]: { ...d[o.offer_id], start: e.target.value },
                    }))
                  }
                  className="mt-1 block rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                />
              </label>
              <label className="text-xs text-gray-400">
                End
                <input
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(o.ending_date)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [o.offer_id]: { ...d[o.offer_id], end: e.target.value },
                    }))
                  }
                  className="mt-1 block rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                />
              </label>
              <label className="text-xs text-gray-400">
                % off
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  defaultValue={o.percentage_off}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [o.offer_id]: { ...d[o.offer_id], pct: e.target.value },
                    }))
                  }
                  className="mt-1 block w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveOffer(o.offer_id)}
                  className="rounded bg-steam-accent px-3 py-1 text-xs font-bold text-black"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => removeOffer(o.offer_id)}
                  className="rounded border border-red-500/40 px-3 py-1 text-xs text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addOffer} className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="text-xs text-gray-400">
          New — start
          <input
            type="datetime-local"
            value={newRow.start}
            onChange={(e) => setNewRow((r) => ({ ...r, start: e.target.value }))}
            className="mt-1 block rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
          />
        </label>
        <label className="text-xs text-gray-400">
          New — end
          <input
            type="datetime-local"
            value={newRow.end}
            onChange={(e) => setNewRow((r) => ({ ...r, end: e.target.value }))}
            className="mt-1 block rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
          />
        </label>
        <label className="text-xs text-gray-400">
          % off
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={newRow.pct}
            onChange={(e) => setNewRow((r) => ({ ...r, pct: e.target.value }))}
            className="mt-1 block w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-lime-600 px-4 py-2 text-xs font-bold text-white hover:bg-lime-500"
        >
          Add offer
        </button>
      </form>
    </div>
  );
}
