import { useQuery } from "@tanstack/react-query";
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
  const { data: tray = [] } = useQuery<TrayItem[]>({
    queryKey: ["story-tray"],
    queryFn: () => api("/api/stories/tray"),
  });
  const [openUserId, setOpenUserId] = useState<number | null>(null);

  return (
    <div className="border-b border-neutral-900 md:border md:border-neutral-800 md:rounded-lg md:max-w-[470px] mx-auto md:mt-4">
      <div className="flex gap-4 overflow-x-auto no-scrollbar p-3">
        {user && (
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*,video/*";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
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
                window.location.reload();
              };
              input.click();
            }}
            className="flex flex-col items-center gap-1 shrink-0 w-16"
          >
            <div className="relative">
              <Avatar src={user.avatarUrl} size={64} />
              <span className="absolute bottom-0 right-0 bg-ig-primary rounded-full p-0.5 border-2 border-black">
                <Plus size={12} />
              </span>
            </div>
            <span className="text-xs truncate w-full text-center">Your story</span>
          </button>
        )}
        {tray.map((s) => (
          <button
            key={s.userId}
            onClick={() => setOpenUserId(s.userId)}
            className="flex flex-col items-center gap-1 shrink-0 w-16"
          >
            <Avatar
              src={s.avatarUrl}
              size={64}
              ring={s.hasUnseen ? "story" : "seen"}
            />
            <span className="text-xs truncate w-full text-center">{s.username}</span>
          </button>
        ))}
        {!user && tray.length === 0 && (
          <div className="text-sm text-ig-subtle p-2">Sign in to see stories</div>
        )}
      </div>
      {openUserId !== null && (
        <StoryViewer userId={openUserId} onClose={() => setOpenUserId(null)} />
      )}
    </div>
  );
}
