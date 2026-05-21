import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  ensureFirebase,
  isFirebaseConfigured,
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

type Mode = "in" | "up" | "reset";

export default function Login() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  /* Read ?signup=1 from URL to pre-select sign-up mode */
  const signup = new URLSearchParams(window.location.search).get("signup") === "1";
  const [mode, setMode] = useState<Mode>(signup ? "up" : "in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    ensureFirebase().then(() => setConfigured(isFirebaseConfigured()));
  }, []);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox.");
      } else if (mode === "in") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (e: any) {
      setError(
        e.message?.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)\.?/, "") ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!configured) return;
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message?.replace("Firebase: ", "") || "Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setName("");
  };

  const isReady = configured === true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      {/* Back to landing */}
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <div className="flex flex-col md:flex-row items-center justify-center gap-10 w-full max-w-[900px]">
        {/* Left decorative panel */}
        <div className="hidden md:flex flex-col items-center justify-center flex-shrink-0">
          <div className="relative w-[280px] h-[420px]">
            <div className="absolute inset-0 rounded-[2.5rem] p-[2px]"
              style={{ background: "linear-gradient(135deg, #feda77, #f58529, #dd2a7b, #8134af, #515bd4)" }}>
              <div className="w-full h-full rounded-[2.4rem] bg-white flex flex-col items-center justify-center gap-4 p-6 shadow-inner">
                <span
                  className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"
                  style={{ fontFamily: "cursive" }}
                >
                  Instagram
                </span>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #feda77, #f58529, #dd2a7b, #8134af)" }}
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full bg-gray-100"
                      style={{ width: `${60 + i * 13}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[360px] flex flex-col gap-3">
          <div className="border border-gray-200 rounded-2xl px-10 py-8 flex flex-col items-center gap-5 bg-white shadow-sm">
            {/* Logo */}
            <div
              className="text-5xl font-bold mb-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"
              style={{ fontFamily: "cursive" }}
            >
              Instagram
            </div>

            {configured === false && (
              <div className="w-full text-xs text-amber-700 text-center bg-amber-50 border border-amber-200 rounded-xl p-3">
                Firebase isn't configured. Login is unavailable.
              </div>
            )}

            <p className="text-gray-500 text-sm text-center leading-snug">
              {mode === "reset"
                ? "Enter your email to receive a password reset link."
                : mode === "in"
                ? "Sign in to see photos and videos from your friends."
                : "Sign up to see photos and videos from your friends."}
            </p>

            {mode !== "reset" && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={!isReady || googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#0095F6] hover:bg-[#1877F2] active:brightness-90 transition-all rounded-xl py-2.5 font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2.1 3.9-3.9 5.2l6.2 5.2C40.7 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
                    </svg>
                  )}
                  {googleLoading ? "Signing in…" : "Continue with Google"}
                </button>

                <div className="flex items-center gap-3 w-full">
                  <span className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR</span>
                  <span className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
              {mode === "up" && (
                <div className="relative">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=" "
                    autoComplete="name"
                    className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent"
                  />
                  <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                    Full name
                  </label>
                </div>
              )}

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  autoComplete="email"
                  className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent"
                />
                <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                  Email address
                </label>
              </div>

              {mode !== "reset" && (
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    required
                    minLength={6}
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                    className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent"
                  />
                  <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                    Password
                  </label>
                </div>
              )}

              {mode === "in" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-xs text-[#0095F6] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!isReady || loading}
                className="w-full bg-[#0095F6] hover:bg-[#1877F2] active:brightness-90 transition-all rounded-xl font-semibold text-sm py-2.5 mt-1 text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      style={{ animation: "spin 0.7s linear infinite" }} />
                    {mode === "reset" ? "Sending…" : mode === "in" ? "Logging in…" : "Creating account…"}
                  </>
                ) : configured === null ? (
                  "Loading…"
                ) : mode === "reset" ? (
                  "Send reset link"
                ) : mode === "in" ? (
                  "Log in"
                ) : (
                  "Sign up"
                )}
              </button>

              {mode === "reset" && (
                <button
                  type="button"
                  onClick={() => switchMode("in")}
                  className="text-xs text-gray-400 hover:text-gray-700 text-center mt-1 transition-colors"
                >
                  ← Back to login
                </button>
              )}
            </form>

            {error && (
              <div className="w-full text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded-xl p-2.5">
                {error}
              </div>
            )}
            {success && (
              <div className="w-full text-xs text-green-700 text-center bg-green-50 border border-green-200 rounded-xl p-2.5">
                {success}
              </div>
            )}
          </div>

          {/* Switch card */}
          {mode !== "reset" && (
            <div className="border border-gray-200 rounded-2xl p-5 text-center text-sm bg-white shadow-sm">
              {mode === "in" ? (
                <>
                  <span className="text-gray-500">Don't have an account? </span>
                  <button
                    onClick={() => switchMode("up")}
                    className="text-[#0095F6] font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-500">Already have an account? </span>
                  <button
                    onClick={() => switchMode("in")}
                    className="text-[#0095F6] font-semibold hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          )}

          {/* App store */}
          <div className="text-center mt-1">
            <p className="text-xs text-gray-400 mb-3">Get the app.</p>
            <div className="flex items-center justify-center gap-2">
              <div className="border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="#1c1c1e" className="w-4 h-4">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-xs text-gray-800 font-medium">App Store</span>
              </div>
              <div className="border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="#1c1c1e" className="w-4 h-4">
                  <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-12.6-3.56-3.56L3.18 23.76zm17.61-9.45l-2.4-1.38-3.37 3.37 3.38 3.38 2.39-1.39c.68-.39 1.13-1.12 1.13-1.99s-.45-1.6-1.13-1.99zM2.01 1.05c-.05.18-.08.37-.08.58v20.74c0 .21.03.4.08.58l12.87-12.87L2.01 1.05zm11.09 11.1L2.01 1.05l11.09 11.1z" />
                </svg>
                <span className="text-xs text-gray-800 font-medium">Google Play</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
