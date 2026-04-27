import { Router } from "express";
import { db } from "../db";
import { notifications, users } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      text: notifications.text,
      postId: notifications.postId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorAvatar: users.avatarUrl,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.userId, req.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  res.json(rows);
});

router.post("/read", requireAuth, async (req: AuthedRequest, res) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, req.userId!));
  res.json({ ok: true });
});

export default router;
