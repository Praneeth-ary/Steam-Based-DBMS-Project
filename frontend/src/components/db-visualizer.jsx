"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Database, GitBranch, Terminal } from "lucide-react";
import { apiUrl } from "@/lib/api";

export function DbVisualizer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("live");
  const [entries, setEntries] = useState([]);
  const [graph, setGraph] = useState(null);
  const [pulse, setPulse] = useState({});

  useEffect(() => {
    if (!open) return;
    fetch(apiUrl("/api/debug/schema-graph"))
      .then((r) => r.json())
      .then(setGraph)
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(apiUrl("/api/debug/activity"));
        const j = await r.json();
        const list = j.entries || [];
        setEntries(list);
        const last = list[0];
        if (last?.tables?.length) {
          const p = {};
          for (const x of last.tables) p[x] = true;
          setPulse(p);
          setTimeout(() => setPulse({}), 800);
        }
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => clearInterval(t);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-500"
      >
        <Database className="h-5 w-5" />
        DB mode
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28 }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0e141b] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-steam-accent">
                <Database className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Database visualization
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setTab("live")}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold uppercase ${
                  tab === "live" ? "border-b-2 border-steam-accent text-steam-accent" : "text-gray-500"
                }`}
              >
                <Terminal className="h-4 w-4" />
                Live SQL
              </button>
              <button
                type="button"
                onClick={() => setTab("graph")}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold uppercase ${
                  tab === "graph" ? "border-b-2 border-steam-accent text-steam-accent" : "text-gray-500"
                }`}
              >
                <GitBranch className="h-4 w-4" />
                Relations
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
              {tab === "live" && (
                <div className="space-y-3">
                  {!entries.length && (
                    <p className="text-gray-500">Interact with the store to see parameterized SQL.</p>
                  )}
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded border border-white/10 bg-black/40 p-3"
                    >
                      <div className="mb-2 flex justify-between text-[10px] text-gray-500">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Activity className="h-3 w-3" />
                          {entry.operation}
                        </span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-blue-200">{entry.sql}</pre>
                      {entry.params?.length ? (
                        <p className="mt-2 border-t border-white/5 pt-2 text-gray-400">
                          Params: {JSON.stringify(entry.params)}
                        </p>
                      ) : null}
                      {entry.tables?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.tables.map((tbl) => (
                            <span
                              key={tbl}
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                pulse[tbl]
                                  ? "bg-amber-500/30 text-amber-200 ring-2 ring-amber-400"
                                  : "bg-white/10 text-gray-300"
                              }`}
                            >
                              {tbl}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {(entry.affectedRows != null || entry.insertId != null) && (
                        <p className="mt-1 text-[10px] text-gray-500">
                          affectedRows={entry.affectedRows ?? "—"} insertId={entry.insertId ?? "—"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "graph" && graph && (
                <div className="space-y-4">
                  <p className="text-gray-500">
                    Tables (SDD entities). Edges show foreign-key style relationships.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {graph.nodes.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded border px-2 py-2 text-center ${
                          pulse[n.id]
                            ? "border-amber-400 bg-amber-500/10"
                            : "border-white/15 bg-white/5"
                        }`}
                      >
                        {n.label}
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-1 text-[11px] text-gray-400">
                    {graph.edges.map((edge, i) => (
                      <li key={i}>
                        <span className="text-steam-accent">{edge.from}</span>
                        <span className="text-gray-600"> —{edge.label}→ </span>
                        <span className="text-purple-300">{edge.to}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
