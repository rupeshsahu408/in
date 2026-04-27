import admin from "firebase-admin";

let initialized = false;

function init() {
  if (initialized) return;
  if (admin.apps.length) {
    initialized = true;
    return;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    return;
  }

  if (projectId) {
    admin.initializeApp({ projectId });
    initialized = true;
    return;
  }

  console.warn(
    "[firebase-admin] No service account credentials found. Token verification will be insecure (development only)."
  );
}

export async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}> {
  init();
  if (admin.apps.length) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };
    } catch (e) {
      // Fall through to insecure decode if admin is misconfigured in dev
      if (process.env.NODE_ENV === "production") throw e;
    }
  }
  // Dev fallback: decode JWT payload (NOT verified — only used if admin is unavailable)
  try {
    const [, payloadB64] = idToken.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    if (!payload.user_id && !payload.sub) throw new Error("Invalid token payload");
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    throw new Error("Invalid token");
  }
}
