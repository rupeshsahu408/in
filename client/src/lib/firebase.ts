import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
} from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let configured = false;
let initPromise: Promise<void> | null = null;

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function initFromViteVars(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) return false;
  try {
    app = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId,
    });
    auth = getAuth(app);
    configured = true;
    return true;
  } catch {
    return false;
  }
}

async function initFromApi(): Promise<void> {
  if (!API_BASE) return;
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (!res.ok) return;
    const cfg = await res.json();
    if (cfg.firebase?.configured && cfg.firebase.apiKey) {
      app = initializeApp({
        apiKey: cfg.firebase.apiKey,
        authDomain: cfg.firebase.authDomain,
        projectId: cfg.firebase.projectId,
        appId: cfg.firebase.appId,
        storageBucket: cfg.firebase.storageBucket,
        messagingSenderId: cfg.firebase.messagingSenderId,
      });
      auth = getAuth(app);
      configured = true;
    }
  } catch {
    // silently fail
  }
}

export async function ensureFirebase(): Promise<{ app: FirebaseApp | null; auth: Auth | null; configured: boolean }> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!initFromViteVars()) {
        await initFromApi();
      }
    })();
  }
  await initPromise;
  return { app, auth, configured };
}

export function getAuthInstance() { return auth; }
export function isFirebaseConfigured() { return configured; }

export async function getIdToken(): Promise<string | null> {
  await ensureFirebase();
  if (!auth?.currentUser) return null;
  try { return await auth.currentUser.getIdToken(); } catch { return null; }
}

/** Returns the first sign-in provider ID for the current user ('google.com', 'password', 'emailLink', etc.) */
export function getCurrentProvider(): string | null {
  if (!auth?.currentUser) return null;
  return auth.currentUser.providerData[0]?.providerId ?? null;
}

// ─── Email Link (magic link / passwordless) ──────────────────────────────────

/** Sends a sign-in link to the given email. Saves the email to localStorage. */
export async function sendSignInLink(email: string): Promise<void> {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  const actionCodeSettings = {
    url: `${window.location.origin}/onboarding`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem("emailForSignIn", email);
}

/** Returns true if the current URL is a Firebase email sign-in link. */
export function isEmailLinkUrl(href: string): boolean {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, href);
}

/** Completes sign-in with email link. Call with the saved email + window.location.href. */
export async function completeEmailSignIn(email: string, href: string) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  return signInWithEmailLink(auth, email, href);
}

/** Sets (or updates) the password for the currently signed-in Firebase user. */
export async function setFirebasePassword(password: string): Promise<void> {
  await ensureFirebase();
  if (!auth?.currentUser) throw new Error("Not authenticated");
  await updatePassword(auth.currentUser, password);
}

// ─── Standard auth ───────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithEmail(email: string, password: string) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred;
}

export async function resetPassword(email: string) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  return sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await ensureFirebase();
  if (auth) await fbSignOut(auth);
}

export function onAuth(cb: (user: any) => void) {
  ensureFirebase().then(() => {
    if (!auth) { cb(null); return; }
    onAuthStateChanged(auth, cb);
  });
}
