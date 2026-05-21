import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PostCard, type FeedPost } from "../components/Posts/PostCard";
import { Avatar } from "../components/Common/Avatar";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Smile, MoreHorizontal, ArrowLeft } from "lucide-react";
import { timeAgo, formatCount, cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  parentId: number | null;
  userId: number;
  username: string;
  avatarUrl: string;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const { data: post, isLoading } = useQuery<FeedPost>({
    queryKey: ["post", postId],
    queryFn: () => api<FeedPost>(`/api/posts/${postId}`),
    staleTime: 30_000,
  });

  /* Sync local like/save state only when post first loads, not on every refetch */
  useEffect(() => {
    if (post && !initialized) {
      setLiked(Boolean(post.likedByMe));
      setSaved(Boolean(post.savedByMe));
      setLikeCount(post.likeCount);
      setInitialized(true);
    }
  }, [post, initialized]);

  /* Reset when navigating to a different post */
  useEffect(() => {
    setInitialized(false);
    setLiked(false);
    setSaved(false);
    setLikeCount(0);
    setText("");
  }, [postId]);

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: () => api(`/api/posts/${postId}/comments`),
    staleTime: 15_000,
  });

  const sendComment = useMutation({
    mutationFn: () => api(`/api/posts/${postId}/comments`, { method: "POST", body: { text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    api(`/api/posts/${postId}/like`, { method: next ? "POST" : "DELETE" });
  };

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    api(`/api/posts/${postId}/save`, { method: next ? "POST" : "DELETE" });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  if (isLoading || !post) {
    return (
      <div className="max-w-[1100px] mx-auto pt-4 px-4">
        {/* Mobile skeleton */}
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={handleBack} className="icon-btn p-1">
              <ArrowLeft size={22} />
            </button>
            <div className="h-4 w-32 skeleton rounded" />
          </div>
          <div className="w-full aspect-square skeleton rounded" />
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:flex gap-1 pt-6">
          <div className="flex-1 max-w-[600px] aspect-square skeleton rounded" />
          <div className="w-[400px] skeleton rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile header with back button */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-neutral-900 sticky top-12 bg-black z-10">
        <button
          onClick={handleBack}
          className="icon-btn p-1.5 rounded-full hover:bg-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="font-semibold text-sm">Post</span>
      </div>

      {/* Mobile: PostCard */}
      <div className="md:hidden p-2">
        <PostCard post={{ ...post, likedByMe: liked, savedByMe: saved, likeCount }} />
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:flex max-w-[1100px] mx-auto pt-6 px-4 gap-0 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Media */}
        <div className="flex-1 bg-neutral-950 max-w-[600px] aspect-square flex items-center justify-center">
          {post.media[0] && (
            post.media[0].type === "video" ? (
              <video src={post.media[0].url} controls className="w-full h-full object-cover" />
            ) : (
              <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
            )
          )}
        </div>

        {/* Side panel */}
        <div className="w-[400px] flex flex-col border-l border-neutral-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 p-3">
            <Link href={`/u/${post.username}`} className="flex items-center gap-3 group">
              <Avatar src={post.avatarUrl} size={32} />
              <span className="text-sm font-semibold group-hover:opacity-70 transition-opacity">
                {post.username}
              </span>
            </Link>
            <button className="icon-btn p-1 hover:opacity-60">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Comments scroll */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {post.caption && (
              <div className="flex gap-3 items-start">
                <Avatar src={post.avatarUrl} size={32} />
                <div>
                  <span className="font-semibold mr-2 text-sm">{post.username}</span>
                  <span className="text-sm">{post.caption}</span>
                  <div className="text-xs text-ig-subtle mt-1">{timeAgo(post.createdAt)}</div>
                </div>
              </div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Link href={`/u/${c.username}`}>
                  <Avatar src={c.avatarUrl} size={32} />
                </Link>
                <div className="flex-1">
                  <div className="text-sm">
                    <Link href={`/u/${c.username}`} className="font-semibold mr-2 hover:opacity-70 transition-opacity">
                      {c.username}
                    </Link>
                    {c.text}
                  </div>
                  <div className="text-xs text-ig-subtle mt-1">
                    {timeAgo(c.createdAt)} · <button className="hover:text-white transition-colors">Reply</button>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && !post.caption && (
              <div className="text-center text-ig-subtle text-sm py-8">No comments yet. Be the first!</div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-neutral-800 p-3">
            <div className="flex gap-4 mb-2">
              <button
                onClick={toggleLike}
                className="icon-btn hover:opacity-60"
                aria-label="Like"
              >
                <Heart
                  size={26}
                  className={cn(
                    "transition-colors duration-150",
                    liked ? "fill-ig-danger text-ig-danger" : ""
                  )}
                />
              </button>
              <button className="icon-btn hover:opacity-60">
                <MessageCircle size={26} className="-scale-x-100" />
              </button>
              <button className="icon-btn hover:opacity-60">
                <Send size={26} />
              </button>
              <button
                onClick={toggleSave}
                className="icon-btn hover:opacity-60 ml-auto"
                aria-label="Save"
              >
                <Bookmark
                  size={26}
                  className={cn("transition-colors duration-150", saved ? "fill-white text-white" : "")}
                />
              </button>
            </div>
            {likeCount > 0 && (
              <div className="text-sm font-semibold">{formatCount(likeCount)} {likeCount === 1 ? "like" : "likes"}</div>
            )}
            <div className="text-xs text-ig-subtle uppercase mt-1">{timeAgo(post.createdAt)} ago</div>
          </div>

          {/* Comment input */}
          {user && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (text.trim()) sendComment.mutate(); }}
              className="border-t border-neutral-800 p-3 flex items-center gap-3"
            >
              <Smile size={22} className="shrink-0" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 text-sm outline-none placeholder:text-ig-subtle"
              />
              {text.trim() && (
                <button
                  type="submit"
                  disabled={sendComment.isPending}
                  className="text-ig-primary font-semibold text-sm hover:text-white transition-colors disabled:opacity-50"
                >
                  {sendComment.isPending ? "…" : "Post"}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
