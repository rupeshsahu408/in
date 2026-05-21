import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Avatar } from "../Common/Avatar";
import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface TrayItem {
  userId: number;
  username: string;
  avatarUrl: string;
  hasUnseen: boolean;
}

export function StoryTray() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: tray = [], isLoading } = useQuery<TrayItem[]>({
    queryKey: ["story-tray"],
    queryFn: () => api("/api/stories/tray"),
    staleTime: 30_000,
  });
  const [openUserId, setOpenUserId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddStory = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const up = await api<{ url: string; type: string }>("/api/upload", {
          method: "POST",
          body: fd,
        });
        await api("/api/stories", {
          method: "POST",
          body: { mediaUrl: up.url, type: up.type },
        });
        qc.invalidateQueries({ queryKey: ["story-tray"] });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="border-b border-neutral-900 md:border md:border-neutral-800 md:rounded-xl md:max-w-[470px] mx-auto md:mt-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar p-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0 w-16">
              <div className="w-16 h-16 rounded-full skeleton" />
              <div className="h-2 w-10 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-900 md:border md:border-neutral-800 md:rounded-xl md:max-w-[470px] mx-auto md:mt-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar p-3">
        {/* Your story button */}
        {user && (
          <button
            onClick={handleAddStory}
            disabled={uploading}
            className="flex flex-col items-center gap-1 shrink-0 w-16 pressable"
          >
            <div className="relative">
              <Avatar src={user.avatarUrl} size={64} />
              <span className="absolute bottom-0 right-0 bg-ig-primary rounded-full p-[3px] border-2 border-black shadow">
                {uploading ? (
                  <span className="spinner !w-2.5 !h-2.5 !border-[1.5px]" />
                ) : (
                  <Plus size={11} strokeWidth={3} />
                )}
              </span>
            </div>
            <span className="text-[11px] truncate w-full text-center text-ig-subtle">
              {uploading ? "Uploading…" : "Your story"}
            </span>
          </button>
        )}

        {/* Other stories */}
        {tray.map((s) => (
          <button
            key={s.userId}
            onClick={() => setOpenUserId(s.userId)}
            className="flex flex-col items-center gap-1 shrink-0 w-16 pressable"
          >
            <Avatar
              src={s.avatarUrl}
              size={64}
              ring={s.hasUnseen ? "story" : "seen"}
            />
            <span className="text-[11px] truncate w-full text-center">
              {s.username}
            </span>
          </button>
        ))}

        {!user && tray.length === 0 && (
          <div className="text-sm text-ig-subtle p-2">Sign in to see stories</div>
        )}
      </div>

      {openUserId !== null && (
        <StoryViewer
          userId={openUserId}
          onClose={() => {
            setOpenUserId(null);
            qc.invalidateQueries({ queryKey: ["story-tray"] });
          }}
        />
      )}
    </div>
  );
}
