import { useState } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { signInWithGoogle, signInWithEmail, resetPassword, ensureFirebase, isFirebaseConfigured } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  if (!loading && user && user.onboardingComplete) return <Redirect to="/" />;
  if (!loading && user && !user.onboardingComplete) return <Redirect to="/onboarding" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Enter your username"); return; }
    if (!password) { setError("Enter your password"); return; }
    setSubmitting(true);
    try {
      await ensureFirebase();
      if (!isFirebaseConfigured()) { setError("Authentication is not configured"); setSubmitting(false); return; }
      const res = await fetch(`/api/users/email-by-username?username=${encodeURIComponent(username.trim().toLowerCase())}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "No account found with that username");
      }
      const { email } = await res.json();
      await signInWithEmail(email, password);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential") || msg.includes("INVALID_LOGIN_CREDENTIALS")) {
        setError("Incorrect password. Please try again.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*?\)\.?/, "") || "Login failed");
      }
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (!e.message?.includes("popup-closed")) {
        setError(e.message?.replace("Firebase: ", "") || "Google sign-in failed");
      }
      setGoogleLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (e: any) {
      setError(e.message?.replace("Firebase: ", "").replace(/\s*\(auth\/.*?\)\.?/, "") || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Link href="/" className="fixed top-5 left-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <div className="w-full max-w-[350px] flex flex-col gap-3">
        {!forgotMode ? (
          <>
            {/* Main login card */}
            <div className="bg-white border border-gray-200 rounded-2xl px-8 py-8 flex flex-col items-center gap-5 shadow-sm">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent" style={{ fontFamily: "cursive" }}>
                Instagram
              </span>
              <p className="text-gray-500 text-sm text-center leading-snug font-medium">
                Sign in to see photos and videos from your friends.
              </p>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all rounded-xl py-2.5 font-semibold text-sm text-gray-800 disabled:opacity-40"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-700 rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2.1 3.9-3.9 5.2l6.2 5.2C40.7 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 w-full">
                <span className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium tracking-wide">OR</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Username + password form */}
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-2.5">
                <div className="relative">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=" "
                    autoComplete="username"
                    disabled={submitting}
                    className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent disabled:opacity-60"
                  />
                  <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-[11px] peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                    Username
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    autoComplete="current-password"
                    disabled={submitting}
                    className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 pr-10 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent disabled:opacity-60"
                  />
                  <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-[11px] peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                    Password
                  </label>
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right -mt-1">
                  <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(""); setForgotSent(false); setError(""); }} className="text-xs text-[#0095F6] hover:underline">
                    Forgot password?
                  </button>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting || !username.trim() || !password}
                  className="w-full bg-[#0095F6] hover:bg-[#1877F2] active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl py-2.5 font-semibold text-sm text-white flex items-center justify-center gap-2"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : null}
                  {submitting ? "Logging in…" : "Log in"}
                </button>
              </form>
            </div>

            {/* Sign up link */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center text-sm shadow-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <Link href="/signup" className="text-[#0095F6] font-semibold hover:underline">Sign up</Link>
            </div>
          </>
        ) : (
          /* Forgot password card */
          <div className="bg-white border border-gray-200 rounded-2xl px-8 py-8 flex flex-col items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full border-2 border-gray-900 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="font-bold text-gray-900 text-lg mb-1">Trouble logging in?</h2>
              <p className="text-sm text-gray-500">Enter your email address and we'll send you a link to get back into your account.</p>
            </div>
            {forgotSent ? (
              <div className="w-full text-center">
                <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  Reset link sent! Check your inbox.
                </div>
                <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="text-sm text-[#0095F6] hover:underline">Back to login</button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder=" "
                    required
                    className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent"
                  />
                  <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-[11px] peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
                    Email address
                  </label>
                </div>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button type="submit" disabled={forgotLoading || !forgotEmail} className="w-full bg-[#0095F6] hover:bg-[#1877F2] disabled:opacity-40 transition-all rounded-xl py-2.5 font-semibold text-sm text-white">
                  {forgotLoading ? "Sending…" : "Send reset link"}
                </button>
                <div className="flex items-center gap-3">
                  <span className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <span className="flex-1 h-px bg-gray-200" />
                </div>
                <Link href="/signup" className="text-center text-sm font-semibold text-gray-700 hover:text-gray-900">Create new account</Link>
                <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-gray-500 hover:text-gray-700 text-center mt-1">Back to login</button>
              </form>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
