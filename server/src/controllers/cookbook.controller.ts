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
        create: { userId: req.userId, role: "OWNER", status: "ACCEPTED" },
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
    where: { userId: req.userId, status: "ACCEPTED" },
    include: { cookbook: true },
  });

  const cookbooks = memberships.map((m) => ({
    ...m.cookbook,
    myRole: m.role,
  }));

  return res.json({ cookbooks });
}

export async function listPendingInvites(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const invites = await prisma.cookbookMember.findMany({
    where: { userId: req.userId, status: "PENDING" },
    include: { cookbook: true },
  });

  return res.json({ invites });
}

export async function acceptInvite(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const cookbookId = req.params.cookbookId;
  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: req.userId, cookbookId } },
  });
  if (!membership || membership.status !== "PENDING") {
    return res.status(404).json({ error: "No pending invite found" });
  }

  const updated = await prisma.cookbookMember.update({
    where: { id: membership.id },
    data: { status: "ACCEPTED" },
  });

  return res.json({ membership: updated });
}

export async function declineInvite(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const cookbookId = req.params.cookbookId;
  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: req.userId, cookbookId } },
  });
  if (!membership || membership.status !== "PENDING") {
    return res.status(404).json({ error: "No pending invite found" });
  }

  await prisma.cookbookMember.delete({ where: { id: membership.id } });
  return res.status(204).send();
}

export async function getCookbook(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const cookbookId = req.params.cookbookId;

  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    include: {
      members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      recipes: true,
    },
  });

  if (!cookbook) {
    return res.status(404).json({ error: "Cookbook not found" });
  }

  const myMembership = cookbook.members.find((m) => m.userId === req.userId && m.status === "ACCEPTED");
  if (!myMembership) {
    return res.status(403).json({ error: "You are not a member of this cookbook" });
  }

  const isOwner = myMembership.role === "OWNER";

  const responseCookbook = isOwner
    ? { ...cookbook, myRole: myMembership.role }
    : {
        id: cookbook.id,
        name: cookbook.name,
        createdAt: cookbook.createdAt,
        recipes: cookbook.recipes,
        myRole: myMembership.role,
      };

  return res.json({ cookbook: responseCookbook });
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
    return res.status(409).json({ error: "User already invited or already a member" });
  }

  const membership = await prisma.cookbookMember.create({
    data: { userId: userToInvite.id, cookbookId, role, status: "PENDING" },
  });

  return res.status(201).json({ membership });
}

export async function updateCookbook(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const cookbookId = req.params.cookbookId;
  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: req.userId, cookbookId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Requires OWNER role" });
  }

  const parsed = createCookbookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const cookbook = await prisma.cookbook.update({
    where: { id: cookbookId },
    data: { name: parsed.data.name },
  });

  return res.json({ cookbook });
}

export async function deleteCookbook(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const cookbookId = req.params.cookbookId;
  if (!cookbookId || typeof cookbookId !== "string") {
    return res.status(400).json({ error: "cookbookId is required" });
  }

  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId: req.userId, cookbookId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Requires OWNER role" });
  }

  await prisma.cookbook.delete({ where: { id: cookbookId } });
  return res.status(204).send();
}
