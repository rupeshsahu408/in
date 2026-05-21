import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { Eye, EyeOff, Check, X, Loader2, Camera, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  completeEmailSignIn,
  isEmailLinkUrl,
  setFirebasePassword,
  getCurrentProvider,
  getIdToken,
  ensureFirebase,
} from "../lib/firebase";
import { api } from "../lib/api";

type StepId = "verifying" | "username" | "password" | "bio" | "photo" | "welcome";

// Real steps shown in progress bar (not verifying or welcome)
const PROGRESS_STEPS: StepId[] = ["username", "password", "bio", "photo"];

function ProgressDots({ steps, current }: { steps: StepId[]; current: StepId }) {
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`rounded-full transition-all ${
            i < idx ? "w-2 h-2 bg-gray-900" :
            i === idx ? "w-5 h-2 bg-gray-900" :
            "w-2 h-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();

  // Detect email link callback from URL params (no Firebase needed for this check)
  const [isEmailLink] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signIn" && params.has("oobCode");
  });

  const [step, setStep] = useState<StepId>(isEmailLink ? "verifying" : "username");
  const [verifyError, setVerifyError] = useState("");

  // Form fields
  const [username, setUsername] = useState("");
  const [uStatus, setUStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [uMsg, setUMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [welcomeDone, setWelcomeDone] = useState(false);

  const checkRef = useRef<ReturnType<typeof setTimeout>>();
  const fileRef = useRef<HTMLInputElement>(null);

  // Redirect if already onboarded
  if (!loading && user?.onboardingComplete) return <Redirect to="/" />;

  // If no email link and no auth, send to signup
  if (!loading && !user && !isEmailLink && step !== "verifying") {
    return <Redirect to="/signup" />;
  }

  // Pre-fill fields from existing user record (auto-generated values from sync)
  useEffect(() => {
    if (user) {
      if (!username) setUsername(user.username);
      if (!bio && user.bio) setBio(user.bio);
      if (!avatarUrl && user.avatarUrl) { setAvatarUrl(user.avatarUrl); setAvatarPreview(user.avatarUrl); }
    }
  }, [user]);

  // Handle email link verification
  useEffect(() => {
    if (!isEmailLink) return;
    ensureFirebase().then(() => {
      const href = window.location.href;
      if (!isEmailLinkUrl(href)) {
        setVerifyError("This link is invalid or has expired. Please try signing up again.");
        return;
      }
      const email = localStorage.getItem("emailForSignIn") || "";
      if (!email) {
        setVerifyError("We couldn't find your email. Please request a new verification link.");
        return;
      }
      completeEmailSignIn(email, href)
        .then(() => {
          window.history.replaceState({}, "", "/onboarding");
          localStorage.removeItem("emailForSignIn");
          // useAuth will update when onAuthStateChanged + sync fires
        })
        .catch((e) => {
          const code = e.code || "";
          const msg =
            code === "auth/invalid-action-code" ? "This link has expired or already been used. Please request a new one." :
            code === "auth/account-exists-with-different-credential" ? "An account with this email already exists. Try logging in instead." :
            code === "auth/email-already-in-use" ? "This email is already registered. Please log in." :
            e.message?.replace("Firebase: ", "").replace(/\s*\(auth\/.*?\)\.?/, "") || "Verification failed. Please try again.";
          setVerifyError(msg);
        });
    });
  }, []);

  // After verifying step: move to username when user auth resolves
  useEffect(() => {
    if (step === "verifying" && !loading && user) {
      setStep("username");
    }
  }, [user, loading, step]);

  // After welcome step: save and auto-redirect
  useEffect(() => {
    if (step === "welcome") {
      handleComplete();
    }
  }, [step]);

  // ── Username real-time check ───────────────────────────────────────────────
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUStatus("idle");
    setUMsg("");
    clearTimeout(checkRef.current);

    const clean = val.toLowerCase().replace(/[^a-z0-9._]/g, "");
    if (val !== clean) setUMsg(`Will be saved as: ${clean || "…"}`);
    if (!clean) { return; }
    if (clean.length < 3) { setUStatus("invalid"); setUMsg("At least 3 characters"); return; }
    if (clean.length > 30) { setUStatus("invalid"); setUMsg("30 characters max"); return; }
    if (!/^[a-z0-9]/.test(clean)) { setUStatus("invalid"); setUMsg("Must start with a letter or number"); return; }

    // If unchanged from current DB username, mark as ok immediately
    if (user && clean === user.username) { setUStatus("ok"); setUMsg(""); return; }

    setUStatus("checking");
    checkRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/users/check-username?u=${encodeURIComponent(clean)}`);
        const d = await r.json();
        setUStatus(d.available ? "ok" : "taken");
        setUMsg(d.available ? "" : "This username is already taken");
      } catch {
        setUStatus("idle");
      }
    }, 500);
  };

  // ── Password helpers ───────────────────────────────────────────────────────
  const pwStrength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"][pwStrength];

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (data.url) setAvatarUrl(data.url);
    } catch {
      // keep preview, upload URL stays empty (will retry on complete)
    } finally {
      setUploading(false);
    }
  };

  // ── Final save ─────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const isGoogle = getCurrentProvider() === "google.com";
      if (!isGoogle && password) {
        await setFirebasePassword(password);
      }
      await api("/api/users/me", {
        method: "PATCH",
        body: {
          username: username.toLowerCase().replace(/[^a-z0-9._]/g, ""),
          bio,
          avatarUrl,
          onboardingComplete: true,
        },
      });
      await refresh();
      setWelcomeDone(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  // ── Step navigation ────────────────────────────────────────────────────────
  const advance = () => {
    const isGoogle = getCurrentProvider() === "google.com";
    if (step === "username") {
      setStep(isGoogle ? "bio" : "password");
    } else if (step === "password") {
      setStep("bio");
    } else if (step === "bio") {
      setStep("photo");
    } else if (step === "photo") {
      setStep("welcome");
    }
  };

  // Determine visible progress steps
  const isGoogle = getCurrentProvider() === "google.com";
  const visibleSteps: StepId[] = isGoogle
    ? ["username", "bio", "photo"]
    : ["username", "password", "bio", "photo"];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent" style={{ fontFamily: "cursive" }}>
        Instagram
      </Link>

      <div className="w-full max-w-[400px]">
        {/* ── VERIFYING ─────────────────────────────────────────────────── */}
        {step === "verifying" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            {!verifyError ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[#0095F6] animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Verifying your email</h2>
                  <p className="text-sm text-gray-500">Just a moment while we confirm your account…</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Verification failed</h2>
                  <p className="text-sm text-gray-500">{verifyError}</p>
                </div>
                <Link href="/signup" className="mt-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors">
                  Try again
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── USERNAME ──────────────────────────────────────────────────── */}
        {step === "username" && (
          <div>
            {visibleSteps.length > 1 && <ProgressDots steps={visibleSteps} current="username" />}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your username</h2>
              <p className="text-sm text-gray-500">Pick a unique username people will know you by. You can always change this later.</p>
            </div>
            <div className="relative mb-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</div>
              <input
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                autoFocus
                autoComplete="off"
                className={`w-full border rounded-xl pl-8 pr-10 py-3 text-sm outline-none transition-colors bg-gray-50 focus:bg-white text-gray-900 ${
                  uStatus === "ok" ? "border-green-400 focus:border-green-400" :
                  uStatus === "taken" || uStatus === "invalid" ? "border-red-400 focus:border-red-400" :
                  "border-gray-200 focus:border-gray-400"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {uStatus === "checking" && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {uStatus === "ok" && <Check className="w-4 h-4 text-green-500" />}
                {(uStatus === "taken" || uStatus === "invalid") && <X className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {uMsg && (
              <p className={`text-xs mt-1 mb-4 ${uStatus === "ok" ? "text-green-600" : uStatus === "taken" || uStatus === "invalid" ? "text-red-500" : "text-gray-500"}`}>
                {uMsg}
              </p>
            )}
            <button
              onClick={advance}
              disabled={uStatus !== "ok" || !username.trim()}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── PASSWORD ──────────────────────────────────────────────────── */}
        {step === "password" && (
          <div>
            {visibleSteps.length > 1 && <ProgressDots steps={visibleSteps} current="password" />}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a password</h2>
              <p className="text-sm text-gray-500">Use at least 6 characters with a mix of letters and numbers.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoFocus
                  className="w-full border border-gray-200 focus:border-gray-400 rounded-xl px-4 py-3 pr-10 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className={`flex-1 h-1 rounded-full transition-all ${pwStrength >= n ? strengthColor : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{strengthLabel}</span>
                </div>
              )}

              <div className="relative">
                <input
                  type={showCpw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 ${
                    confirmPw && confirmPw !== password ? "border-red-400" : "border-gray-200 focus:border-gray-400"
                  }`}
                />
                <button type="button" onClick={() => setShowCpw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPw && confirmPw !== password && (
                <p className="text-xs text-red-500 -mt-1">Passwords don't match</p>
              )}
            </div>
            <button
              onClick={advance}
              disabled={password.length < 6 || password !== confirmPw}
              className="w-full mt-5 bg-gray-900 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── BIO ───────────────────────────────────────────────────────── */}
        {step === "bio" && (
          <div>
            {visibleSteps.length > 1 && <ProgressDots steps={visibleSteps} current="bio" />}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a bio</h2>
              <p className="text-sm text-gray-500">Tell people a little about yourself. You can always change this later.</p>
            </div>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Write something about yourself…"
                rows={4}
                autoFocus
                className="w-full border border-gray-200 focus:border-gray-400 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 resize-none"
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">{bio.length}/150</span>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={advance}
                className="w-full bg-gray-900 hover:bg-gray-700 transition-all rounded-xl py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
              >
                {bio.trim() ? <><Check className="w-4 h-4" /> Add bio</> : <><ChevronRight className="w-4 h-4" /> Continue</>}
              </button>
              {!bio.trim() && (
                <button onClick={advance} className="text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors">
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── PHOTO ─────────────────────────────────────────────────────── */}
        {step === "photo" && (
          <div>
            {visibleSteps.length > 1 && <ProgressDots steps={visibleSteps} current="photo" />}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a profile photo</h2>
              <p className="text-sm text-gray-500">Choose a photo so people can recognize you. You can change it anytime.</p>
            </div>

            <div className="flex flex-col items-center gap-5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-500 transition-colors group focus:outline-none"
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1.5">
                    {uploading ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : <Camera className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-400">{uploading ? "Uploading…" : "Add photo"}</span>
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

              <div className="flex flex-col gap-2 w-full">
                {avatarPreview ? (
                  <button
                    onClick={advance}
                    disabled={uploading}
                    className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 transition-all rounded-xl py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {uploading ? "Uploading…" : "Use this photo"}
                  </button>
                ) : null}
                <button
                  onClick={advance}
                  disabled={uploading}
                  className={`w-full py-3 font-semibold text-sm rounded-xl transition-colors ${
                    avatarPreview
                      ? "text-gray-500 hover:text-gray-700"
                      : "bg-gray-900 hover:bg-gray-700 text-white"
                  }`}
                >
                  {avatarPreview ? "Skip for now" : "Skip for now →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WELCOME ───────────────────────────────────────────────────── */}
        {step === "welcome" && (
          <div className="flex flex-col items-center text-center gap-6 py-8">
            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    left: `${5 + (i * 4.7) % 90}%`,
                    top: "-8px",
                    background: ["#f472b6","#a78bfa","#60a5fa","#34d399","#fbbf24","#f87171"][i % 6],
                    animation: `confetti-fall ${1.5 + (i * 0.13) % 2}s ${(i * 0.11) % 1.5}s ease-in forwards`,
                    transform: `rotate(${i * 23}deg)`,
                  }}
                />
              ))}
            </div>

            {/* Animated check */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #ec4899, #f97316)",
                animation: "welcome-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>

            <div>
              <h2
                className="text-3xl font-bold text-gray-900 mb-2"
                style={{ animation: "welcome-fade 0.6s 0.3s ease-out both" }}
              >
                Welcome to Instagram!
              </h2>
              <p
                className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"
                style={{ animation: "welcome-fade 0.6s 0.5s ease-out both" }}
              >
                @{username.toLowerCase().replace(/[^a-z0-9._]/g, "")}
              </p>
              <p
                className="text-sm text-gray-500 mt-2"
                style={{ animation: "welcome-fade 0.6s 0.7s ease-out both" }}
              >
                Your account is all set. Let's start exploring!
              </p>
            </div>

            {saveError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {saveError} —{" "}
                <button onClick={handleComplete} className="underline">Retry</button>
              </p>
            )}

            <button
              onClick={() => navigate("/")}
              disabled={!welcomeDone}
              className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold text-sm rounded-full transition-all"
              style={{ animation: "welcome-fade 0.6s 0.9s ease-out both" }}
            >
              {!welcomeDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {welcomeDone ? "Explore your feed" : "Setting up your account…"}
            </button>

            {!welcomeDone && saving && (
              <p className="text-xs text-gray-400" style={{ animation: "welcome-fade 0.6s 1s ease-out both" }}>
                Redirecting in a moment…
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(540deg); opacity: 0; }
        }
        @keyframes welcome-pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes welcome-fade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
