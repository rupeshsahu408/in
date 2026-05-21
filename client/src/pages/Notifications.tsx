import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { Link } from "wouter";
import { timeAgo } from "../lib/utils";
import { useEffect } from "react";
import { Bell } from "lucide-react";

interface Notif {
  id: number;
  type: string;
  text: string;
  postId: number | null;
  isRead: boolean;
  createdAt: string;
  actorId: number;
  actorUsername: string;
  actorAvatar: string;
}

function NotifSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-11 h-11 rounded-full skeleton shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3 w-48 skeleton rounded" />
        <div className="h-2 w-24 skeleton rounded" />
      </div>
      <div className="w-10 h-10 skeleton rounded" />
    </div>
  );
}

export default function Notifications() {
  const { data = [], isLoading } = useQuery<Notif[]>({
    queryKey: ["notifications"],
    queryFn: () => api("/api/notifications"),
    staleTime: 30_000,
  });

  useEffect(() => {
    api("/api/notifications/read", { method: "POST" }).catch(() => {});
  }, []);

  const renderText = (n: Notif) => {
    if (n.type === "like") return "liked your photo.";
    if (n.type === "comment") return `commented: ${n.text}`;
    if (n.type === "follow") return "started following you.";
    return n.type;
  };

  return (
    <div className="max-w-[600px] mx-auto p-3 md:p-6">
      <h1 className="text-xl font-bold mb-4 px-1">Notifications</h1>

      {isLoading ? (
        <div className="flex flex-col">
          {[0,1,2,3,4].map(i => <NotifSkeleton key={i} />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-ig-subtle py-16">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {data.map((n) => (
            <Link
              key={n.id}
              href={n.postId ? `/p/${n.postId}` : `/u/${n.actorUsername}`}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors pressable ${
                !n.isRead ? "bg-neutral-900/60" : "hover:bg-neutral-900/40"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar src={n.actorAvatar} size={44} />
                {!n.isRead && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-ig-primary rounded-full border-2 border-black" />
                )}
              </div>
              <div className="flex-1 text-sm min-w-0">
                <span className="font-semibold">{n.actorUsername}</span>{" "}
                <span className="text-ig-subtle">{renderText(n)}</span>
                <div className="text-xs text-ig-subtle mt-0.5">{timeAgo(n.createdAt)}</div>
              </div>
              {n.type === "follow" && (
                <button
                  className="bg-ig-primary hover:bg-ig-primaryHover text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors pressable shrink-0"
                  onClick={(e) => e.preventDefault()}
                >
                  Follow back
                </button>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
