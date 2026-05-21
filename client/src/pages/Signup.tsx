import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import {
  sendSignInLink,
  signInWithGoogle,
  ensureFirebase,
  isFirebaseConfigured,
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { Mail, RefreshCw, ArrowLeft } from "lucide-react";

export default function Signup() {
  const { user, loading } = useAuth();

  if (!loading && user?.onboardingComplete) return <Redirect to="/" />;
  if (!loading && user && !user.onboardingComplete) return <Redirect to="/onboarding" />;

  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    ensureFirebase().then(() => setConfigured(isFirebaseConfigured()));
  }, []);

  const checkEmailExists = async (addr: string): Promise<boolean> => {
    try {
      const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
      const res = await fetch(
        `${API_BASE}/api/users/check-email?email=${encodeURIComponent(addr.toLowerCase())}`
      );
      const data = await res.json();
      return Boolean(data.exists);
    } catch {
      return false;
    }
  };

  const handleSendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr || !configured) return;
    setError("");

    setChecking(true);
    const exists = await checkEmailExists(addr);
    setChecking(false);

    if (exists) {
      setError(
        "An account with this email already exists. Please log in instead."
      );
      return;
    }

    setSubmitting(true);
    try {
      await sendSignInLink(addr);
      setStep("sent");
    } catch (e: any) {
      const msg: string = e.message || "";
      if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("operation-not-allowed")) {
        setError(
          "Email link sign-in is not enabled. Please use Google sign-in."
        );
      } else {
        setError(
          msg
            .replace("Firebase: ", "")
            .replace(/\s*\(auth\/.*?\)\.?/, "") ||
            "Failed to send link. Please try again."
        );
      }
    } finally {
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
        const msg = e.message || "";
        if (msg.includes("account-exists-with-different-credential")) {
          setError(
            "An account with this email already exists. Please log in instead."
          );
        } else {
          setError(
            msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*?\)\.?/, "") ||
              "Google sign-up failed."
          );
        }
      }
      setGoogleLoading(false);
    }
  };

  const busy = submitting || checking || googleLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="w-full max-w-[350px] flex flex-col gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl px-8 pt-8 pb-7 flex flex-col items-center gap-5 shadow-sm">
          <span
            className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent select-none"
            style={{ fontFamily: "cursive" }}
          >
            Instagram
          </span>

          {step === "email" ? (
            <>
              <p className="text-gray-600 text-sm text-center leading-snug">
                Sign up to see photos and videos from your friends.
              </p>

              {/* ── Google ───────────────────────────────── */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy || configured === false}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all rounded-xl py-2.5 font-semibold text-sm text-gray-800 disabled:opacity-40"
              >
                {googleLoading ? (
                  <Spinner className="border-gray-300 border-t-gray-700" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <Divider />

              {/* ── Email link form ───────────────────────── */}
              <form
                onSubmit={handleSendLink}
                className="w-full flex flex-col gap-2.5"
              >
                <FloatingInput
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                  autoComplete="email"
                  disabled={busy}
                  required
                />

                {error && <ErrorBox>{error}</ErrorBox>}

                <button
                  type="submit"
                  disabled={busy || !email.trim() || configured === false}
                  className="w-full bg-[#0095F6] hover:bg-[#1877F2] active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl py-2.5 font-semibold text-sm text-white flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <Spinner className="border-white/30 border-t-white" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {checking
                    ? "Checking…"
                    : submitting
                    ? "Sending…"
                    : "Send verification link"}
                </button>

                {configured === false && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                    Firebase is not configured. Email sign-up is unavailable.
                  </p>
                )}

                <p className="text-xs text-gray-400 text-center">
                  We'll send a secure link to verify your email.
                </p>
              </form>
            </>
          ) : (
            /* ── Email sent ──────────────────────────────── */
            <div className="flex flex-col items-center gap-4 w-full text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Mail className="w-7 h-7 text-[#0095F6]" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-1">
                  Check your email
                </h2>
                <p className="text-sm text-gray-500">
                  We sent a verification link to
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
                  {email}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 w-full text-xs text-blue-700 leading-relaxed">
                Click the link in your email to verify your account. It will
                open the app and continue your setup.
              </div>

              <button
                type="button"
                onClick={() => handleSendLink()}
                disabled={submitting}
                className="flex items-center gap-1.5 text-sm text-[#0095F6] hover:underline disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {submitting ? "Sending…" : "Resend link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* ── Log in link ───────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center text-sm shadow-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link
            href="/login"
            className="text-[#0095F6] font-semibold hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Shared UI primitives ──────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2.1 3.9-3.9 5.2l6.2 5.2C40.7 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`w-4 h-4 border-2 rounded-full shrink-0 ${className}`}
      style={{ animation: "spin 0.7s linear infinite" }}
    />
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium tracking-wide">
        OR
      </span>
      <span className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function FloatingInput({
  type = "text",
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  required,
}: {
  type?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className="peer w-full border border-gray-200 focus:border-gray-400 rounded-xl px-3 pt-4 pb-2 text-sm bg-gray-50 focus:bg-white outline-none transition-colors text-gray-900 placeholder-transparent disabled:opacity-60"
      />
      <label className="absolute left-3 top-1 text-[10px] text-gray-400 peer-placeholder-shown:top-[11px] peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-[10px] transition-all pointer-events-none">
        {label}
      </label>
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl p-2.5 text-center leading-relaxed">
      {children}
    </p>
  );
}
