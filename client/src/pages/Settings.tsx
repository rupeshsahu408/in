import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Avatar } from "../components/Common/Avatar";
import { signOut } from "../lib/firebase";
import { useLocation } from "wouter";

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
  const [msg, setMsg] = useState("");

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
    const fd = new FormData();
    fd.append("file", file);
    const up = await api<{ url: string }>("/api/upload", { method: "POST", body: fd });
    setAvatarUrl(up.url);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api("/api/users/me", {
        method: "PATCH",
        body: { fullName, bio, website, username, isPrivate, avatarUrl },
      });
      await refresh();
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto p-4 md:p-8">
      <h1 className="text-xl font-bold mb-6">Edit profile</h1>
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 mb-6">
        <Avatar src={avatarUrl} size={56} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{username}</div>
          <div className="text-sm text-ig-subtle">{fullName}</div>
        </div>
        <label className="bg-ig-primary hover:bg-ig-primaryHover rounded text-sm font-semibold px-3 py-1.5 cursor-pointer">
          Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
          />
        </label>
      </div>

      <Field label="Username">
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Name">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Website">
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Bio">
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} rows={3} />
        <div className="text-xs text-ig-subtle text-right">{bio.length} / 150</div>
      </Field>
      <Field label="Account privacy">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <span>Private account</span>
        </label>
      </Field>

      <div className="flex gap-3 mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="bg-ig-primary hover:bg-ig-primaryHover rounded font-semibold text-sm px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="text-ig-danger font-semibold text-sm"
        >
          Log out
        </button>
        {msg && <span className="text-sm text-ig-subtle self-center">{msg}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 grid md:grid-cols-[160px_1fr] gap-3 items-start">
      <label className="font-semibold text-sm pt-2">{label}</label>
      <div className="flex flex-col gap-1">
        <div className="border border-neutral-800 bg-neutral-950 rounded px-3 py-2 [&>input]:w-full [&>input]:outline-none [&>input]:bg-transparent [&>textarea]:w-full [&>textarea]:outline-none [&>textarea]:bg-transparent [&>textarea]:resize-none">
          {children}
        </div>
      </div>
    </div>
  );
}
