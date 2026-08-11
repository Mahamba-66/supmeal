import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireCookbookRole } from "../middleware/cookbookRole.js";
import {
  createCookbook,
  listMyCookbooks,
  getCookbook,
  inviteMember,
} from "../controllers/cookbook.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createCookbook);
router.get("/", listMyCookbooks);
router.get("/:cookbookId", getCookbook);
router.post("/:cookbookId/invite", requireCookbookRole("OWNER"), inviteMember);

export default router;
