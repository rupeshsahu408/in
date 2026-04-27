import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  ensureFirebase,
  isFirebaseConfigured,
} from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    ensureFirebase().then(() => setConfigured(isFirebaseConfigured()));
  }, []);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "in") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password, name);
    } catch (e: any) {
      setError(e.message?.replace("Firebase: ", "") || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 px-4 bg-black">
      <div className="hidden md:block">
        <div className="w-[380px] h-[580px] rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 p-1">
          <div className="w-full h-full rounded-3xl bg-black flex items-center justify-center">
            <span className="logo-font text-6xl text-white">Instagram</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[350px] flex flex-col gap-3">
        <div className="border border-neutral-800 rounded-md p-8 flex flex-col items-center gap-4 bg-black">
          <div className="logo-font text-5xl mt-3 mb-4">Instagram</div>
          {configured === false && (
            <div className="text-xs text-yellow-500 text-center bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
              Firebase isn't configured yet. Add your Firebase Web SDK keys to enable login.
            </div>
          )}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
            {mode === "up" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="border border-neutral-700 rounded px-2 py-2 text-xs bg-neutral-950"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="border border-neutral-700 rounded px-2 py-2 text-xs bg-neutral-950"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="border border-neutral-700 rounded px-2 py-2 text-xs bg-neutral-950"
            />
            <button
              type="submit"
              disabled={loading || !configured}
              className="bg-ig-primary hover:bg-ig-primaryHover rounded font-semibold text-sm py-1.5 mt-2 disabled:opacity-50"
            >
              {loading ? "..." : mode === "in" ? "Log in" : "Sign up"}
            </button>
          </form>
          <div className="flex items-center gap-3 my-2 w-full">
            <span className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-ig-subtle">OR</span>
            <span className="flex-1 h-px bg-neutral-800" />
          </div>
          <button
            disabled={!configured}
            onClick={async () => {
              setError("");
              try {
                await signInWithGoogle();
              } catch (e: any) {
                setError(e.message || "Google sign in failed");
              }
            }}
            className="text-blue-300 font-semibold text-sm flex items-center gap-2 hover:opacity-80 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2.1 3.9-3.9 5.2l6.2 5.2C40.7 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Log in with Google
          </button>
          {error && <div className="text-xs text-ig-danger text-center">{error}</div>}
        </div>
        <div className="border border-neutral-800 rounded-md p-5 text-center text-sm bg-black">
          {mode === "in" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("up")} className="text-ig-primary font-semibold">
                Sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button onClick={() => setMode("in")} className="text-ig-primary font-semibold">
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
