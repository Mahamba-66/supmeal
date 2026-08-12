import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

export async function listMessages(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const cookbookId = req.params.cookbookId;
  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: req.userId, cookbookId } },
  });
  if (!membership) return res.status(403).json({ error: "You are not a member of this cookbook" });

  const messages = await prisma.message.findMany({
    where: { cookbookId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ messages });
}
