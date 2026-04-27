import { useEffect, useState } from "react";
import { onAuth, ensureFirebase, isFirebaseConfigured } from "../lib/firebase";
import { api } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export interface AppUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  website: string;
  avatarUrl: string;
  isPrivate: boolean;
  isVerified: boolean;
}

let cachedUser: AppUser | null = null;
let listeners: ((u: AppUser | null) => void)[] = [];
let initialized = false;

function setUser(u: AppUser | null) {
  cachedUser = u;
  listeners.forEach((l) => l(u));
}

async function init() {
  if (initialized) return;
  initialized = true;
  await ensureFirebase();
  if (!isFirebaseConfigured()) {
    setUser(null);
    return;
  }
  onAuth(async (fbUser: any) => {
    if (!fbUser) {
      setUser(null);
      return;
    }
    try {
      const me: AppUser = await api("/api/users/sync", { method: "POST", body: {} });
      setUser(me);
    } catch (e) {
      console.error("sync failed:", e);
      setUser(null);
    }
  });
}

export function useAuth() {
  const [user, setLocal] = useState<AppUser | null>(cachedUser);
  const [loading, setLoading] = useState(!initialized);
  const qc = useQueryClient();

  useEffect(() => {
    const cb = (u: AppUser | null) => {
      setLocal(u);
      setLoading(false);
      qc.invalidateQueries();
    };
    listeners.push(cb);
    init().then(() => setLoading(!initialized || (isFirebaseConfigured() && cachedUser === null)));
    // If firebase is not configured, mark not loading
    ensureFirebase().then(() => {
      if (!isFirebaseConfigured()) setLoading(false);
    });
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  }, [qc]);

  return { user, loading, refresh: async () => {
    try {
      const me = await api("/api/users/me");
      setUser(me);
    } catch {}
  }};
}
