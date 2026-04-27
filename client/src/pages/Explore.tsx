import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { Heart, MessageCircle, Layers } from "lucide-react";

interface ExplorePost {
  id: number;
  media: { url: string; type: string }[];
  likeCount: number;
  commentCount: number;
}

export default function Explore() {
  const { data = [] } = useQuery<ExplorePost[]>({
    queryKey: ["explore"],
    queryFn: () => api("/api/posts/explore"),
  });

  return (
    <div className="max-w-[935px] mx-auto md:pt-6">
      <div className="grid grid-cols-3 gap-1">
        {data.map((p, i) => {
          const span = i % 10 === 4 ? "row-span-2 col-span-2" : "";
          const m = p.media[0];
          if (!m) return null;
          return (
            <Link key={p.id} href={`/p/${p.id}`} className={`relative aspect-square ${span} group block bg-neutral-900`}>
                {m.type === "video" ? (
                  <video src={m.url} muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                {p.media.length > 1 && (
                  <Layers size={20} className="absolute top-2 right-2 fill-white text-white" />
                )}
                <div className="opacity-0 group-hover:opacity-100 transition absolute inset-0 bg-black/40 flex items-center justify-center gap-4 text-sm font-semibold">
                  <span className="flex items-center gap-1"><Heart size={18} className="fill-white" />{p.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={18} className="fill-white" />{p.commentCount}</span>
                </div>
              </Link>
          );
        })}
      </div>
      {data.length === 0 && (
        <div className="text-center text-ig-subtle py-20">Nothing to explore yet</div>
      )}
    </div>
  );
}
