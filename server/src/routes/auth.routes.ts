import { Router } from "express";
import passport from "passport";
import { register, login, me, updateMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { signToken } from "../utils/jwt.js";
import type { Request, Response } from "express";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateMe);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/login" }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const token = signToken({ userId: user.id });
    res.redirect(`http://localhost:5173/oauth-callback?token=${token}`);
  }
);

export default router;
