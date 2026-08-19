import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db.js";

const createMealPlanSchema = z.object({
  name: z.string().min(1),
  cookbookId: z.string().uuid().optional(),
});

const mealTypeEnum = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

const addRecipeToPlanSchema = z.object({
  recipeId: z.string().uuid(),
  date: z.string().datetime(),
  mealType: mealTypeEnum.optional(),
  servings: z.number().int().positive().optional(),
});

async function assertCanEditCookbook(userId: string, cookbookId: string) {
  const membership = await prisma.cookbookMember.findUnique({
    where: { userId_cookbookId: { userId, cookbookId } },
  });
  if (!membership) return "You are not a member of this cookbook";
  if (membership.role !== "OWNER" && membership.role !== "EDITOR") {
    return "Requires at least EDITOR role";
  }
  return null;
}

export async function createMealPlan(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = createMealPlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, cookbookId } = parsed.data;

  if (cookbookId) {
    const err = await assertCanEditCookbook(req.userId, cookbookId);
    if (err) return res.status(403).json({ error: err });
  }

  const mealPlan = await prisma.mealPlan.create({
    data: {
      name,
      userId: cookbookId ? null : req.userId,
      cookbookId: cookbookId ?? null,
    },
  });

  return res.status(201).json({ mealPlan });
}

export async function listMealPlans(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const memberships = await prisma.cookbookMember.findMany({
    where: { userId: req.userId },
    select: { cookbookId: true },
  });
  const myCookbookIds = memberships.map((m) => m.cookbookId);

  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      OR: [
        { userId: req.userId },
        { cookbookId: { in: myCookbookIds } },
      ],
    },
    include: {
      recipes: { include: { recipe: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ mealPlans });
}

export async function getMealPlan(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const mealPlanId = req.params.mealPlanId;
  if (!mealPlanId || typeof mealPlanId !== "string") {
    return res.status(400).json({ error: "mealPlanId is required" });
  }

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id: mealPlanId },
    include: {
      recipes: { include: { recipe: true }, orderBy: { date: "asc" } },
    },
  });

  if (!mealPlan) return res.status(404).json({ error: "MealPlan not found" });

  if (mealPlan.userId === req.userId) {
    return res.json({ mealPlan });
  }

  if (mealPlan.cookbookId) {
    const membership = await prisma.cookbookMember.findUnique({
      where: { userId_cookbookId: { userId: req.userId, cookbookId: mealPlan.cookbookId } },
    });
    if (membership && membership.status === "ACCEPTED") {
      return res.json({ mealPlan });
    }
  }

  return res.status(403).json({ error: "You do not have access to this meal plan" });
}

async function assertCanEditMealPlan(userId: string, mealPlanId: string) {
  const mealPlan = await prisma.mealPlan.findUnique({ where: { id: mealPlanId } });
  if (!mealPlan) return { error: "MealPlan not found", status: 404 };

  if (mealPlan.cookbookId) {
    const err = await assertCanEditCookbook(userId, mealPlan.cookbookId);
    if (err) return { error: err, status: 403 };
    return { mealPlan };
  }

  if (mealPlan.userId !== userId) {
    return { error: "You cannot edit this meal plan", status: 403 };
  }

  return { mealPlan };
}

export async function addRecipeToMealPlan(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const mealPlanId = req.params.mealPlanId;
  if (!mealPlanId || typeof mealPlanId !== "string") {
    return res.status(400).json({ error: "mealPlanId is required" });
  }

  const check = await assertCanEditMealPlan(req.userId, mealPlanId);
  if (check.error) return res.status(check.status).json({ error: check.error });

  const parsed = addRecipeToPlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { recipeId, date, mealType, servings } = parsed.data;

  const entry = await prisma.mealPlanRecipe.create({
    data: {
      mealPlanId,
      recipeId,
      date: new Date(date),
      mealType: mealType ?? null,
      servings: servings ?? null,
    },
    include: { recipe: true },
  });

  return res.status(201).json({ entry });
}

export async function removeRecipeFromMealPlan(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const mealPlanId = req.params.mealPlanId;
  const entryId = req.params.entryId;
  if (!mealPlanId || typeof mealPlanId !== "string" || !entryId || typeof entryId !== "string") {
    return res.status(400).json({ error: "mealPlanId and entryId are required" });
  }

  const check = await assertCanEditMealPlan(req.userId, mealPlanId);
  if (check.error) return res.status(check.status).json({ error: check.error });

  await prisma.mealPlanRecipe.delete({ where: { id: entryId } });
  return res.status(204).send();
}

export async function deleteMealPlan(req: AuthRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const mealPlanId = req.params.mealPlanId;
  if (!mealPlanId || typeof mealPlanId !== "string") {
    return res.status(400).json({ error: "mealPlanId is required" });
  }

  const check = await assertCanEditMealPlan(req.userId, mealPlanId);
  if (check.error) return res.status(check.status).json({ error: check.error });

  await prisma.mealPlan.delete({ where: { id: mealPlanId } });
  return res.status(204).send();
}
