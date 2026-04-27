import { Router } from "express";
import { db } from "../db";
import {
  users,
  posts,
  follows,
  postMedia,
  notifications,
} from "@shared/schema";
import { and, desc, eq, ilike, or, sql, ne } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../auth";
import { verifyFirebaseToken } from "../firebase-admin";

const router = Router();

// Sync (login or register) Firebase user
router.post("/sync", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  let decoded;
  try {
    decoded = await verifyFirebaseToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.firebaseUid, decoded.uid))
    .limit(1);
  if (existing.length) return res.json(existing[0]);

  const baseUsername =
    (decoded.name || decoded.email?.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 24) || `user${Date.now()}`;
  let username = baseUsername;
  let suffix = 0;
  while (true) {
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (!taken.length) break;
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }
  const [created] = await db
    .insert(users)
    .values({
      firebaseUid: decoded.uid,
      email: decoded.email || `${decoded.uid}@firebase.local`,
      username,
      fullName: decoded.name || "",
      avatarUrl: decoded.picture || "",
    })
    .returning();
  res.json(created);
});

// Current user
router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const [u] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  res.json(u);
});

// Update current user
router.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { fullName, bio, website, gender, isPrivate, avatarUrl, username } = req.body;
  const updates: any = {};
  if (fullName !== undefined) updates.fullName = String(fullName).slice(0, 80);
  if (bio !== undefined) updates.bio = String(bio).slice(0, 200);
  if (website !== undefined) updates.website = String(website).slice(0, 256);
  if (gender !== undefined) updates.gender = String(gender).slice(0, 16);
  if (isPrivate !== undefined) updates.isPrivate = Boolean(isPrivate);
  if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl);
  if (username !== undefined) {
    const u = String(username)
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 30);
    if (u.length < 3) return res.status(400).json({ error: "Username too short" });
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, u), ne(users.id, req.userId!)))
      .limit(1);
    if (taken.length) return res.status(400).json({ error: "Username already taken" });
    updates.username = u;
  }
  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, req.userId!))
    .returning();
  res.json(updated);
});

// Get profile by username
router.get("/profile/:username", async (req: AuthedRequest, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [{ count: postCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.userId, user.id));
  const [{ count: followerCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingId, user.id));
  const [{ count: followingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followerId, user.id));

  let isFollowing = false;
  if (req.userId) {
    const [f] = await db
      .select()
      .from(follows)
      .where(
        and(eq(follows.followerId, req.userId), eq(follows.followingId, user.id))
      )
      .limit(1);
    isFollowing = Boolean(f);
  }

  res.json({
    ...user,
    postCount,
    followerCount,
    followingCount,
    isFollowing,
    isMe: req.userId === user.id,
  });
});

// Posts of a user
router.get("/profile/:username/posts", async (req, res) => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!user) return res.status(404).json({ error: "Not found" });
  const rows = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      createdAt: posts.createdAt,
      mediaUrl: sql<string>`(SELECT url FROM post_media WHERE post_id = ${posts.id} ORDER BY position ASC LIMIT 1)`,
      mediaCount: sql<number>`(SELECT COUNT(*)::int FROM post_media WHERE post_id = ${posts.id})`,
      likeCount: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE post_id = ${posts.id})`,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE post_id = ${posts.id})`,
    })
    .from(posts)
    .where(eq(posts.userId, user.id))
    .orderBy(desc(posts.createdAt))
    .limit(60);
  res.json(rows);
});

// Follow / Unfollow
router.post("/:id/follow", requireAuth, async (req: AuthedRequest, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: "Cannot follow self" });
  await db
    .insert(follows)
    .values({ followerId: req.userId!, followingId: targetId })
    .onConflictDoNothing();
  await db
    .insert(notifications)
    .values({
      userId: targetId,
      actorId: req.userId!,
      type: "follow",
    });
  res.json({ ok: true });
});

router.delete("/:id/follow", requireAuth, async (req: AuthedRequest, res) => {
  const targetId = Number(req.params.id);
  await db
    .delete(follows)
    .where(
      and(eq(follows.followerId, req.userId!), eq(follows.followingId, targetId))
    );
  res.json({ ok: true });
});

// Search users
router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
    })
    .from(users)
    .where(or(ilike(users.username, `%${q}%`), ilike(users.fullName, `%${q}%`)))
    .limit(20);
  res.json(rows);
});

// Suggested users (people you don't follow)
router.get("/suggested", async (req: AuthedRequest, res) => {
  const me = req.userId || 0;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
    })
    .from(users)
    .where(
      and(
        ne(users.id, me),
        sql`${users.id} NOT IN (SELECT following_id FROM follows WHERE follower_id = ${me})`
      )
    )
    .limit(8);
  res.json(rows);
});

// Followers / Following lists
router.get("/profile/:username/followers", async (req, res) => {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!u) return res.json([]);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(eq(follows.followingId, u.id))
    .limit(100);
  res.json(rows);
});

router.get("/profile/:username/following", async (req, res) => {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, req.params.username))
    .limit(1);
  if (!u) return res.json([]);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followingId))
    .where(eq(follows.followerId, u.id))
    .limit(100);
  res.json(rows);
});

export default router;
