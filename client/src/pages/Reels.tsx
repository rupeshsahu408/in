import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Heart, MessageCircle, Send, MoreHorizontal, Music2, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "../components/Common/Avatar";
import { Link } from "wouter";
import { formatCount } from "../lib/utils";
import { useRef, useState } from "react";
import { cn } from "../lib/utils";

interface Item {
  id: number;
  caption: string;
  username: string;
  avatarUrl: string;
  likeCount: number;
  commentCount: number;
  media: { url: string; type: string }[];
}

export default function Reels() {
  const { data = [], isLoading } = useQuery<Item[]>({
    queryKey: ["explore"],
    queryFn: () => api("/api/posts/explore"),
    staleTime: 60_000,
  });

  const reels = data.filter((p) => p.media.some((m) => m.type === "video"));
  const all = reels.length ? reels : data;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3rem)] md:h-screen flex items-center justify-center bg-black">
        <div className="spinner" />
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] md:h-screen flex items-center justify-center bg-black">
        <div className="text-ig-subtle text-center">
          <div className="text-3xl mb-2">🎬</div>
          No reels yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] md:h-screen overflow-y-auto snap-y snap-mandatory bg-black">
      {all.map((p) => <ReelItem key={p.id} post={p} />)}
    </div>
  );
}

function ReelItem({ post }: { post: Item }) {
  const m = post.media.find((x) => x.type === "video") || post.media[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const toggleMute = () => {
    setMuted((v) => {
      if (videoRef.current) videoRef.current.muted = !v;
      return !v;
    });
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    api(`/api/posts/${post.id}/like`, { method: next ? "POST" : "DELETE" });
  };

  return (
    <div className="relative h-[calc(100vh-3rem)] md:h-screen w-full snap-start flex items-center justify-center">
      <div className="relative max-h-full h-full w-full md:w-[400px] bg-neutral-950 overflow-hidden md:rounded-2xl">
        {/* Media */}
        {m.type === "video" ? (
          <video
            ref={videoRef}
            src={m.url}
            loop
            autoPlay
            muted={muted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={m.url} alt="" className="w-full h-full object-cover" />
        )}

        {/* Right side actions */}
        <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center text-white">
          <button
            onClick={toggleLike}
            className="icon-btn flex flex-col items-center gap-1"
          >
            <Heart
              size={28}
              className={cn("transition-all duration-150", liked ? "fill-ig-danger text-ig-danger scale-110" : "")}
            />
            <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
          </button>
          <Link href={`/p/${post.id}`} className="icon-btn flex flex-col items-center gap-1">
            <MessageCircle size={28} />
            <span className="text-xs font-semibold">{formatCount(post.commentCount)}</span>
          </Link>
          <button className="icon-btn flex flex-col items-center gap-1">
            <Send size={28} />
            <span className="text-xs font-semibold">Share</span>
          </button>
          <button className="icon-btn">
            <MoreHorizontal size={28} />
          </button>
          {m.type === "video" && (
            <button onClick={toggleMute} className="icon-btn">
              {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute left-3 right-16 bottom-8 text-white">
          <Link href={`/u/${post.username}`} className="flex items-center gap-2 mb-2 pressable">
            <Avatar src={post.avatarUrl} size={32} />
            <span className="text-sm font-semibold drop-shadow">{post.username}</span>
            <span className="border border-white/70 rounded-lg px-2 py-0.5 text-xs font-semibold hover:bg-white/10 transition-colors">
              Follow
            </span>
          </Link>
          {post.caption && (
            <p className="text-sm line-clamp-2 mb-2 drop-shadow">{post.caption}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Music2 size={12} />
            <span className="truncate">Original audio · {post.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
