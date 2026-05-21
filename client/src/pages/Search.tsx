import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, X } from "lucide-react";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";

interface SUser {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  isVerified?: boolean;
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {[0,1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3 p-2.5">
          <div className="w-11 h-11 rounded-full skeleton shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 w-28 skeleton rounded" />
            <div className="h-2 w-20 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancel = false;
    const id = setTimeout(async () => {
      try {
        const r = await api<SUser[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
        if (!cancel) {
          setResults(r);
          setLoading(false);
        }
      } catch {
        if (!cancel) setLoading(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div className="max-w-[420px] mx-auto p-3 md:p-6">
      <h1 className="text-xl font-bold mb-4 hidden md:block">Search</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-subtle pointer-events-none" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users…"
          className="w-full bg-neutral-900 focus:bg-neutral-800 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none placeholder:text-ig-subtle transition-colors"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ig-subtle hover:text-white transition-colors icon-btn"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex flex-col">
        {loading && q ? (
          <SearchSkeleton />
        ) : results.length > 0 ? (
          results.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.username}`}
              className="flex items-center gap-3 p-2.5 hover:bg-neutral-900/60 rounded-xl transition-colors pressable"
            >
              <Avatar src={u.avatarUrl} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate flex items-center gap-1">
                  {u.username}
                  {u.isVerified && (
                    <svg className="w-3.5 h-3.5 fill-ig-primary shrink-0" viewBox="0 0 40 40">
                      <path d="M19.998 3.094L14.22 7.212l-7.853-.05-2.469 7.019L.244 19.999l3.654 5.816-2.47 7.02 7.854-.05 5.78 4.118 5.778-4.118 7.854.05 2.469-7.02 3.654-5.816-3.654-5.818 2.469-7.018-7.854.05z" />
                      <path fill="#fff" d="M16.652 28.522l-6.79-6.792 3.293-3.293 3.497 3.498 8.045-8.046 3.293 3.293z" />
                    </svg>
                  )}
                </div>
                <div className="text-sm text-ig-subtle truncate">{u.fullName}</div>
              </div>
            </Link>
          ))
        ) : q && !loading ? (
          <div className="text-center text-ig-subtle py-16 text-sm">
            No results for "<span className="text-white">{q}</span>"
          </div>
        ) : (
          <div className="text-center text-ig-subtle py-16 text-sm">
            Search for people
          </div>
        )}
      </div>
    </div>
  );
}
