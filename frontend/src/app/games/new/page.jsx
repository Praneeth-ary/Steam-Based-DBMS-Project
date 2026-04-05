"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { GameCatalogForm } from "@/components/game-catalog-form";
import { useAuth } from "@/context/auth-context";

const CREATE_ROLES = ["Admin", "Publisher"];

export default function NewGamePage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !CREATE_ROLES.includes(user.role)) {
      if (user?.role === "Developer") {
        toast.message("Developers cannot create new listings. Publishers or admins add titles and assign your studio.");
      }
      router.replace("/dashboard");
      return;
    }
    if (user.role === "Publisher" && user.publisherId == null) {
      toast.error("No publisher profile linked to this account.");
      router.replace("/dashboard");
      return;
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="text-gray-500">Loading…</p>;
  }

  if (!CREATE_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Add a new game</h1>
        <p className="mt-2 text-sm text-gray-500">
          Admins choose developer and optional publisher from existing catalog partners. Publishers
          publish under their company and pick the developer from the list.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-steam-card p-6">
        <GameCatalogForm
          mode="create"
          user={user}
          token={token}
          onSuccess={(created) => router.push(`/game/${created.game_id}`)}
        />
      </div>
    </div>
  );
}
