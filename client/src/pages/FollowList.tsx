import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { ArrowLeft } from "lucide-react";

interface U {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-3 p-3">
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

export default function FollowList({ kind }: { kind: "followers" | "following" }) {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const { data = [], isLoading } = useQuery<U[]>({
    queryKey: ["follow-list", username, kind],
    queryFn: () => api(`/api/users/profile/${username}/${kind}`),
    staleTime: 30_000,
  });

  return (
    <div className="max-w-[420px] mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate(`/u/${username}`)}
          className="icon-btn p-1.5 rounded-full hover:bg-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold">{username}</h1>
          <p className="text-sm text-ig-subtle capitalize">{kind}</p>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : data.length === 0 ? (
        <div className="text-center text-ig-subtle py-16 text-sm">
          {kind === "followers" ? "No followers yet" : "Not following anyone yet"}
        </div>
      ) : (
        <div className="flex flex-col">
          {data.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.username}`}
              className="flex items-center gap-3 p-2.5 hover:bg-neutral-900/60 rounded-xl transition-colors pressable"
            >
              <Avatar src={u.avatarUrl} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1">{u.username}<VerifiedBadge size={13} /></div>
                <div className="text-sm text-ig-subtle truncate">{u.fullName}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
