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
} from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let configured = false;
let configPromise: Promise<any> | null = null;

async function loadConfig() {
  if (configPromise) return configPromise;
  configPromise = fetch("/api/config")
    .then((r) => r.json())
    .then((cfg) => {
      if (cfg.firebase?.configured) {
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
      return cfg;
    });
  return configPromise;
}

export async function ensureFirebase() {
  await loadConfig();
  return { app, auth, configured };
}

export function getAuthInstance() {
  return auth;
}

export function isFirebaseConfigured() {
  return configured;
}

export async function getIdToken(): Promise<string | null> {
  await ensureFirebase();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export async function signInWithGoogle() {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email: string, password: string) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  await ensureFirebase();
  if (!auth) throw new Error("Firebase not configured");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
}

export async function signOut() {
  await ensureFirebase();
  if (auth) await fbSignOut(auth);
}

export function onAuth(cb: (user: any) => void) {
  ensureFirebase().then(() => {
    if (!auth) {
      cb(null);
      return;
    }
    onAuthStateChanged(auth, cb);
  });
}
