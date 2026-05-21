import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { useAuth } from "../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { Send, Smile, ImagePlus, Edit, ArrowLeft } from "lucide-react";
import { timeAgo, cn } from "../lib/utils";

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
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const id = params.id ? Number(params.id) : null;

  const { data: conversations = [], isLoading } = useQuery<Conv[]>({
    queryKey: ["conversations"],
    queryFn: () => api("/api/messages/conversations"),
    enabled: !!user,
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-[calc(100vh-3rem)] md:h-screen border-l border-neutral-800">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex-col w-full md:w-[380px] border-r border-neutral-800",
          id ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <span className="font-bold text-base">{user?.username || "Messages"}</span>
          <button className="icon-btn p-1.5 rounded-full hover:bg-neutral-900">
            <Edit size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-0">
              {[0,1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-14 h-14 rounded-full skeleton shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-28 skeleton rounded" />
                    <div className="h-2 w-40 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-ig-subtle py-12 text-sm px-4">
              <Send size={40} className="mx-auto mb-3 opacity-30" />
              No messages yet
            </div>
          ) : (
            conversations.map((c) => {
              const other = c.members[0];
              const isActive = id === c.id;
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors pressable",
                    isActive ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                  )}
                >
                  <Avatar src={other?.avatarUrl} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1">{other?.username || "User"}{other && <VerifiedBadge size={13} />}</div>
                    <div className="text-xs text-ig-subtle truncate mt-0.5">
                      {c.lastMessage
                        ? `${c.lastMessage.text || "Sent a photo"} · ${timeAgo(c.lastMessage.created_at)}`
                        : "Start a conversation"}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Thread view */}
      <section className={cn("flex-col flex-1", id ? "flex" : "hidden md:flex")}>
        {id ? <Thread id={id} /> : <EmptyThread />}
      </section>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-2">
        <Send size={32} />
      </div>
      <div className="text-xl font-semibold">Your messages</div>
      <div className="text-sm text-ig-subtle max-w-[200px]">
        Send private photos and messages to a friend.
      </div>
      <Link
        href="/search"
        className="bg-ig-primary hover:bg-ig-primaryHover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors pressable mt-1"
      >
        Send message
      </Link>
    </div>
  );
}

function Thread({ id }: { id: number }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], refetch } = useQuery<Msg[]>({
    queryKey: ["messages", id],
    queryFn: () => api(`/api/messages/conversations/${id}/messages`),
    refetchInterval: 2500,
    staleTime: 2000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    const val = text.trim();
    if (!val || sending) return;
    setSending(true);
    setText("");
    try {
      await api(`/api/messages/conversations/${id}/messages`, {
        method: "POST",
        body: { text: val },
      });
      await refetch();
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /* Find the other participant's name from the conversation list in cache */
  const { data: conversations = [] } = useQuery<any[]>({ queryKey: ["conversations"], enabled: false });
  const conv = conversations.find((c: any) => c.id === id);
  const other = conv?.members?.[0];

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center gap-3 min-h-[57px]">
        <button
          onClick={() => navigate("/messages")}
          className="md:hidden icon-btn p-1.5 rounded-full hover:bg-neutral-900"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        {other ? (
          <Link href={`/u/${other.username}`} className="flex items-center gap-3 pressable">
            <Avatar src={other.avatarUrl} size={32} />
            <span className="font-semibold text-sm flex items-center gap-1">{other.username}<VerifiedBadge size={14} /></span>
          </Link>
        ) : (
          <span className="font-semibold text-sm">Conversation</span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {messages.map((m, i) => {
          const mine = m.senderId === user?.id;
          const prev = messages[i - 1];
          const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);
          const isLast = !messages[i + 1] || messages[i + 1].senderId !== m.senderId;

          return (
            <div
              key={m.id}
              className={cn(
                "flex items-end gap-2",
                mine ? "flex-row-reverse" : "",
                showAvatar ? "mt-2" : "mt-0.5"
              )}
            >
              {!mine && (
                <div className="w-7 shrink-0">
                  {showAvatar && <Avatar src={m.senderAvatar} size={28} />}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2 text-sm leading-relaxed",
                  mine
                    ? "bg-ig-primary text-white"
                    : "bg-neutral-800 text-white",
                  /* Bubble shape */
                  mine
                    ? isLast
                      ? "rounded-3xl rounded-br-md"
                      : "rounded-3xl"
                    : isLast
                    ? "rounded-3xl rounded-bl-md"
                    : "rounded-3xl"
                )}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 border-t border-neutral-800 flex items-center gap-2"
      >
        <button type="button" className="icon-btn p-1.5 rounded-full hover:bg-neutral-900">
          <Smile size={22} />
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message…"
          className="flex-1 bg-neutral-900 rounded-full px-4 py-2 text-sm outline-none placeholder:text-ig-subtle transition-all focus:bg-neutral-800"
        />
        {text.trim() ? (
          <button
            type="submit"
            disabled={sending}
            className="text-ig-primary font-semibold text-sm hover:text-white transition-colors disabled:opacity-50 pressable"
          >
            {sending ? "…" : "Send"}
          </button>
        ) : (
          <button type="button" className="icon-btn p-1.5 rounded-full hover:bg-neutral-900">
            <ImagePlus size={22} />
          </button>
        )}
      </form>
    </>
  );
}
