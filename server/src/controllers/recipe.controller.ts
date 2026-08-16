import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
});

const createRecipeSchema = z.object({
  title: z.string().min(1),
  steps: z.string().min(1),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  source: z.string().optional(),
  cookbookId: z.string().uuid().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  tags: z.array(z.string().min(1)).optional().default([]),
});

const updateRecipeSchema = createRecipeSchema.partial().omit({ cookbookId: true });

async function assertCanEditCookbook(userId: string, cookbookId: string) {
  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId, cookbookId } },
  });
  if (!membership || membership.status !== "ACCEPTED") return "You are not a member of this cookbook";
  if (membership.role !== "OWNER" && membership.role !== "EDITOR") {
    return "Requires at least EDITOR role";
  }
  return null;
}

export async function createRecipe(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = createRecipeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { ingredients, tags, cookbookId, imageUrl, source, ...rest } = parsed.data;

  if (cookbookId) {
    const err = await assertCanEditCookbook(req.userId, cookbookId);
    if (err) return res.status(403).json({ error: err });
  }

  const recipe = await prisma.recipe.create({
    data: {
      ...rest,
      imageUrl: imageUrl ?? null,
      source: source ?? null,
      authorId: req.userId,
      cookbookId: cookbookId ?? null,
      ingredients: { create: ingredients },
      tags: {
        connectOrCreate: tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { ingredients: true, tags: true },
  });

  return res.status(201).json({ recipe });
}

export async function listRecipes(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const { cookbookId, favorite, tag, q } = req.query;

  const memberships = await prisma.cookbookMember.findMany({
    where: { userId: req.userId, status: "ACCEPTED" },
    select: { cookbookId: true },
  });
  const myCookbookIds = memberships.map((m) => m.cookbookId);

  const accessFilter: Record<string, unknown> =
    typeof cookbookId === "string"
      ? { cookbookId }
      : {
          OR: [
            { authorId: req.userId, cookbookId: null },
            { cookbookId: { in: myCookbookIds } },
          ],
        };

  const extraFilters: Record<string, unknown>[] = [];

  if (typeof tag === "string") {
    extraFilters.push({ tags: { some: { name: tag } } });
  }

  if (typeof q === "string" && q.length > 0) {
    extraFilters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { steps: { contains: q, mode: "insensitive" } },
        { ingredients: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  const where = extraFilters.length > 0
    ? { AND: [accessFilter, ...extraFilters] }
    : accessFilter;

  let recipes = await prisma.recipe.findMany({
    where,
    include: {
      ingredients: true,
      tags: true,
      favorites: true,
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (favorite === "true") {
    recipes = recipes.filter((r) =>
      r.favorites.some((f) => f.userId === req.userId)
    );
  }

  return res.json({ recipes });
}

export async function getRecipe(req: AuthRequest, res: Response) {
  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: true,
      tags: true,
      comments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  let myCookbookRole: string | null = null;
  if (recipe.cookbookId && req.userId) {
    const membership = await prisma.cookbookMember.findUnique({
      where: { userId_cookbookId: { userId: req.userId, cookbookId: recipe.cookbookId } },
    });
    myCookbookRole = membership?.role ?? null;
  }

  return res.json({ recipe: { ...recipe, myCookbookRole } });
}

export async function updateRecipe(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!existing) return res.status(404).json({ error: "Recipe not found" });

  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Only the author can edit this recipe" });
  }

  const parsed = updateRecipeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { ingredients, tags, ...fields } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.steps !== undefined) updateData.steps = fields.steps;
  if (fields.prepTime !== undefined) updateData.prepTime = fields.prepTime;
  if (fields.cookTime !== undefined) updateData.cookTime = fields.cookTime;
  if (fields.servings !== undefined) updateData.servings = fields.servings;
  if (fields.imageUrl !== undefined) updateData.imageUrl = fields.imageUrl;
  if (fields.source !== undefined) updateData.source = fields.source;

  if (ingredients) {
    updateData.ingredients = { deleteMany: {}, create: ingredients };
  }

  if (tags) {
    updateData.tags = {
      set: [],
      connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })),
    };
  }

  const recipe = await prisma.recipe.update({
    where: { id: recipeId },
    data: updateData,
    include: { ingredients: true, tags: true },
  });

  return res.json({ recipe });
}

export async function deleteRecipe(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!existing) return res.status(404).json({ error: "Recipe not found" });

  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Only the author can delete this recipe" });
  }

  await prisma.recipe.delete({ where: { id: recipeId } });
  return res.status(204).send();
}

export async function toggleFavorite(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId: req.userId, recipeId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: req.userId, recipeId } });
  return res.json({ favorited: true });
}

export async function addToCookbook(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const recipeId = req.params.recipeId;
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId is required" });
  }

  const parsed = z.object({ cookbookId: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { cookbookId } = parsed.data;

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  if (recipe.authorId !== req.userId) {
    return res.status(403).json({ error: "Only the author can add this recipe to a cookbook" });
  }

  const err = await assertCanEditCookbook(req.userId, cookbookId);
  if (err) return res.status(403).json({ error: err });

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: { cookbookId },
  });

  return res.json({ recipe: updated });
}
