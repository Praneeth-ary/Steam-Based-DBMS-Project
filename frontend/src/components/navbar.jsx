"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Percent,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  const link = (href, label, icon) => (
    <Link
      href={href}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
        path === href ? "text-steam-accent" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-black/40 bg-steam-header/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-blue-800">
              <Gamepad2 className="h-4 w-4" />
            </span>
            <span>
              GDPS<span className="text-steam-accent">.store</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {link("/", "Store", <Gamepad2 className="h-3.5 w-3.5" />)}
            {link("/offers", "Offers", <Percent className="h-3.5 w-3.5" />)}
            {user && link("/library", "My games", <Library className="h-3.5 w-3.5" />)}
            {user && link("/dashboard", "Dashboard", <LayoutDashboard className="h-3.5 w-3.5" />)}
            {user?.role === "Admin" &&
              link("/admin", "Admin", <Shield className="h-3.5 w-3.5" />)}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-400 sm:inline">
                <User className="mr-1 inline h-4 w-4 text-steam-accent" />
                {user.username}
                <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded bg-white/5 p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-300"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
