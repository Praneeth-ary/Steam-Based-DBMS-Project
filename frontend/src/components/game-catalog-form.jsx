"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, apiFetchForm, broadcastOffersChanged, coverSrc } from "@/lib/api";

const empty = {
  title: "",
  description: "",
  price: "",
  release_date: "",
  category: "",
  cover_url: "",
  partner_developer_id: "",
  partner_publisher_id: "",
  is_active: true,
};

export function GameCatalogForm({
  mode,
  user,
  token,
  gameId,
  initial,
  onSuccess,
  cancelHref = "/dashboard",
}) {
  const [form, setForm] = useState(empty);
  const [developers, setDevelopers] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isDeveloperEdit = mode === "edit" && user?.role === "Developer";

  useEffect(() => {
    if (!coverFile) {
      setLocalPreview(null);
      return;
    }
    const u = URL.createObjectURL(coverFile);
    setLocalPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [coverFile]);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role === "Admin" || user.role === "Publisher") {
      apiFetch("/api/games/meta/developers", { token })
        .then(setDevelopers)
        .catch(() => {});
    }
    if (user.role === "Admin") {
      apiFetch("/api/games/meta/publishers", { token })
        .then(setPublishers)
        .catch(() => {});
    }
  }, [token, user]);

  useEffect(() => {
    if (mode === "edit" && initial) {
      setForm({
        title: initial.title ?? "",
        description: initial.description ?? "",
        price: initial.price != null ? String(initial.price) : "",
        release_date: initial.release_date
          ? String(initial.release_date).slice(0, 10)
          : "",
        category: initial.category ?? "",
        cover_url: initial.cover_url ?? "",
        partner_developer_id:
          initial.developer_id != null ? String(initial.developer_id) : "",
        partner_publisher_id:
          initial.publisher_id != null ? String(initial.publisher_id) : "",
        is_active: !(initial.is_active === 0 || initial.is_active === false),
      });
      setCoverFile(null);
    } else if (mode === "create") {
      setForm(empty);
      setCoverFile(null);
    }
  }, [mode, initial]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function appendPartners(fd) {
    if (user.role === "Admin") {
      fd.append("partner_developer_id", form.partner_developer_id.trim());
      fd.append("partner_publisher_id", form.partner_publisher_id.trim());
    } else if (user.role === "Publisher") {
      fd.append("partner_developer_id", form.partner_developer_id.trim());
    }
  }

  function appendCatalogFlags(fd) {
    if (mode === "edit") {
      fd.append("is_active", form.is_active ? "true" : "false");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!token || !user) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and about are required");
      return;
    }
    if (!isDeveloperEdit) {
      const price = Number(form.price);
      if (Number.isNaN(price) || price <= 0) {
        toast.error("Enter a valid price in INR");
        return;
      }
    }
    if (!form.release_date) {
      toast.error("Release date is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Genre is required");
      return;
    }
    if (mode === "create" && user.role === "Admin" && !form.partner_developer_id.trim()) {
      toast.error("Select a developer");
      return;
    }
    if (mode === "create" && user.role === "Publisher" && !form.partner_developer_id.trim()) {
      toast.error("Select a developer");
      return;
    }
    if (mode === "edit" && user.role === "Publisher" && !form.partner_developer_id.trim()) {
      toast.error("Select a developer");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    if (!isDeveloperEdit) {
      fd.append("price", String(Number(form.price)));
    }
    fd.append("release_date", form.release_date);
    fd.append("category", form.category.trim());
    appendPartners(fd);
    appendCatalogFlags(fd);
    if (coverFile) {
      fd.append("cover", coverFile);
    } else if (form.cover_url.trim()) {
      fd.append("cover_url", form.cover_url.trim());
    }
    if (mode === "create") {
      fd.append("is_active", "true");
    }

    setSubmitting(true);
    try {
      const path = mode === "create" ? "/api/games" : `/api/games/${gameId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const data = await apiFetchForm(path, { token, method, body: fd });
      toast.success(mode === "create" ? "Game published" : "Game updated");
      broadcastOffersChanged();
      onSuccess?.(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const previewUrl = localPreview || coverSrc(form.cover_url);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-xs text-gray-500">
        Prices are in <strong className="text-gray-300">INR (₹)</strong>. Thumbnail: upload an image
        file and/or paste an image URL (URL is ignored if a file is selected).
      </p>

      {user.role === "Admin" && mode === "create" && (
        <>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Developer</span>
            <select
              required
              value={form.partner_developer_id}
              onChange={(e) => setField("partner_developer_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">Select developer…</option>
              {developers.map((d) => (
                <option key={d.developer_id} value={d.developer_id}>
                  {d.developer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Publisher (optional)</span>
            <select
              value={form.partner_publisher_id}
              onChange={(e) => setField("partner_publisher_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">None</option>
              {publishers.map((p) => (
                <option key={p.publisher_id} value={p.publisher_id}>
                  {p.publisher_name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {user.role === "Admin" && mode === "edit" && (
        <>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Developer</span>
            <select
              required
              value={form.partner_developer_id}
              onChange={(e) => setField("partner_developer_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">Select developer…</option>
              {developers.map((d) => (
                <option key={d.developer_id} value={d.developer_id}>
                  {d.developer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Publisher</span>
            <select
              value={form.partner_publisher_id}
              onChange={(e) => setField("partner_publisher_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">None</option>
              {publishers.map((p) => (
                <option key={p.publisher_id} value={p.publisher_id}>
                  {p.publisher_name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {user.role === "Publisher" && mode === "create" && (
        <>
          <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400">
            Your publisher:{" "}
            <span className="font-bold text-white">{user.publisherName || "—"}</span>
          </div>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Developer</span>
            <select
              required
              value={form.partner_developer_id}
              onChange={(e) => setField("partner_developer_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">Select developer…</option>
              {developers.map((d) => (
                <option key={d.developer_id} value={d.developer_id}>
                  {d.developer_name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {user.role === "Publisher" && mode === "edit" && (
        <>
          <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400">
            Your publisher:{" "}
            <span className="font-bold text-white">{user.publisherName || "—"}</span>
          </div>
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Developer</span>
            <select
              required
              value={form.partner_developer_id}
              onChange={(e) => setField("partner_developer_id", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">Select developer…</option>
              {developers.map((d) => (
                <option key={d.developer_id} value={d.developer_id}>
                  {d.developer_name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {isDeveloperEdit && (
        <>
          <div className="rounded border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-200/90">
            <p className="font-bold text-white">Developer listing</p>
            <p className="mt-1 text-xs text-gray-400">
              Price, publisher, and store offers are managed by your publisher or an admin. You can
              update title, description, release date, genre, visibility, and artwork.
            </p>
            {initial?.publisher_name ? (
              <p className="mt-2 text-xs text-gray-300">
                Publisher: <span className="font-bold text-white">{initial.publisher_name}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-gray-400">
              Price (read-only):{" "}
              <span className="font-mono text-white">₹{Number(initial?.price ?? 0).toFixed(2)}</span>
            </p>
          </div>
        </>
      )}

      <label className="block text-sm">
        <span className="font-bold text-gray-400">Title</span>
        <input
          required
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>

      <label className="block text-sm">
        <span className="font-bold text-gray-400">About (description)</span>
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {!isDeveloperEdit ? (
          <label className="block text-sm">
            <span className="font-bold text-gray-400">Price (₹ INR)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
        ) : (
          <div />
        )}
        <label className="block text-sm">
          <span className="font-bold text-gray-400">Release date</span>
          <input
            required
            type="date"
            value={form.release_date}
            onChange={(e) => setField("release_date", e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-bold text-gray-400">Genre (category)</span>
        <input
          required
          value={form.category}
          onChange={(e) => setField("category", e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>

      {mode === "edit" && ["Admin", "Developer", "Publisher"].includes(user.role) && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="font-bold text-gray-400">Visible on store (active)</span>
        </label>
      )}

      <label className="block text-sm">
        <span className="font-bold text-gray-400">Thumbnail — local file</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-gray-400"
        />
      </label>

      <label className="block text-sm">
        <span className="font-bold text-gray-400">Thumbnail — image URL (optional)</span>
        <input
          type="url"
          value={form.cover_url}
          onChange={(e) => setField("cover_url", e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>

      {previewUrl ? (
        <div className="relative h-48 w-32 overflow-hidden rounded border border-white/10 bg-black/40">
          <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-steam-accent px-6 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {submitting ? "Saving…" : mode === "create" ? "Publish game" : "Save changes"}
        </button>
        <Link
          href={cancelHref}
          className="rounded border border-white/20 px-6 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
