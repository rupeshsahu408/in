import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PostCard, type FeedPost } from "../components/Posts/PostCard";
import { Avatar } from "../components/Common/Avatar";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Smile, MoreHorizontal } from "lucide-react";
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
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { data: post, isLoading } = useQuery<FeedPost>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const p = await api<FeedPost>(`/api/posts/${postId}`);
      setLiked(Boolean(p.likedByMe));
      setSaved(Boolean(p.savedByMe));
      setLikeCount(p.likeCount);
      return p;
    },
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: () => api(`/api/posts/${postId}/comments`),
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

  if (isLoading || !post) return <div className="p-8 text-center text-ig-subtle">Loading...</div>;

  // Mobile: render PostCard. Desktop: render side-by-side layout.
  return (
    <>
      <div className="md:hidden p-2">
        <PostCard post={post} />
      </div>
      <div className="hidden md:flex max-w-[1100px] mx-auto pt-6 px-4 gap-1">
        <div className="flex-1 bg-neutral-950 max-w-[600px] aspect-square overflow-hidden flex items-center justify-center border border-neutral-800">
          {post.media[0] && (
            post.media[0].type === "video" ? (
              <video src={post.media[0].url} controls className="w-full h-full object-cover" />
            ) : (
              <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
            )
          )}
        </div>
        <div className="w-[400px] flex flex-col border border-l-0 border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-800 p-3">
            <Link href={`/u/${post.username}`} className="flex items-center gap-3">
                <Avatar src={post.avatarUrl} size={32} />
                <span className="text-sm font-semibold">{post.username}</span>
              </Link>
            <button><MoreHorizontal size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {post.caption && (
              <div className="flex gap-3 items-start">
                <Avatar src={post.avatarUrl} size={32} />
                <div>
                  <span className="font-semibold mr-2 text-sm">{post.username}</span>
                  <span className="text-sm">{post.caption}</span>
                </div>
              </div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <Link href={`/u/${c.username}`}><Avatar src={c.avatarUrl} size={32} /></Link>
                <div className="flex-1">
                  <div className="text-sm">
                    <Link href={`/u/${c.username}`} className="font-semibold mr-2">{c.username}</Link>
                    {c.text}
                  </div>
                  <div className="text-xs text-ig-subtle mt-1">{timeAgo(c.createdAt)} · Reply</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-800 p-3">
            <div className="flex gap-3 mb-2">
              <button onClick={toggleLike}><Heart size={26} className={cn(liked && "fill-ig-danger text-ig-danger")} /></button>
              <button><MessageCircle size={26} className="-scale-x-100" /></button>
              <button><Send size={26} /></button>
              <button onClick={toggleSave} className="ml-auto"><Bookmark size={26} className={cn(saved && "fill-white text-white")} /></button>
            </div>
            {likeCount > 0 && <div className="text-sm font-semibold">{formatCount(likeCount)} likes</div>}
            <div className="text-xs text-ig-subtle uppercase mt-1">{timeAgo(post.createdAt)} ago</div>
          </div>
          {user && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (text.trim()) sendComment.mutate(); }}
              className="border-t border-neutral-800 p-3 flex items-center gap-3"
            >
              <Smile size={22} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm outline-none placeholder:text-ig-subtle"
              />
              {text.trim() && (
                <button type="submit" className="text-ig-primary font-semibold text-sm">Post</button>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
