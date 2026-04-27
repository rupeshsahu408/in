import { cn } from "../../lib/utils";

interface Props {
  src?: string | null;
  alt?: string;
  size?: number;
  ring?: "none" | "story" | "seen";
  className?: string;
  onClick?: () => void;
}

export function Avatar({ src, alt = "", size = 32, ring = "none", className, onClick }: Props) {
  const inner = (
    <div
      className={cn(
        "rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-neutral-400",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-3/4 h-3/4" fill="currentColor">
          <path d="M12 12.5a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5zM4 20.5a8 8 0 0116 0V21H4v-.5z" />
        </svg>
      )}
    </div>
  );
  if (ring === "none")
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0"
        style={{ display: "inline-block" }}
      >
        {inner}
      </button>
    );
  return (
    <button type="button" onClick={onClick} className="shrink-0">
      <div className={ring === "story" ? "story-ring" : "story-ring-seen"}>
        <div className="bg-black rounded-full p-[2px]">{inner}</div>
      </div>
    </button>
  );
}
