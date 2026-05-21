import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PostCard, type FeedPost } from "../components/Posts/PostCard";
import { StoryTray } from "../components/Stories/StoryTray";
import { Avatar } from "../components/Common/Avatar";
import { useAuth } from "../hooks/useAuth";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Suggested {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
}

function PostSkeleton() {
  return (
    <div className="md:border md:border-neutral-800 md:rounded-xl overflow-hidden md:max-w-[470px] mx-auto bg-black">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full skeleton" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-24 skeleton rounded" />
          <div className="h-2 w-16 skeleton rounded" />
        </div>
      </div>
      <div className="w-full aspect-square skeleton" />
      <div className="px-3 py-3 flex flex-col gap-2">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-3 w-48 skeleton rounded" />
        <div className="h-3 w-32 skeleton rounded" />
      </div>
    </div>
  );
}

function SuggestSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full skeleton shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-2 w-32 skeleton rounded" />
      </div>
      <div className="h-4 w-10 skeleton rounded" />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: feed = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: () => api("/api/posts/feed"),
  });
  const { data: suggested = [], isLoading: isSugLoading } = useQuery<Suggested[]>({
    queryKey: ["suggested"],
    queryFn: () => api("/api/users/suggested"),
    enabled: !!user,
  });

  return (
    <div className="md:flex md:justify-center md:gap-8 md:px-4 md:pt-6 max-w-[975px] mx-auto">
      {/* Feed */}
      <div className="flex-1 max-w-[630px] min-w-0">
        <StoryTray />
        <div className="flex flex-col gap-1 md:gap-6 pt-2 md:pt-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col gap-1 md:gap-6">
              {[0, 1, 2].map((i) => <PostSkeleton key={i} />)}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center text-ig-subtle p-12">
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
            <Link href={`/u/${user.username}`} className="pressable">
              <Avatar src={user.avatarUrl} size={56} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${user.username}`} className="font-semibold text-sm block truncate hover:opacity-70 transition-opacity">
                {user.username}
              </Link>
              <span className="text-sm text-ig-subtle truncate block">{user.fullName}</span>
            </div>
            <Link href="/settings" className="text-xs font-semibold text-ig-primary hover:text-white transition-colors">
              Switch
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ig-subtle">Suggested for you</span>
          <button className="text-xs font-semibold hover:text-ig-subtle transition-colors pressable">See All</button>
        </div>
        <div className="flex flex-col gap-3">
          {isSugLoading ? (
            [0, 1, 2, 3, 4].map((i) => <SuggestSkeleton key={i} />)
          ) : (
            suggested.map((s) => <SuggestRow key={s.id} user={s} />)
          )}
          {!user && (
            <Link href="/login" className="text-sm text-ig-primary font-semibold hover:text-white transition-colors">
              Sign in to see suggestions
            </Link>
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
      <Link href={`/u/${user.username}`} className="pressable">
        <Avatar src={user.avatarUrl} size={44} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/u/${user.username}`} className="font-semibold text-sm truncate block hover:opacity-70 transition-opacity">
          {user.username}
        </Link>
        <span className="text-xs text-ig-subtle truncate block">{user.fullName || "Suggested for you"}</span>
      </div>
      <FollowButton userId={user.id} />
    </div>
  );
}

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
      className={`text-sm font-semibold transition-all duration-150 pressable ${
        following
          ? "text-white"
          : "text-ig-primary hover:text-ig-primaryHover"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
