import { Router } from "express";
import { db } from "../db";
import { stories, storyViews, users, follows } from "@shared/schema";
import { desc, eq, sql, and, or, gt } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../auth";

const router = Router();

// Story tray (grouped by user, only stories not yet expired)
router.get("/tray", async (req: AuthedRequest, res) => {
  const me = req.userId || 0;
  const rows = await db
    .select({
      userId: stories.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      latestAt: sql<string>`MAX(${stories.createdAt})`,
      hasUnseen: sql<boolean>`BOOL_OR(${stories.id} NOT IN (SELECT story_id FROM story_views WHERE user_id = ${me}))`,
    })
    .from(stories)
    .innerJoin(users, eq(users.id, stories.userId))
    .where(
      and(
        gt(stories.expiresAt, sql`NOW()`),
        me
          ? or(
              eq(stories.userId, me),
              sql`${stories.userId} IN (SELECT following_id FROM follows WHERE follower_id = ${me})`
            )
          : sql`TRUE`
      )
    )
    .groupBy(stories.userId, users.username, users.avatarUrl)
    .orderBy(desc(sql`MAX(${stories.createdAt})`));
  res.json(rows);
});

// Stories of a specific user
router.get("/user/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const rows = await db
    .select()
    .from(stories)
    .where(and(eq(stories.userId, userId), gt(stories.expiresAt, sql`NOW()`)))
    .orderBy(stories.createdAt);
  res.json(rows);
});

// Create story
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { mediaUrl, type = "image" } = req.body;
  if (!mediaUrl) return res.status(400).json({ error: "mediaUrl required" });
  const [s] = await db
    .insert(stories)
    .values({ userId: req.userId!, mediaUrl, type })
    .returning();
  res.json(s);
});

// View story
router.post("/:id/view", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  await db
    .insert(storyViews)
    .values({ storyId: id, userId: req.userId! })
    .onConflictDoNothing();
  res.json({ ok: true });
});

// Delete story
router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const [s] = await db.select().from(stories).where(eq(stories.id, id));
  if (!s || s.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
  await db.delete(stories).where(eq(stories.id, id));
  res.json({ ok: true });
});

export default router;
