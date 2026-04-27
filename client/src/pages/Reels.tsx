import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Heart, MessageCircle, Send, MoreHorizontal, Music2 } from "lucide-react";
import { Avatar } from "../components/Common/Avatar";
import { Link } from "wouter";
import { formatCount } from "../lib/utils";

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
  const { data = [] } = useQuery<Item[]>({
    queryKey: ["explore"],
    queryFn: () => api("/api/posts/explore"),
  });

  const reels = data.filter((p) => p.media.some((m) => m.type === "video"));
  const all = reels.length ? reels : data;

  return (
    <div className="h-[calc(100vh-3rem)] md:h-screen overflow-y-auto snap-y snap-mandatory bg-black">
      {all.map((p) => {
        const m = p.media.find((x) => x.type === "video") || p.media[0];
        return (
          <div key={p.id} className="relative h-[calc(100vh-3rem)] md:h-screen w-full snap-start flex items-center justify-center">
            <div className="relative max-h-full h-full w-full md:w-[400px] bg-neutral-950 overflow-hidden md:rounded-lg">
              {m.type === "video" ? (
                <video
                  src={m.url}
                  loop
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    const v = e.currentTarget;
                    v.muted = !v.muted;
                  }}
                />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute right-3 bottom-20 flex flex-col gap-5 items-center text-white">
                <button className="flex flex-col items-center"><Heart size={28} /><span className="text-xs">{formatCount(p.likeCount)}</span></button>
                <button className="flex flex-col items-center"><MessageCircle size={28} /><span className="text-xs">{formatCount(p.commentCount)}</span></button>
                <button><Send size={28} /></button>
                <button><MoreHorizontal size={28} /></button>
              </div>
              <div className="absolute left-3 right-16 bottom-6 text-white">
                <Link href={`/u/${p.username}`} className="flex items-center gap-2 mb-2">
                    <Avatar src={p.avatarUrl} size={28} />
                    <span className="text-sm font-semibold">{p.username}</span>
                    <span className="border border-white/70 rounded px-2 py-0.5 text-xs font-semibold">Follow</span>
                  </Link>
                {p.caption && <p className="text-sm line-clamp-2 mb-2">{p.caption}</p>}
                <div className="flex items-center gap-2 text-xs">
                  <Music2 size={12} />
                  <span>Original audio · {p.username}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {all.length === 0 && (
        <div className="h-full flex items-center justify-center text-ig-subtle">No reels yet</div>
      )}
    </div>
  );
}
