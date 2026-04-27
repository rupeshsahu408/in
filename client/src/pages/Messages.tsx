import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { Send, Smile, ImagePlus, Edit } from "lucide-react";
import { timeAgo } from "../lib/utils";

interface Conv {
  id: number;
  lastMessageAt: string;
  members: { userId: number; username: string; avatarUrl: string; fullName: string }[];
  lastMessage?: { text: string; sender_id: number; created_at: string } | null;
}

interface Msg {
  id: number;
  text: string;
  mediaUrl?: string;
  createdAt: string;
  senderId: number;
  senderUsername: string;
  senderAvatar: string;
}

export default function Messages() {
  const params = useParams<{ id?: string }>();
  const { user } = useAuth();
  const id = params.id ? Number(params.id) : null;

  const { data: conversations = [] } = useQuery<Conv[]>({
    queryKey: ["conversations"],
    queryFn: () => api("/api/messages/conversations"),
    enabled: !!user,
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-[calc(100vh-3rem)] md:h-screen border-l border-neutral-800">
      <aside className={`${id ? "hidden md:flex" : "flex"} flex-col w-full md:w-[380px] border-r border-neutral-800`}>
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <span className="font-bold">{user?.username || "Messages"}</span>
          <button><Edit size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const other = c.members[0];
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={`flex items-center gap-3 p-3 hover:bg-neutral-900 ${id === c.id ? "bg-neutral-900" : ""}`}>
                  <Avatar src={other?.avatarUrl} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{other?.username || "User"}</div>
                    <div className="text-xs text-ig-subtle truncate">
                      {c.lastMessage ? `${c.lastMessage.text || "Sent a media"} · ${timeAgo(c.lastMessage.created_at)}` : "Start chatting"}
                    </div>
                  </div>
                </Link>
            );
          })}
          {!conversations.length && (
            <div className="text-center text-ig-subtle py-8 text-sm">No conversations yet</div>
          )}
        </div>
      </aside>

      <section className={`${id ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {id ? <Thread id={id} /> : <EmptyThread />}
      </section>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center">
        <Send size={36} />
      </div>
      <div className="text-xl">Your messages</div>
      <div className="text-sm text-ig-subtle">Send private photos and messages to a friend.</div>
      <Link href="/search" className="bg-ig-primary px-4 py-1.5 rounded text-sm font-semibold">Send message</Link>
    </div>
  );
}

function Thread({ id }: { id: number }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = useQuery<Msg[]>({
    queryKey: ["messages", id],
    queryFn: () => api(`/api/messages/conversations/${id}/messages`),
    refetchInterval: 2500,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    await api(`/api/messages/conversations/${id}/messages`, {
      method: "POST",
      body: { text: value },
    });
    refetch();
  };

  return (
    <>
      <div className="p-3 border-b border-neutral-800 flex items-center gap-3">
        <Link href="/messages" className="md:hidden">Back</Link>
        <span className="font-semibold">Conversation</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messages.map((m, i) => {
          const mine = m.senderId === user?.id;
          const showAvatar = !mine && (i === 0 || messages[i - 1].senderId !== m.senderId);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && <div className="w-7">{showAvatar && <Avatar src={m.senderAvatar} size={28} />}</div>}
              <div className={`max-w-[70%] rounded-3xl px-4 py-2 text-sm ${mine ? "bg-ig-primary text-white" : "bg-neutral-800"}`}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 border-t border-neutral-800 flex items-center gap-2"
      >
        <button type="button"><Smile size={22} /></button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-neutral-900 rounded-full px-4 py-2 text-sm outline-none"
        />
        {text.trim() ? (
          <button type="submit" className="text-ig-primary font-semibold text-sm">Send</button>
        ) : (
          <button type="button"><ImagePlus size={22} /></button>
        )}
      </form>
    </>
  );
}
