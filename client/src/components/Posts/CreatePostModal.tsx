import { useRef, useState } from "react";
import { Modal } from "../Common/Modal";
import { ImagePlus, X } from "lucide-react";
import { api } from "../../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface SelectedFile {
  file: File;
  preview: string;
}

export function CreatePostModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [step, setStep] = useState<"select" | "edit">("select");
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFiles([]);
    setCaption("");
    setLocation("");
    setStep("select");
  };

  const close = () => {
    reset();
    onClose();
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string }> => {
    const fd = new FormData();
    fd.append("file", file);
    return api("/api/upload", { method: "POST", body: fd });
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const uploaded = await Promise.all(files.map((f) => uploadFile(f.file)));
      return api("/api/posts", {
        method: "POST",
        body: {
          caption,
          location,
          media: uploaded.map((u) => ({ url: u.url, type: u.type })),
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      close();
    },
  });

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 10);
    setFiles(
      arr.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    );
    if (arr.length) setStep("edit");
  };

  if (!user) {
    return (
      <Modal open={open} onClose={close} title="Create" className="w-[420px]">
        <div className="p-6 text-center text-ig-subtle">
          Sign in to create a post.
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        step === "select" ? (
          "Create new post"
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("select")}
              className="text-sm text-white"
            >
              Back
            </button>
            <span>Create new post</span>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="text-ig-primary font-semibold text-sm disabled:opacity-50"
            >
              {createMut.isPending ? "Sharing..." : "Share"}
            </button>
          </div>
        )
      }
      className="w-[760px] max-w-[95vw] h-[560px]"
      fullscreenOnMobile
    >
      {step === "select" ? (
        <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
          <ImagePlus size={80} strokeWidth={1} />
          <div className="text-xl">Drag photos and videos here</div>
          <button
            onClick={() => fileInput.current?.click()}
            className="bg-ig-primary hover:bg-ig-primaryHover px-4 py-1.5 rounded font-semibold text-sm"
          >
            Select from computer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => onPick(e.target.files)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] h-full">
          <div className="bg-black flex items-center justify-center overflow-hidden relative">
            {files.length > 0 && (
              <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory w-full h-full">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="snap-center shrink-0 w-full h-full flex items-center justify-center relative"
                  >
                    {f.file.type.startsWith("video") ? (
                      <video
                        src={f.preview}
                        controls
                        className="max-h-full max-w-full"
                      />
                    ) : (
                      <img
                        src={f.preview}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    <button
                      onClick={() =>
                        setFiles((arr) => arr.filter((_, idx) => idx !== i))
                      }
                      className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-l border-neutral-800 p-4 flex flex-col gap-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              maxLength={2200}
              rows={6}
              className="w-full text-sm outline-none resize-none placeholder:text-ig-subtle"
            />
            <div className="text-xs text-ig-subtle text-right">
              {caption.length} / 2,200
            </div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full text-sm outline-none placeholder:text-ig-subtle border-b border-neutral-800 pb-2"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
