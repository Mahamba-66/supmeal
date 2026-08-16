import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { signToken } from "../utils/jwt.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime().or(z.string().regex(/\d{4}-\d{2}-\d{2}$/)),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  diet: z.string().nullable().optional(),
  allergies: z.array(z.string()).optional(),
  defaultServings: z.number().int().positive().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, firstName, lastName, dateOfBirth } = parsed.data;

  const birthDate = new Date(dateOfBirth);
  if (birthDate > new Date()) {
    return res.status(400).json({ error: "La date de naissance ne peut pas etre dans le futur" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Cet email est deja utilise" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, dateOfBirth: birthDate },
  });

  const token = signToken({ userId: user.id });

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  const token = signToken({ userId: user.id });

  return res.json({
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  });
}

export async function me(req: Request & { userId?: string }, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Non autorise" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, firstName: true, lastName: true, dateOfBirth: true,
      diet: true, allergies: true, defaultServings: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  return res.json({ user });
}

export async function updateMe(req: Request & { userId?: string }, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Non autorise" });
  }

  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { firstName, lastName, diet, allergies, defaultServings, currentPassword, newPassword } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (diet !== undefined) updateData.diet = diet;
  if (allergies !== undefined) updateData.allergies = allergies;
  if (defaultServings !== undefined) updateData.defaultServings = defaultServings;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Le mot de passe actuel est requis pour en definir un nouveau" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !user.password) {
      return res.status(400).json({ error: "Ce compte n'a pas de mot de passe defini" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Le mot de passe actuel est incorrect" });
    }

    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: updateData,
    select: {
      id: true, email: true, firstName: true, lastName: true, dateOfBirth: true,
      diet: true, allergies: true, defaultServings: true,
    },
  });

  return res.json({ user: updated });
}
