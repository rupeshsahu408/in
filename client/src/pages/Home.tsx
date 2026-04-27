import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PostCard, type FeedPost } from "../components/Posts/PostCard";
import { StoryTray } from "../components/Stories/StoryTray";
import { Avatar } from "../components/Common/Avatar";
import { useAuth } from "../hooks/useAuth";
import { Link } from "wouter";

interface Suggested {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}

export default function Home() {
  const { user } = useAuth();
  const { data: feed = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: () => api("/api/posts/feed"),
  });
  const { data: suggested = [] } = useQuery<Suggested[]>({
    queryKey: ["suggested"],
    queryFn: () => api("/api/users/suggested"),
    enabled: !!user,
  });

  return (
    <div className="md:flex md:justify-center md:gap-8 md:px-4 md:pt-6 max-w-[975px] mx-auto">
      <div className="flex-1 max-w-[630px] min-w-0">
        <StoryTray />
        <div className="flex flex-col gap-1 md:gap-6 pt-2 md:pt-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="md:max-w-[470px] mx-auto w-full bg-neutral-950 rounded animate-pulse h-[600px]"
                />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center text-ig-subtle p-8">
              {user
                ? "No posts yet. Follow people or create the first post!"
                : "Sign in to see your feed."}
            </div>
          ) : (
            feed.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div>

      {/* Suggestions sidebar (desktop only) */}
      <aside className="hidden lg:block w-[320px] pt-3 sticky top-6 self-start">
        {user && (
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/u/${user.username}`}><Avatar src={user.avatarUrl} size={56} /></Link>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${user.username}`} className="font-semibold text-sm block truncate">{user.username}</Link>
              <span className="text-sm text-ig-subtle truncate block">{user.fullName}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ig-subtle">Suggested for you</span>
          <button className="text-xs font-semibold">See All</button>
        </div>
        <div className="flex flex-col gap-3">
          {suggested.map((s) => (
            <SuggestRow key={s.id} user={s} />
          ))}
          {!user && (
            <Link href="/login" className="text-sm text-ig-primary font-semibold">Sign in to see suggestions</Link>
          )}
        </div>
        <div className="text-xs text-neutral-600 mt-8">
          © {new Date().getFullYear()} INSTAGRAM CLONE
        </div>
      </aside>
    </div>
  );
}

function SuggestRow({ user }: { user: Suggested }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/u/${user.username}`}><Avatar src={user.avatarUrl} size={44} /></Link>
      <div className="flex-1 min-w-0">
        <Link href={`/u/${user.username}`} className="font-semibold text-sm truncate block">{user.username}</Link>
        <span className="text-xs text-ig-subtle truncate block">{user.fullName || "Suggested for you"}</span>
      </div>
      <FollowButton userId={user.id} />
    </div>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function FollowButton({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const [following, setFollowing] = useState(false);
  const mut = useMutation({
    mutationFn: (next: boolean) =>
      api(`/api/users/${userId}/follow`, { method: next ? "POST" : "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suggested"] }),
  });
  return (
    <button
      onClick={() => {
        const next = !following;
        setFollowing(next);
        mut.mutate(next);
      }}
      className={
        following
          ? "text-sm text-white font-semibold"
          : "text-xs text-ig-primary hover:text-white font-semibold"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
