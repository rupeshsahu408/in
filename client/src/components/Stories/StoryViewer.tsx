import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
  id: number;
  mediaUrl: string;
  type: string;
  createdAt: string;
}

export function StoryViewer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["stories", userId],
    queryFn: () => api(`/api/stories/user/${userId}`),
  });
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!stories.length) return;
    setProgress(0);
    const id = stories[idx]?.id;
    if (id) api(`/api/stories/${id}/view`, { method: "POST" }).catch(() => {});
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          if (idx < stories.length - 1) setIdx(idx + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [idx, stories.length]);

  if (!stories.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={28} />
        </button>
        <div className="text-ig-subtle">No active stories</div>
      </div>
    );
  }

  const story = stories[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[420px] h-full md:max-h-[90vh] md:rounded-xl overflow-hidden bg-neutral-950">
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 overflow-hidden rounded-full">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${i < idx ? 100 : i === idx ? progress : 0}%`,
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white">
          <X size={28} />
        </button>
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={() => (idx < stories.length - 1 ? setIdx(idx + 1) : onClose())}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white"
        >
          <ChevronRight size={32} />
        </button>
        {story.type === "video" ? (
          <video
            src={story.mediaUrl}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
    </div>
  );
}
