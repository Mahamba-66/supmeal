import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { prisma } from "../db.js";

const ROLE_HIERARCHY = ["READER", "COMMENTER", "EDITOR", "OWNER"];

export function requireCookbookRole(minRole: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cookbookId = req.params.cookbookId || req.body.cookbookId;

    if (!cookbookId || typeof cookbookId !== "string") {
      return res.status(400).json({ error: "cookbookId is required" });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const membership = await prisma.cookbookMember.findUnique({
      where: { userId_cookbookId: { userId: req.userId, cookbookId } },
    });

    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this cookbook" });
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(membership.role);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      return res.status(403).json({ error: `Requires at least ${minRole} role` });
    }

    next();
  };
}
