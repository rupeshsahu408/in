import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  showClose?: boolean;
  fullscreenOnMobile?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  className,
  showClose = true,
  fullscreenOnMobile = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      {showClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:opacity-70"
          aria-label="Close"
        >
          <X size={28} />
        </button>
      )}
      <div
        className={cn(
          "relative bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-2xl animate-scale-in max-h-[92vh] flex flex-col",
          fullscreenOnMobile && "max-md:rounded-none max-md:h-screen max-md:w-screen max-md:max-h-screen",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b border-neutral-800 p-3 text-center font-semibold relative">
            {title}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
