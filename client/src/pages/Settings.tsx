import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { signOut } from "../lib/firebase";
import { useLocation } from "wouter";
import { Check } from "lucide-react";

export default function Settings() {
  const { user, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [username, setUsername] = useState(user?.username || "");
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setBio(user.bio);
      setWebsite(user.website);
      setUsername(user.username);
      setIsPrivate(user.isPrivate);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  if (!user) {
    return <div className="p-8 text-ig-subtle text-center">Sign in to manage your profile.</div>;
  }

  const onAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await api<{ url: string }>("/api/upload", { method: "POST", body: fd });
      setAvatarUrl(up.url);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api("/api/users/me", {
        method: "PATCH",
        body: { fullName, bio, website, username, isPrivate, avatarUrl },
      });
      await refresh();
      setMsg({ text: "Profile saved!", ok: true });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg({ text: e.message, ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto p-4 md:p-8">
      <h1 className="text-xl font-bold mb-6">Edit profile</h1>

      {/* Avatar section */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar src={avatarUrl} size={56} />
          {uploadingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="spinner !w-4 !h-4" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold flex items-center gap-1">{username}<VerifiedBadge size={14} /></div>
          <div className="text-sm text-ig-subtle truncate">{fullName}</div>
        </div>
        <label className="bg-ig-primary hover:bg-ig-primaryHover active:brightness-90 transition-all rounded-lg text-sm font-semibold px-3 py-1.5 cursor-pointer pressable">
          {uploadingAvatar ? "Uploading…" : "Change photo"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploadingAvatar}
            onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
          />
        </label>
      </div>

      <Field label="Username">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          spellCheck={false}
        />
      </Field>
      <Field label="Name">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Website">
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          type="url"
        />
      </Field>
      <Field label="Bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={150}
          rows={3}
        />
        <div className="text-xs text-ig-subtle text-right mt-1">{bio.length} / 150</div>
      </Field>
      <Field label="Account privacy">
        <label className="flex items-center gap-3 cursor-pointer select-none pressable">
          <div
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${isPrivate ? "bg-ig-primary" : "bg-neutral-700"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isPrivate ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-sm">Private account</span>
        </label>
      </Field>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={save}
          disabled={saving || uploadingAvatar}
          className="bg-ig-primary hover:bg-ig-primaryHover active:brightness-90 transition-all rounded-lg font-semibold text-sm px-5 py-2 text-white disabled:opacity-50 pressable flex items-center gap-2"
        >
          {saving ? (
            <><span className="spinner !w-4 !h-4" /> Saving…</>
          ) : "Save"}
        </button>
        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="text-ig-danger font-semibold text-sm hover:text-red-400 transition-colors pressable"
        >
          Log out
        </button>
        {msg && (
          <span className={`text-sm flex items-center gap-1 ${msg.ok ? "text-green-400" : "text-ig-danger"}`}>
            {msg.ok && <Check size={14} />}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 grid md:grid-cols-[160px_1fr] gap-3 items-start">
      <label className="font-semibold text-sm pt-2.5">{label}</label>
      <div className="flex flex-col">
        <div className="border border-neutral-800 bg-neutral-950 hover:border-neutral-700 focus-within:border-neutral-500 rounded-lg px-3 py-2 transition-colors [&>input]:w-full [&>input]:outline-none [&>input]:bg-transparent [&>input]:text-sm [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:bg-transparent [&>textarea]:resize-none [&>textarea]:text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
