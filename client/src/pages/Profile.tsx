import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { useState } from "react";
import { Grid3x3, Bookmark, Tag, Settings, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatCount } from "../lib/utils";
import { cn } from "../lib/utils";

interface Profile {
  id: number;
  username: string;
  fullName: string;
  bio: string;
  website: string;
  avatarUrl: string;
  isVerified: boolean;
  isPrivate: boolean;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isMe: boolean;
}

interface ProfilePost {
  id: number;
  caption: string;
  mediaUrl: string;
  mediaCount: number;
  likeCount: number;
  commentCount: number;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [tab, setTab] = useState<"posts" | "saved" | "tagged">("posts");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile", username],
    queryFn: () => api(`/api/users/profile/${username}`),
  });

  const { data: posts = [] } = useQuery<ProfilePost[]>({
    queryKey: ["profile", username, "posts"],
    queryFn: () => api(`/api/users/profile/${username}/posts`),
  });

  const { data: saved = [] } = useQuery<ProfilePost[]>({
    queryKey: ["saved"],
    queryFn: () => api(`/api/posts/me/saved`),
    enabled: tab === "saved" && !!profile?.isMe,
  });

  const followMut = useMutation({
    mutationFn: (next: boolean) =>
      api(`/api/users/${profile!.id}/follow`, { method: next ? "POST" : "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", username] }),
  });

  if (isLoading || !profile) return <div className="p-8 text-center text-ig-subtle">Loading...</div>;

  const showPosts = tab === "saved" ? saved : posts;

  return (
    <div className="max-w-[935px] mx-auto px-2 md:px-5 pt-4 md:pt-8">
      <header className="flex items-start gap-6 md:gap-20 mb-6 md:mb-10 px-2">
        <div className="shrink-0">
          <Avatar src={profile.avatarUrl} size={88} className="md:!w-[150px] md:!h-[150px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-3">
            <span className="text-xl md:text-2xl font-light">{profile.username}</span>
            <div className="flex gap-2 items-center flex-wrap">
              {profile.isMe ? (
                <>
                  <Link href="/settings/edit" className="bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold px-4 py-1.5 rounded">Edit profile</Link>
                  <Link href="/settings" className="bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold px-4 py-1.5 rounded">View archive</Link>
                  <Link href="/settings" aria-label="Settings"><Settings size={22} /></Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => followMut.mutate(!profile.isFollowing)}
                    className={cn(
                      "px-4 py-1.5 rounded text-sm font-semibold",
                      profile.isFollowing
                        ? "bg-neutral-800 hover:bg-neutral-700"
                        : "bg-ig-primary hover:bg-ig-primaryHover text-white"
                    )}
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={async () => {
                      if (!me) return;
                      const conv = await api<{ id: number }>("/api/messages/conversations", {
                        method: "POST",
                        body: { userId: profile.id },
                      });
                      window.location.href = `/messages/${conv.id}`;
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold px-4 py-1.5 rounded"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:flex gap-8 mb-4">
            <span><b>{formatCount(profile.postCount)}</b> posts</span>
            <Link href={`/u/${profile.username}/followers`}><b>{formatCount(profile.followerCount)}</b> followers</Link>
            <Link href={`/u/${profile.username}/following`}><b>{formatCount(profile.followingCount)}</b> following</Link>
          </div>
          <div className="hidden md:block">
            {profile.fullName && <div className="font-semibold text-sm">{profile.fullName}</div>}
            {profile.bio && <div className="text-sm whitespace-pre-wrap">{profile.bio}</div>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-xs text-blue-300 font-semibold">
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bio */}
      <div className="md:hidden px-3 mb-3">
        {profile.fullName && <div className="font-semibold text-sm">{profile.fullName}</div>}
        {profile.bio && <div className="text-sm whitespace-pre-wrap">{profile.bio}</div>}
      </div>

      {/* Mobile stats row */}
      <div className="md:hidden grid grid-cols-3 border-y border-neutral-800 py-2 text-center text-sm">
        <div><b>{formatCount(profile.postCount)}</b><div className="text-xs text-ig-subtle">posts</div></div>
        <Link href={`/u/${profile.username}/followers`}><b>{formatCount(profile.followerCount)}</b><div className="text-xs text-ig-subtle">followers</div></Link>
        <Link href={`/u/${profile.username}/following`}><b>{formatCount(profile.followingCount)}</b><div className="text-xs text-ig-subtle">following</div></Link>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-12 border-t border-neutral-800 mt-4 pt-2 text-xs uppercase tracking-widest">
        <button onClick={() => setTab("posts")} className={cn("py-2 flex items-center gap-1", tab === "posts" && "border-t border-white -mt-px text-white")}>
          <Grid3x3 size={14} /> Posts
        </button>
        {profile.isMe && (
          <button onClick={() => setTab("saved")} className={cn("py-2 flex items-center gap-1", tab === "saved" && "border-t border-white -mt-px text-white")}>
            <Bookmark size={14} /> Saved
          </button>
        )}
        <button onClick={() => setTab("tagged")} className={cn("py-2 flex items-center gap-1", tab === "tagged" && "border-t border-white -mt-px text-white")}>
          <Tag size={14} /> Tagged
        </button>
      </div>

      {/* Grid */}
      {tab !== "tagged" ? (
        <div className="grid grid-cols-3 gap-1 md:gap-1 mt-1">
          {showPosts.map((p) => (
            <Link key={p.id} href={`/p/${p.id}`} className="relative aspect-square block group bg-neutral-900">
                {p.mediaUrl && (
                  <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="opacity-0 group-hover:opacity-100 transition absolute inset-0 bg-black/40 flex items-center justify-center gap-4 text-sm font-semibold">
                  <span className="flex items-center gap-1"><Heart size={18} className="fill-white" />{p.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={18} className="fill-white" />{p.commentCount}</span>
                </div>
              </Link>
          ))}
          {showPosts.length === 0 && (
            <div className="col-span-3 text-center text-ig-subtle py-12">No posts yet</div>
          )}
        </div>
      ) : (
        <div className="text-center text-ig-subtle py-12">No tagged posts</div>
      )}
    </div>
  );
}
