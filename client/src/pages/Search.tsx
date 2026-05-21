import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, X } from "lucide-react";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { VerifiedBadge } from "../components/VerifiedBadge";

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
                  <VerifiedBadge size={14} />
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
