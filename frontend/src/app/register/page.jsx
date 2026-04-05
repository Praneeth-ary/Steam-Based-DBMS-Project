"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [accountType, setAccountType] = useState("consumer");
  const [studioName, setStudioName] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const emailLower = email.trim().toLowerCase();
    if (accountType === "developer" && !emailLower.endsWith("@dev.com")) {
      toast.error("Developer accounts must use an email ending in @dev.com");
      return;
    }
    if (accountType === "publisher" && !emailLower.endsWith("@studio.com")) {
      toast.error("Publisher accounts must use an email ending in @studio.com");
      return;
    }
    try {
      await register({
        username,
        email,
        password,
        country,
        accountType,
        studioName: accountType === "consumer" ? undefined : studioName,
      });
      toast.success("Account created");
      router.push("/");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const needsStudio = accountType === "developer" || accountType === "publisher";

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-steam-card p-8 shadow-xl">
      <h1 className="text-center text-2xl font-black text-white">Create account</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Consumer, developer studio, or publisher company — prices on the store are in INR (₹).
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Account type</p>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-gray-300">
              <input
                type="radio"
                name="atype"
                checked={accountType === "consumer"}
                onChange={() => setAccountType("consumer")}
              />
              Consumer — browse, buy, review owned games
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-gray-300">
              <input
                type="radio"
                name="atype"
                checked={accountType === "developer"}
                onChange={() => setAccountType("developer")}
              />
              Developer — edit your studio&apos;s games (<code className="text-steam-accent">@dev.com</code> email)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-gray-300">
              <input
                type="radio"
                name="atype"
                checked={accountType === "publisher"}
                onChange={() => setAccountType("publisher")}
              />
              Publisher — publish games &amp; offers (<code className="text-steam-accent">@studio.com</code> email)
            </label>
          </div>
        </div>

        {needsStudio && (
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              {accountType === "developer" ? "Studio / developer name" : "Publisher company name"}
            </label>
            <input
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Username</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
          {accountType === "developer" && (
            <p className="mt-1 text-xs text-gray-500">Developer signups must use <code className="text-steam-accent">@dev.com</code>.</p>
          )}
          {accountType === "publisher" && (
            <p className="mt-1 text-xs text-gray-500">Publisher signups must use <code className="text-steam-accent">@studio.com</code>.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Country</label>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-lime-700 py-3 text-sm font-bold text-white hover:bg-lime-600"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        <Link href="/login" className="text-steam-accent hover:underline">
          Already have an account?
        </Link>
      </p>
    </div>
  );
}
