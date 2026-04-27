import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { Link } from "wouter";
import { timeAgo } from "../lib/utils";
import { useEffect } from "react";

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

export default function Notifications() {
  const { data = [] } = useQuery<Notif[]>({
    queryKey: ["notifications"],
    queryFn: () => api("/api/notifications"),
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
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {data.length === 0 ? (
        <div className="text-center text-ig-subtle py-12">No notifications yet</div>
      ) : (
        <div className="flex flex-col">
          {data.map((n) => (
            <Link key={n.id} href={n.postId ? `/p/${n.postId}` : `/u/${n.actorUsername}`} className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded">
                <Avatar src={n.actorAvatar} size={44} />
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{n.actorUsername}</span>{" "}
                  <span>{renderText(n)}</span>
                  <span className="text-ig-subtle ml-1">{timeAgo(n.createdAt)}</span>
                </div>
                {n.type === "follow" && (
                  <button className="bg-ig-primary px-3 py-1 rounded text-xs font-semibold">Follow back</button>
                )}
              </Link>
          ))}
        </div>
      )}
    </div>
  );
}
