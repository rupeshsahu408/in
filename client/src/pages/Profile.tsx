import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { useState } from "react";
import { Grid3x3, Bookmark, Tag, Settings, Heart, MessageCircle, ArrowLeft } from "lucide-react";
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

function ProfileSkeleton() {
  return (
    <div className="max-w-[935px] mx-auto px-2 md:px-5 pt-4 md:pt-8">
      <header className="flex items-start gap-6 md:gap-20 mb-6 md:mb-10 px-2">
        <div className="w-[88px] h-[88px] md:w-[150px] md:h-[150px] rounded-full skeleton shrink-0" />
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <div className="h-5 w-40 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 skeleton rounded" />
            <div className="h-8 w-24 skeleton rounded" />
          </div>
          <div className="h-3 w-48 skeleton rounded" />
          <div className="h-3 w-32 skeleton rounded" />
        </div>
      </header>
      <div className="grid grid-cols-3 gap-1 mt-1">
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="aspect-square skeleton" />
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [tab, setTab] = useState<"posts" | "saved" | "tagged">("posts");

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile", username],
    queryFn: () => api(`/api/users/profile/${username}`),
    staleTime: 30_000,
  });

  const { data: posts = [] } = useQuery<ProfilePost[]>({
    queryKey: ["profile", username, "posts"],
    queryFn: () => api(`/api/users/profile/${username}/posts`),
    staleTime: 30_000,
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

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return (
    <div className="p-8 text-center text-ig-subtle">
      <p className="text-lg mb-3">User not found</p>
      <button onClick={() => navigate("/")} className="text-ig-primary font-semibold text-sm">Go home</button>
    </div>
  );

  const showPosts = tab === "saved" ? saved : posts;

  return (
    <div className="max-w-[935px] mx-auto px-2 md:px-5 pt-4 md:pt-8">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center gap-2 px-2 mb-3">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
          className="icon-btn p-1.5 rounded-full hover:bg-neutral-900 mr-1"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-base">{profile.username}</span>
        {profile.isMe && (
          <Link href="/settings" className="ml-auto icon-btn p-1.5 rounded-full hover:bg-neutral-900">
            <Settings size={20} />
          </Link>
        )}
      </div>

      <header className="flex items-start gap-6 md:gap-20 mb-6 md:mb-10 px-2">
        {/* Avatar */}
        <div className="shrink-0">
          <Avatar
            src={profile.avatarUrl}
            size={88}
            className="md:!w-[150px] md:!h-[150px]"
            ring={profile.isMe ? "none" : "none"}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-3">
            <span className="text-xl md:text-2xl font-light">{profile.username}</span>
            <div className="flex gap-2 items-center flex-wrap">
              {profile.isMe ? (
                <>
                  <Link
                    href="/settings/edit"
                    className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors pressable"
                  >
                    Edit profile
                  </Link>
                  <Link
                    href="/settings"
                    className="hidden md:inline-flex bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors pressable"
                  >
                    View archive
                  </Link>
                  <Link href="/settings" className="hidden md:inline-flex icon-btn p-1.5 rounded-full hover:bg-neutral-900" aria-label="Settings">
                    <Settings size={22} />
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => followMut.mutate(!profile.isFollowing)}
                    disabled={followMut.isPending}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 pressable",
                      profile.isFollowing
                        ? "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600"
                        : "bg-ig-primary hover:bg-ig-primaryHover active:brightness-90 text-white",
                      followMut.isPending && "opacity-60"
                    )}
                  >
                    {followMut.isPending ? "…" : profile.isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={async () => {
                      if (!me) return navigate("/login");
                      const conv = await api<{ id: number }>("/api/messages/conversations", {
                        method: "POST",
                        body: { userId: profile.id },
                      });
                      navigate(`/messages/${conv.id}`);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors pressable"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Desktop stats */}
          <div className="hidden md:flex gap-8 mb-4">
            <span><b>{formatCount(profile.postCount)}</b> posts</span>
            <Link href={`/u/${profile.username}/followers`} className="hover:opacity-70 transition-opacity pressable">
              <b>{formatCount(profile.followerCount)}</b> followers
            </Link>
            <Link href={`/u/${profile.username}/following`} className="hover:opacity-70 transition-opacity pressable">
              <b>{formatCount(profile.followingCount)}</b> following
            </Link>
          </div>

          {/* Desktop bio */}
          <div className="hidden md:block">
            {profile.fullName && <div className="font-semibold text-sm">{profile.fullName}</div>}
            {profile.bio && <div className="text-sm whitespace-pre-wrap mt-0.5">{profile.bio}</div>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-300 font-semibold hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bio */}
      <div className="md:hidden px-3 mb-3">
        {profile.fullName && <div className="font-semibold text-sm">{profile.fullName}</div>}
        {profile.bio && <div className="text-sm whitespace-pre-wrap mt-0.5">{profile.bio}</div>}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noreferrer" className="text-xs text-blue-300 font-semibold hover:underline">
            {profile.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Mobile stats */}
      <div className="md:hidden grid grid-cols-3 border-y border-neutral-800 py-2 text-center text-sm mb-1">
        <div>
          <b>{formatCount(profile.postCount)}</b>
          <div className="text-xs text-ig-subtle">posts</div>
        </div>
        <Link href={`/u/${profile.username}/followers`} className="pressable">
          <b>{formatCount(profile.followerCount)}</b>
          <div className="text-xs text-ig-subtle">followers</div>
        </Link>
        <Link href={`/u/${profile.username}/following`} className="pressable">
          <b>{formatCount(profile.followingCount)}</b>
          <div className="text-xs text-ig-subtle">following</div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-12 border-t border-neutral-800 mt-4 text-xs uppercase tracking-widest">
        <button
          onClick={() => setTab("posts")}
          className={cn(
            "py-2.5 flex items-center gap-1.5 transition-all duration-150 pressable",
            tab === "posts"
              ? "border-t border-white -mt-px text-white font-semibold"
              : "text-ig-subtle hover:text-white"
          )}
        >
          <Grid3x3 size={14} /> Posts
        </button>
        {profile.isMe && (
          <button
            onClick={() => setTab("saved")}
            className={cn(
              "py-2.5 flex items-center gap-1.5 transition-all duration-150 pressable",
              tab === "saved"
                ? "border-t border-white -mt-px text-white font-semibold"
                : "text-ig-subtle hover:text-white"
            )}
          >
            <Bookmark size={14} /> Saved
          </button>
        )}
        <button
          onClick={() => setTab("tagged")}
          className={cn(
            "py-2.5 flex items-center gap-1.5 transition-all duration-150 pressable",
            tab === "tagged"
              ? "border-t border-white -mt-px text-white font-semibold"
              : "text-ig-subtle hover:text-white"
          )}
        >
          <Tag size={14} /> Tagged
        </button>
      </div>

      {/* Grid */}
      {tab !== "tagged" ? (
        <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-0.5">
          {showPosts.map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.id}`}
              className="relative aspect-square block group bg-neutral-900 overflow-hidden pressable"
            >
              {p.mediaUrl && (
                <img
                  src={p.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-0 bg-black/40 flex items-center justify-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1.5"><Heart size={18} className="fill-white" />{formatCount(p.likeCount)}</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={18} className="fill-white" />{formatCount(p.commentCount)}</span>
              </div>
              {p.mediaCount > 1 && (
                <div className="absolute top-2 right-2 text-white drop-shadow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" opacity=".3"/>
                    <path d="M6 2h14a2 2 0 012 2v14" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </Link>
          ))}
          {showPosts.length === 0 && (
            <div className="col-span-3 text-center text-ig-subtle py-16">
              {tab === "saved" ? "No saved posts yet" : "No posts yet"}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-ig-subtle py-16">No tagged posts</div>
      )}
    </div>
  );
}
