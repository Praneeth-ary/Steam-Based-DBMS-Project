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

export function AdminOffersSection({ token, search }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const all = await apiFetch("/api/offers/manage", { token });
      setRows(all);
    } catch (e) {
      toast.error(e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = rows.filter(
    (o) =>
      !q ||
      (o.title && o.title.toLowerCase().includes(q)) ||
      String(o.game_id).includes(q)
  );

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

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20">
      <h2 className="border-b border-white/10 p-4 text-lg font-bold text-white">Offers (all games)</h2>
      <p className="border-b border-white/10 px-4 pb-3 text-xs text-gray-500">
        Same rules as on each game page: only active date ranges appear on the public Offers page.
      </p>
      <div className="space-y-3 p-4">
        {filtered.length === 0 && <p className="text-sm text-gray-500">No offers match this filter.</p>}
        {filtered.map((o) => (
          <div
            key={`${o.offer_id}-${o.starting_date}-${o.ending_date}-${o.percentage_off}`}
            className="flex flex-col gap-2 rounded border border-white/10 bg-steam-card/40 p-3 text-sm lg:flex-row lg:flex-wrap lg:items-end"
          >
            <div className="min-w-[180px] lg:mr-4">
              <p className="font-bold text-white">{o.title}</p>
              <p className="text-xs text-gray-500">Game #{o.game_id} · offer #{o.offer_id}</p>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
