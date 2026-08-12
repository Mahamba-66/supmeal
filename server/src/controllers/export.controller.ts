import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

export async function exportData(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipes = await prisma.recipe.findMany({
    where: { authorId: req.userId },
    include: { ingredients: true, tags: true },
  });

  const memberships = await prisma.cookbookMember.findMany({
    where: { userId: req.userId, role: "OWNER" },
    include: {
      cookbook: {
        include: {
          recipes: { include: { ingredients: true, tags: true } },
        },
      },
    },
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    format: "supmeal-v1",
    recipes: recipes.map((r) => ({
      title: r.title,
      steps: r.steps,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      imageUrl: r.imageUrl,
      source: r.source,
      ingredients: r.ingredients.map((i) => ({ name: i.name, quantity: i.quantity })),
      tags: r.tags.map((t) => t.name),
    })),
    cookbooks: memberships.map((m) => ({
      name: m.cookbook.name,
      recipes: m.cookbook.recipes.map((r) => ({
        title: r.title,
        steps: r.steps,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        imageUrl: r.imageUrl,
        source: r.source,
        ingredients: r.ingredients.map((i) => ({ name: i.name, quantity: i.quantity })),
        tags: r.tags.map((t) => t.name),
      })),
    })),
  };

  res.setHeader("Content-Disposition", "attachment; filename=supmeal-export.json");
  res.setHeader("Content-Type", "application/json");
  return res.json(exportPayload);
}
