import { Router } from "express";
import { db } from "../db";
import {
  posts,
  postMedia,
  likes,
  comments,
  saves,
  follows,
  users,
  notifications,
} from "@shared/schema";
import { and, desc, eq, sql, inArray, or } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../auth";

const router = Router();

async function hydratePosts(rows: any[], me: number | null) {
  if (!rows.length) return [];
  const ids = rows.map((p) => p.id);
  const media = await db
    .select()
    .from(postMedia)
    .where(inArray(postMedia.postId, ids));
  const myLikes = me
    ? await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(and(eq(likes.userId, me), inArray(likes.postId, ids)))
    : [];
  const mySaves = me
    ? await db
        .select({ postId: saves.postId })
        .from(saves)
        .where(and(eq(saves.userId, me), inArray(saves.postId, ids)))
    : [];
  const likedSet = new Set(myLikes.map((l) => l.postId));
  const savedSet = new Set(mySaves.map((l) => l.postId));

  return rows.map((p) => ({
    ...p,
    media: media
      .filter((m) => m.postId === p.id)
      .sort((a, b) => a.position - b.position),
    likedByMe: likedSet.has(p.id),
    savedByMe: savedSet.has(p.id),
  }));
}

// Feed (posts from followed users + own + popular)
router.get("/feed", async (req: AuthedRequest, res) => {
  const me = req.userId || null;
  const rows = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      location: posts.location,
      createdAt: posts.createdAt,
      userId: posts.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
      likeCount: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE post_id = ${posts.id})`,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE post_id = ${posts.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(
      me
        ? or(
            eq(posts.userId, me),
            sql`${posts.userId} IN (SELECT following_id FROM follows WHERE follower_id = ${me})`
          )
        : sql`TRUE`
    )
    .orderBy(desc(posts.createdAt))
    .limit(40);
  res.json(await hydratePosts(rows, me));
});

// Explore (popular posts not from people you follow)
router.get("/explore", async (req: AuthedRequest, res) => {
  const me = req.userId || 0;
  const rows = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      createdAt: posts.createdAt,
      userId: posts.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
      likeCount: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE post_id = ${posts.id})`,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE post_id = ${posts.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(
      me
        ? sql`${posts.userId} != ${me} AND ${posts.userId} NOT IN (SELECT following_id FROM follows WHERE follower_id = ${me})`
        : sql`TRUE`
    )
    .orderBy(
      desc(sql`(SELECT COUNT(*) FROM likes WHERE post_id = ${posts.id})`),
      desc(posts.createdAt)
    )
    .limit(60);
  res.json(await hydratePosts(rows, me || null));
});

// Single post
router.get("/:id", async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      location: posts.location,
      createdAt: posts.createdAt,
      userId: posts.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
      likeCount: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE post_id = ${posts.id})`,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE post_id = ${posts.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(eq(posts.id, id));
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const [hydrated] = await hydratePosts(rows, req.userId || null);
  res.json(hydrated);
});

// Create post
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { caption = "", location = "", media = [] } = req.body as {
    caption?: string;
    location?: string;
    media?: { url: string; type?: string }[];
  };
  if (!Array.isArray(media) || media.length === 0)
    return res.status(400).json({ error: "Media is required" });

  const [post] = await db
    .insert(posts)
    .values({
      userId: req.userId!,
      caption: caption.slice(0, 2200),
      location: location.slice(0, 120),
    })
    .returning();
  await db.insert(postMedia).values(
    media.map((m, i) => ({
      postId: post.id,
      url: m.url,
      type: m.type === "video" ? "video" : "image",
      position: i,
    }))
  );
  res.json(post);
});

// Delete post
router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return res.status(404).json({ error: "Not found" });
  if (p.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
  await db.delete(posts).where(eq(posts.id, id));
  res.json({ ok: true });
});

// Like / Unlike
router.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const postId = Number(req.params.id);
  await db
    .insert(likes)
    .values({ userId: req.userId!, postId })
    .onConflictDoNothing();
  const [p] = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, postId));
  if (p && p.userId !== req.userId) {
    await db.insert(notifications).values({
      userId: p.userId,
      actorId: req.userId!,
      type: "like",
      postId,
    });
  }
  res.json({ ok: true });
});

router.delete("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const postId = Number(req.params.id);
  await db
    .delete(likes)
    .where(and(eq(likes.userId, req.userId!), eq(likes.postId, postId)));
  res.json({ ok: true });
});

// Save / Unsave
router.post("/:id/save", requireAuth, async (req: AuthedRequest, res) => {
  const postId = Number(req.params.id);
  await db
    .insert(saves)
    .values({ userId: req.userId!, postId })
    .onConflictDoNothing();
  res.json({ ok: true });
});

router.delete("/:id/save", requireAuth, async (req: AuthedRequest, res) => {
  const postId = Number(req.params.id);
  await db
    .delete(saves)
    .where(and(eq(saves.userId, req.userId!), eq(saves.postId, postId)));
  res.json({ ok: true });
});

// Saved posts
router.get("/me/saved", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      createdAt: posts.createdAt,
      userId: posts.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
      likeCount: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE post_id = ${posts.id})`,
      commentCount: sql<number>`(SELECT COUNT(*)::int FROM comments WHERE post_id = ${posts.id})`,
    })
    .from(saves)
    .innerJoin(posts, eq(posts.id, saves.postId))
    .innerJoin(users, eq(users.id, posts.userId))
    .where(eq(saves.userId, req.userId!))
    .orderBy(desc(saves.createdAt))
    .limit(60);
  res.json(await hydratePosts(rows, req.userId!));
});

// Liked-by list
router.get("/:id/likes", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    })
    .from(likes)
    .innerJoin(users, eq(users.id, likes.userId))
    .where(eq(likes.postId, id))
    .limit(100);
  res.json(rows);
});

// Comments
router.get("/:id/comments", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: comments.id,
      text: comments.text,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      userId: comments.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.postId, id))
    .orderBy(comments.createdAt)
    .limit(200);
  res.json(rows);
});

router.post("/:id/comments", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const { text, parentId } = req.body;
  if (!text || !String(text).trim()) return res.status(400).json({ error: "Text required" });
  const [c] = await db
    .insert(comments)
    .values({
      postId: id,
      userId: req.userId!,
      text: String(text).slice(0, 1000),
      parentId: parentId ? Number(parentId) : null,
    })
    .returning();
  const [p] = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, id));
  if (p && p.userId !== req.userId) {
    await db.insert(notifications).values({
      userId: p.userId,
      actorId: req.userId!,
      type: "comment",
      postId: id,
      commentId: c.id,
      text: String(text).slice(0, 200),
    });
  }
  res.json(c);
});

router.delete("/comments/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const [c] = await db.select().from(comments).where(eq(comments.id, id));
  if (!c) return res.status(404).json({ error: "Not found" });
  if (c.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
  await db.delete(comments).where(eq(comments.id, id));
  res.json({ ok: true });
});

export default router;
