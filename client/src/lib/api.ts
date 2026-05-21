import { getIdToken } from "./firebase";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function api<T = any>(
  path: string,
  opts: RequestInit & { body?: any } = {}
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  const token = await getIdToken().catch(() => null);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const isJson =
    opts.body !== undefined &&
    !(opts.body instanceof FormData) &&
    typeof opts.body !== "string";
  if (isJson) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    body: isJson ? JSON.stringify(opts.body) : (opts.body as any),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}
