"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Signed in");
      router.push("/");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-steam-card p-8 shadow-xl">
      <h1 className="text-center text-2xl font-black text-white">Sign in</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        JWT session · bcrypt passwords in MySQL
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-steam-accent"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-steam-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500"
        >
          Login
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-gray-500">
        Admin: <code className="text-steam-accent">admin@gdps.com</code> /{" "}
        <code className="text-steam-accent">admin123</code>
        <br />
        Consumer: <code className="text-steam-accent">elena@mail.local</code> /{" "}
        <code className="text-steam-accent">consumer123</code>
        <br />
        Developer: <code className="text-steam-accent">aurora@dev.com</code> /{" "}
        <code className="text-steam-accent">dev123</code>
        <br />
        Publisher: <code className="text-steam-accent">globalplay@studio.com</code> /{" "}
        <code className="text-steam-accent">dev123</code>
      </p>
      <p className="mt-4 text-center text-sm text-gray-400">
        No account?{" "}
        <Link href="/register" className="text-steam-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
