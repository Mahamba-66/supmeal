import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const createCommentSchema = z.object({
  content: z.string().min(1),
});

export async function addComment(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  if (recipe.cookbookId) {
    const membership = await prisma.cookbookMember.findUnique({
      where: { userId_cookbookId: { userId: req.userId, cookbookId: recipe.cookbookId } },
    });
    if (!membership || membership.status !== "ACCEPTED") {
      return res.status(403).json({ error: "You are not a member of this cookbook" });
    }
    if (membership.role === "READER") {
      return res.status(403).json({ error: "Readers cannot comment, only view" });
    }
  } else if (recipe.authorId !== req.userId) {
    return res.status(403).json({ error: "You cannot comment on this recipe" });
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, userId: req.userId, recipeId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return res.status(201).json({ comment });
}

export async function listComments(req: AuthRequest, res: Response) {
  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const comments = await prisma.comment.findMany({
    where: { recipeId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ comments });
}

export async function updateComment(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const commentId = req.params.commentId;
  if (!commentId || typeof commentId !== "string") {
    return res.status(400).json({ error: "commentId is required" });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (comment.userId !== req.userId) {
    return res.status(403).json({ error: "You cannot edit this comment" });
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: parsed.data.content },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return res.json({ comment: updated });
}

export async function deleteComment(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const commentId = req.params.commentId;
  if (!commentId || typeof commentId !== "string") {
    return res.status(400).json({ error: "commentId is required" });
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (comment.userId !== req.userId) {
    return res.status(403).json({ error: "You cannot delete this comment" });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return res.status(204).send();
}
