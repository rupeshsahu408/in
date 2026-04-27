import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  Camera,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../Common/Avatar";
import { CreatePostModal } from "../Posts/CreatePostModal";
import { cn } from "../../lib/utils";

function NavItem({
  to,
  active,
  icon,
  label,
  onClick,
  collapsed,
}: {
  to?: string;
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 px-3 py-3 rounded-lg w-full hover:bg-neutral-900 transition",
        active && "font-bold"
      )}
    >
      <span className={cn(active && "scale-110")}>{icon}</span>
      {!collapsed && <span className="text-base">{label}</span>}
    </div>
  );
  if (to) {
    return (
      <Link href={to} className="block">{inner}</Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const isMessages = location.startsWith("/messages") && location !== "/messages";
  const collapsed = location.startsWith("/messages") || location.startsWith("/explore") || location.startsWith("/search");

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-neutral-800 fixed left-0 top-0 bottom-0 z-30 transition-all bg-black",
          collapsed ? "w-[72px] px-2" : "w-[244px] px-3",
          "py-6"
        )}
      >
        <Link href="/" className="px-3 mb-8 block">
            {collapsed ? (
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 00-2.13 1.38A5.86 5.86 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.86 5.86 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.73 2.13-1.38a5.86 5.86 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 00-1.38-2.13A5.86 5.86 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.41-10.4a1.44 1.44 0 100-2.88 1.44 1.44 0 000 2.88z" />
              </svg>
            ) : (
              <span className="logo-font text-3xl">Instagram</span>
            )}
          </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <NavItem to="/" active={location === "/"} icon={<Home size={26} />} label="Home" collapsed={collapsed} />
          <NavItem to="/search" active={location === "/search"} icon={<Search size={26} />} label="Search" collapsed={collapsed} />
          <NavItem to="/explore" active={location === "/explore"} icon={<Compass size={26} />} label="Explore" collapsed={collapsed} />
          <NavItem to="/reels" active={location === "/reels"} icon={<Film size={26} />} label="Reels" collapsed={collapsed} />
          <NavItem to="/messages" active={location.startsWith("/messages")} icon={<MessageCircle size={26} />} label="Messages" collapsed={collapsed} />
          <NavItem to="/notifications" active={location === "/notifications"} icon={<Heart size={26} />} label="Notifications" collapsed={collapsed} />
          <NavItem
            onClick={() => setCreating(true)}
            icon={<PlusSquare size={26} />}
            label="Create"
            collapsed={collapsed}
          />
          {user && (
            <NavItem
              to={`/u/${user.username}`}
              active={location === `/u/${user.username}`}
              icon={
                <Avatar src={user.avatarUrl} size={26} />
              }
              label="Profile"
              collapsed={collapsed}
            />
          )}
        </nav>

        <NavItem
          to="/settings"
          icon={<Menu size={26} />}
          label="More"
          collapsed={collapsed}
        />
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-black border-b border-neutral-900 safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          <Link href="/messages" aria-label="Camera">
              <Camera size={24} />
            </Link>
          <Link href="/" className="logo-font text-2xl">Instagram</Link>
          <div className="flex items-center gap-4">
            <Link href="/notifications" aria-label="Notifications"><Heart size={24} /></Link>
            <Link href="/messages" aria-label="Messages"><MessageCircle size={24} /></Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        className={cn(
          "flex-1 min-w-0 transition-all",
          collapsed ? "md:ml-[72px]" : "md:ml-[244px]",
          "pt-12 md:pt-0",
          isMessages ? "" : "pb-14 md:pb-0"
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-black border-t border-neutral-900 safe-bottom">
        <div className="grid grid-cols-5 h-12">
          <Link href="/" className="flex items-center justify-center"><Home size={26} className={location === "/" ? "fill-white" : ""} /></Link>
          <Link href="/search" className="flex items-center justify-center"><Search size={26} /></Link>
          <button onClick={() => setCreating(true)} className="flex items-center justify-center"><PlusSquare size={26} /></button>
          <Link href="/reels" className="flex items-center justify-center"><Film size={26} /></Link>
          {user ? (
            <Link href={`/u/${user.username}`} className="flex items-center justify-center">
              <Avatar src={user.avatarUrl} size={26} />
            </Link>
          ) : (
            <Link href="/login" className="flex items-center justify-center">
              <Avatar size={26} />
            </Link>
          )}
        </div>
      </nav>

      <CreatePostModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
