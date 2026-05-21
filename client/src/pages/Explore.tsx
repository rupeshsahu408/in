import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { Heart, MessageCircle, Layers, Play } from "lucide-react";
import { formatCount } from "../lib/utils";

interface ExplorePost {
  id: number;
  media: { url: string; type: string }[];
  likeCount: number;
  commentCount: number;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {Array.from({ length: 12 }).map((_, i) => {
        const span = i % 10 === 4 ? "row-span-2 col-span-2" : "";
        return (
          <div
            key={i}
            className={`${span} aspect-square skeleton`}
          />
        );
      })}
    </div>
  );
}

export default function Explore() {
  const { data = [], isLoading } = useQuery<ExplorePost[]>({
    queryKey: ["explore"],
    queryFn: () => api("/api/posts/explore"),
    staleTime: 60_000,
  });

  return (
    <div className="max-w-[935px] mx-auto md:pt-4">
      {isLoading ? (
        <GridSkeleton />
      ) : data.length === 0 ? (
        <div className="text-center text-ig-subtle py-20">
          Nothing to explore yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {data.map((p, i) => {
            const span = i % 10 === 4 ? "row-span-2 col-span-2" : "";
            const m = p.media[0];
            if (!m) return null;
            return (
              <Link
                key={p.id}
                href={`/p/${p.id}`}
                className={`relative aspect-square ${span} group block bg-neutral-900 overflow-hidden pressable`}
              >
                {m.type === "video" ? (
                  <video
                    src={m.url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={m.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                )}

                {/* Overlay badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {p.media.length > 1 && (
                    <Layers size={18} className="fill-white text-white drop-shadow" />
                  )}
                  {m.type === "video" && (
                    <Play size={18} className="fill-white text-white drop-shadow" />
                  )}
                </div>

                {/* Hover stats */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-0 bg-black/40 flex items-center justify-center gap-4 text-sm font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Heart size={18} className="fill-white" />
                    {formatCount(p.likeCount)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={18} className="fill-white" />
                    {formatCount(p.commentCount)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
