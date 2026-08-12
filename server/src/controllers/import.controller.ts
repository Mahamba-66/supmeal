import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
});

const recipeImportSchema = z.object({
  title: z.string().min(1),
  steps: z.string().min(1),
  prepTime: z.number().int().nonnegative(),
  cookTime: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  imageUrl: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  ingredients: z.array(ingredientSchema),
  tags: z.array(z.string()).optional().default([]),
});

const cookbookImportSchema = z.object({
  name: z.string().min(1),
  recipes: z.array(recipeImportSchema),
});

const importSchema = z.object({
  format: z.literal("supmeal-v1"),
  recipes: z.array(recipeImportSchema).optional().default([]),
  cookbooks: z.array(cookbookImportSchema).optional().default([]),
});

export async function importData(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { recipes, cookbooks } = parsed.data;
  let importedRecipes = 0;
  let importedCookbooks = 0;

  for (const r of recipes) {
    await prisma.recipe.create({
      data: {
        title: r.title,
        steps: r.steps,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        imageUrl: r.imageUrl ?? null,
        source: r.source ?? null,
        authorId: req.userId,
        ingredients: { create: r.ingredients },
        tags: {
          connectOrCreate: r.tags.map((name) => ({ where: { name }, create: { name } })),
        },
      },
    });
    importedRecipes++;
  }

  for (const c of cookbooks) {
    const cookbook = await prisma.cookbook.create({
      data: {
        name: c.name,
        members: { create: { userId: req.userId, role: "OWNER" } },
      },
    });
    importedCookbooks++;

    for (const r of c.recipes) {
      await prisma.recipe.create({
        data: {
          title: r.title,
          steps: r.steps,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          servings: r.servings,
          imageUrl: r.imageUrl ?? null,
          source: r.source ?? null,
          authorId: req.userId,
          cookbookId: cookbook.id,
          ingredients: { create: r.ingredients },
          tags: {
            connectOrCreate: r.tags.map((name) => ({ where: { name }, create: { name } })),
          },
        },
      });
      importedRecipes++;
    }
  }

  return res.status(201).json({ importedRecipes, importedCookbooks });
}
