import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyFirebaseToken } from "./firebase-admin";

export interface AuthedRequest extends Request {
  userId?: number;
  firebaseUid?: string;
}

const tokenCache = new Map<string, { uid: string; userId: number; exp: number }>();

export async function authMiddleware(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return next();

  try {
    const cached = tokenCache.get(token);
    if (cached && cached.exp > Date.now()) {
      req.userId = cached.userId;
      req.firebaseUid = cached.uid;
      return next();
    }
    const decoded = await verifyFirebaseToken(token);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, decoded.uid))
      .limit(1);
    if (user) {
      req.userId = user.id;
      req.firebaseUid = decoded.uid;
      tokenCache.set(token, {
        uid: decoded.uid,
        userId: user.id,
        exp: Date.now() + 5 * 60 * 1000,
      });
    } else {
      req.firebaseUid = decoded.uid;
    }
  } catch {
    // ignore, treat as anonymous
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}
