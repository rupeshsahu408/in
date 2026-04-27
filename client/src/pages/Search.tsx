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

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SUser[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancel = false;
    const id = setTimeout(async () => {
      const r = await api<SUser[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (!cancel) setResults(r);
    }, 200);
    return () => {
      cancel = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div className="max-w-[420px] mx-auto p-3 md:p-6">
      <h1 className="text-xl font-bold mb-4 hidden md:block">Search</h1>
      <div className="relative mb-4">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-subtle" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="w-full bg-neutral-900 rounded-md pl-9 pr-9 py-2 text-sm outline-none placeholder:text-ig-subtle"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ig-subtle">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {results.map((u) => (
          <Link key={u.id} href={`/u/${u.username}`} className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded">
              <Avatar src={u.avatarUrl} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{u.username}</div>
                <div className="text-sm text-ig-subtle truncate">{u.fullName}</div>
              </div>
            </Link>
        ))}
        {q && results.length === 0 && (
          <div className="text-center text-ig-subtle py-12 text-sm">No results</div>
        )}
        {!q && (
          <div className="text-center text-ig-subtle py-12 text-sm">Search for users</div>
        )}
      </div>
    </div>
  );
}
