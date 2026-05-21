import { useState, useRef } from "react";
import { VerifiedBadge } from "../VerifiedBadge";
import { Link } from "wouter";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Smile,
} from "lucide-react";
import { Avatar } from "../Common/Avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { timeAgo, formatCount, cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

export interface FeedPost {
  id: number;
  caption: string;
  location?: string;
  createdAt: string;
  userId: number;
  username: string;
  avatarUrl: string;
  isVerified?: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  media: { id: number; url: string; type: string }[];
}

export function PostCard({ post }: { post: FeedPost }) {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [saved, setSaved] = useState(Boolean(post.savedByMe));
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showAllCaption, setShowAllCaption] = useState(false);
  const [comment, setComment] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const likeMut = useMutation({
    mutationFn: (next: boolean) =>
      api(`/api/posts/${post.id}/like`, { method: next ? "POST" : "DELETE" }),
  });
  const saveMut = useMutation({
    mutationFn: (next: boolean) =>
      api(`/api/posts/${post.id}/save`, { method: next ? "POST" : "DELETE" }),
  });
  const commentMut = useMutation({
    mutationFn: (text: string) =>
      api(`/api/posts/${post.id}/comments`, { method: "POST", body: { text } }),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["post", post.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const toggleLike = (next?: boolean) => {
    const value = next === undefined ? !liked : next;
    if (value === liked) return;
    setLiked(value);
    setLikeCount((c) => c + (value ? 1 : -1));
    likeMut.mutate(value);
  };

  const toggleSave = () => {
    const value = !saved;
    setSaved(value);
    saveMut.mutate(value);
  };

  const handleDoubleClick = () => {
    if (!me) return;
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    if (!liked) toggleLike(true);
  };

  const goSlide = (dir: number) => {
    const next = Math.min(post.media.length - 1, Math.max(0, slide + dir));
    setSlide(next);
    if (trackRef.current) {
      const w = trackRef.current.clientWidth;
      trackRef.current.scrollTo({ left: next * w, behavior: "smooth" });
    }
  };

  return (
    <article className="md:border md:border-neutral-800 md:rounded-xl overflow-hidden md:max-w-[470px] mx-auto bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2.5">
        <Link
          href={`/u/${post.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar src={post.avatarUrl} size={32} ring="story" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold flex items-center gap-1 group-hover:opacity-70 transition-opacity">
              {post.username}
              <VerifiedBadge size={14} />
            </span>
            {post.location && (
              <span className="text-xs text-ig-subtle">{post.location}</span>
            )}
          </div>
        </Link>
        <button className="icon-btn p-2 hover:opacity-70 rounded-full" aria-label="Options">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Media */}
      <div
        className="relative bg-neutral-950 overflow-hidden select-none"
        onDoubleClick={handleDoubleClick}
      >
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {post.media.map((m) => (
            <div
              key={m.id}
              className="snap-center shrink-0 w-full aspect-square flex items-center justify-center bg-neutral-950"
            >
              {m.type === "video" ? (
                <video
                  src={m.url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          ))}
        </div>

        {/* Multi-slide controls */}
        {post.media.length > 1 && (
          <>
            {slide > 0 && (
              <button
                onClick={() => goSlide(-1)}
                className="icon-btn absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/80"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {slide < post.media.length - 1 && (
              <button
                onClick={() => goSlide(1)}
                className="icon-btn absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/80"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === slide ? "bg-blue-500 w-4" : "bg-white/50 w-1.5"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Double-tap heart */}
        {showHeart && (
          <Heart
            size={96}
            className="absolute top-1/2 left-1/2 fill-white text-white drop-shadow-lg heart-burst"
            style={{ marginTop: "-48px", marginLeft: "-48px" }}
          />
        )}
      </div>

      {/* Action bar */}
      <div className="px-3 md:px-4 pt-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => toggleLike()}
            className="icon-btn p-2 -ml-2 hover:opacity-60 rounded-full"
            aria-label="Like"
          >
            <Heart
              size={26}
              className={cn(
                "transition-all duration-150",
                liked ? "fill-ig-danger text-ig-danger scale-110" : ""
              )}
            />
          </button>
          <Link
            href={`/p/${post.id}`}
            className="icon-btn p-2 hover:opacity-60 rounded-full"
            aria-label="Comment"
          >
            <MessageCircle size={26} className="-scale-x-100" />
          </Link>
          <button className="icon-btn p-2 hover:opacity-60 rounded-full" aria-label="Share">
            <Send size={26} />
          </button>
        </div>
        <button
          onClick={toggleSave}
          className="icon-btn p-2 -mr-2 hover:opacity-60 rounded-full"
          aria-label="Save"
        >
          <Bookmark
            size={26}
            className={cn("transition-all duration-150", saved ? "fill-white text-white" : "")}
          />
        </button>
      </div>

      {/* Likes */}
      {likeCount > 0 && (
        <div className="px-3 md:px-4 pt-0.5 text-sm font-semibold">
          {formatCount(likeCount)} {likeCount === 1 ? "like" : "likes"}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-3 md:px-4 pt-1 text-sm">
          <Link href={`/u/${post.username}`} className="font-semibold mr-2 hover:opacity-70 transition-opacity">
            {post.username}
          </Link>
          <span className={!showAllCaption ? "line-clamp-2" : ""}>
            {post.caption}
          </span>
          {!showAllCaption && post.caption.length > 80 && (
            <button
              onClick={() => setShowAllCaption(true)}
              className="text-ig-subtle ml-1 hover:text-white transition-colors"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* Comment count link */}
      {post.commentCount > 0 && (
        <Link
          href={`/p/${post.id}`}
          className="block px-3 md:px-4 pt-1 text-sm text-ig-subtle hover:text-white transition-colors"
        >
          View all {formatCount(post.commentCount)} comments
        </Link>
      )}

      <div className="px-3 md:px-4 pt-1 text-[11px] text-ig-subtle uppercase tracking-wide">
        {timeAgo(post.createdAt)} ago
      </div>

      {/* Add Comment */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          commentMut.mutate(comment);
        }}
        className="flex items-center gap-2 px-3 md:px-4 py-3 mt-1 border-t border-neutral-900"
      >
        <Smile size={22} className="text-ig-subtle shrink-0" />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 text-sm placeholder:text-ig-subtle outline-none"
        />
        {comment.trim() && (
          <button
            type="submit"
            disabled={commentMut.isPending}
            className="text-ig-primary text-sm font-semibold hover:text-white transition-colors disabled:opacity-50 pressable"
          >
            {commentMut.isPending ? "…" : "Post"}
          </button>
        )}
      </form>
    </article>
  );
}
