import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const createCookbookSchema = z.object({
  name: z.string().min(1),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "READER", "COMMENTER"]).default("READER"),
});

export async function createCookbook(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = createCookbookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const cookbook = await prisma.cookbook.create({
    data: {
      name: parsed.data.name,
      members: {
        create: { userId: req.userId, role: "OWNER" },
      },
    },
    include: { members: true },
  });

  return res.status(201).json({ cookbook });
}

export async function listMyCookbooks(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const memberships = await prisma.cookbookMember.findMany({
    where: { userId: req.userId },
    include: { cookbook: true },
  });

  const cookbooks = memberships.map((m) => ({
    ...m.cookbook,
    myRole: m.role,
  }));

  return res.json({ cookbooks });
}

export async function getCookbook(req: AuthRequest, res: Response) {
  const cookbookId = req.params.cookbookId;

  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      recipes: true,
    },
  });

  if (!cookbook) {
    return res.status(404).json({ error: "Cookbook not found" });
  }

  return res.json({ cookbook });
}

export async function inviteMember(req: AuthRequest, res: Response) {
  const cookbookId = req.params.cookbookId;

  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const parsed = inviteMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, role } = parsed.data;

  const userToInvite = await prisma.user.findUnique({ where: { email } });
  if (!userToInvite) {
    return res.status(404).json({ error: "User with this email does not exist" });
  }

  const existingMembership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: userToInvite.id, cookbookId } },
  });

  if (existingMembership) {
    return res.status(409).json({ error: "User is already a member of this cookbook" });
  }

  const membership = await prisma.cookbookMember.create({
    data: { userId: userToInvite.id, cookbookId, role },
  });

  return res.status(201).json({ membership });
}
