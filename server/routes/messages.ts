import { Router } from "express";
import { db } from "../db";
import {
  conversations,
  conversationMembers,
  messages,
  users,
} from "@shared/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../auth";

const router = Router();

// List conversations for me
router.get("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const myConvs = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, me));
  const ids = myConvs.map((c) => c.conversationId);
  if (!ids.length) return res.json([]);

  const convs = await db
    .select()
    .from(conversations)
    .where(inArray(conversations.id, ids))
    .orderBy(desc(conversations.lastMessageAt));

  const allMembers = await db
    .select({
      conversationId: conversationMembers.conversationId,
      userId: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      fullName: users.fullName,
    })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .where(inArray(conversationMembers.conversationId, ids));

  const lastMessages = await db.execute(sql`
    SELECT DISTINCT ON (conversation_id) conversation_id, sender_id, text, media_url, created_at
    FROM messages
    WHERE conversation_id = ANY(${ids})
    ORDER BY conversation_id, created_at DESC
  `);

  const lastMap = new Map<number, any>();
  for (const r of lastMessages.rows as any[]) {
    lastMap.set(r.conversation_id, r);
  }

  res.json(
    convs.map((c) => ({
      ...c,
      members: allMembers.filter((m) => m.conversationId === c.id && m.userId !== me),
      lastMessage: lastMap.get(c.id) || null,
    }))
  );
});

// Get or create a conversation with another user
router.post("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  const me = req.userId!;
  const otherId = Number(req.body.userId);
  if (!otherId || otherId === me) return res.status(400).json({ error: "Bad userId" });

  const existing = await db.execute(sql`
    SELECT cm1.conversation_id FROM conversation_members cm1
    INNER JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = ${me} AND cm2.user_id = ${otherId}
    GROUP BY cm1.conversation_id
    HAVING COUNT(*) = 1
    LIMIT 1
  `);
  if (existing.rows.length) {
    const [c] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, (existing.rows[0] as any).conversation_id));
    return res.json(c);
  }

  const [conv] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationMembers).values([
    { conversationId: conv.id, userId: me },
    { conversationId: conv.id, userId: otherId },
  ]);
  res.json(conv);
});

// Get messages of a conversation
router.get("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const me = req.userId!;
  const [member] = await db
    .select()
    .from(conversationMembers)
    .where(
      and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, me))
    );
  if (!member) return res.status(403).json({ error: "Forbidden" });
  const rows = await db
    .select({
      id: messages.id,
      text: messages.text,
      mediaUrl: messages.mediaUrl,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderUsername: users.username,
      senderAvatar: users.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt)
    .limit(200);
  res.json(rows);
});

// Send message
router.post("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const me = req.userId!;
  const { text = "", mediaUrl = "" } = req.body;
  if (!text.trim() && !mediaUrl) return res.status(400).json({ error: "Empty" });
  const [member] = await db
    .select()
    .from(conversationMembers)
    .where(
      and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, me))
    );
  if (!member) return res.status(403).json({ error: "Forbidden" });
  const [m] = await db
    .insert(messages)
    .values({
      conversationId: id,
      senderId: me,
      text: String(text).slice(0, 2000),
      mediaUrl: String(mediaUrl).slice(0, 1000),
    })
    .returning();
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, id));
  res.json(m);
});

export default router;
