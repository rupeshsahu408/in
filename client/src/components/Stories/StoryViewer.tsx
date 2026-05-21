import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface Story {
  id: number;
  mediaUrl: string;
  type: string;
  createdAt: string;
}

const STORY_DURATION = 5000; // ms

export function StoryViewer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["stories", userId],
    queryFn: () => api(`/api/stories/user/${userId}`),
    staleTime: 30_000,
  });

  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  pausedRef.current = paused;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!stories.length) return;
    setProgress(0);

    const story = stories[idx];
    if (story?.id) {
      api(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});
    }

    const step = 100 / (STORY_DURATION / 100);
    clearTimer();
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearTimer();
          setTimeout(() => {
            if (idx < stories.length - 1) {
              setIdx((i) => i + 1);
            } else {
              onClose();
            }
          }, 50);
          return 100;
        }
        return next;
      });
    }, 100);

    return clearTimer;
  }, [idx, stories.length]);

  /* Close on backdrop click */
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!stories.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <button onClick={onClose} className="absolute top-4 right-4 icon-btn p-2 rounded-full hover:bg-white/10">
          <X size={28} />
        </button>
        <div className="text-ig-subtle">No active stories</div>
      </div>
    );
  }

  const story = stories[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-[420px] h-full md:max-h-[90vh] md:rounded-2xl overflow-hidden bg-neutral-950 shadow-2xl">
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] bg-white/25 overflow-hidden rounded-full"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: `${i < idx ? 100 : i === idx ? progress : 0}%`,
                  transition: i === idx ? "width 0.1s linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={onClose}
          className="absolute top-6 right-4 z-20 icon-btn p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
          aria-label="Close"
        >
          <X size={22} />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          className="absolute top-6 right-14 z-20 icon-btn p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>

        {/* Prev / Next tap zones */}
        <button
          onClick={() => { setIdx(Math.max(0, idx - 1)); setProgress(0); }}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Previous"
        />
        <button
          onClick={() => {
            if (idx < stories.length - 1) { setIdx(idx + 1); setProgress(0); }
            else onClose();
          }}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Next"
        />

        {/* Arrow buttons (visible) */}
        {idx > 0 && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="bg-black/40 rounded-full p-1">
              <ChevronLeft size={24} className="text-white/70" />
            </div>
          </div>
        )}
        {idx < stories.length - 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="bg-black/40 rounded-full p-1">
              <ChevronRight size={24} className="text-white/70" />
            </div>
          </div>
        )}

        {/* Media */}
        {story.type === "video" ? (
          <video
            key={story.id}
            src={story.mediaUrl}
            autoPlay={!paused}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={story.id}
            src={story.mediaUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
