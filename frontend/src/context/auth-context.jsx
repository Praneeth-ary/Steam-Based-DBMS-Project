"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";

const Ctx = createContext(null);

const STORAGE_KEY = "gdps_token";

function readStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    const t = readStoredToken();
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    apiFetch("/api/auth/me", { token: t })
      .then((u) =>
        setUser({
          id: u.id,
          username: u.username,
          email: u.email,
          country: u.country,
          role: u.role,
          developerId: u.developerId,
          publisherId: u.publisherId,
          developerName: u.developerName,
          publisherName: u.publisherName,
        })
      )
      .catch(() => {
        writeStoredToken(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    writeStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (p) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(p),
    });
    writeStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useAuth outside AuthProvider");
  return x;
}
