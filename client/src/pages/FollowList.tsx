import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";

interface U {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export default function FollowList({ kind }: { kind: "followers" | "following" }) {
  const { username } = useParams<{ username: string }>();
  const { data = [] } = useQuery<U[]>({
    queryKey: ["follow-list", username, kind],
    queryFn: () => api(`/api/users/profile/${username}/${kind}`),
  });
  return (
    <div className="max-w-[420px] mx-auto p-4">
      <h1 className="text-lg font-semibold capitalize mb-4">{kind}</h1>
      <div className="flex flex-col">
        {data.map((u) => (
          <Link key={u.id} href={`/u/${u.username}`} className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded">
              <Avatar src={u.avatarUrl} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{u.username}</div>
                <div className="text-sm text-ig-subtle truncate">{u.fullName}</div>
              </div>
            </Link>
        ))}
        {data.length === 0 && <div className="text-center text-ig-subtle py-8 text-sm">No one yet</div>}
      </div>
    </div>
  );
}
