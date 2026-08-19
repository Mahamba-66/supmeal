import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireCookbookRole } from "../middleware/cookbookRole.js";
import {
  createCookbook,
  listMyCookbooks,
  getCookbook,
  inviteMember,
  updateCookbook,
  deleteCookbook,
  listPendingInvites,
  acceptInvite,
  declineInvite,
  removeMember,
  leaveCookbook,
} from "../controllers/cookbook.controller.js";
import { listMessages } from "../controllers/message.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createCookbook);
router.get("/", listMyCookbooks);
router.get("/invites/pending", listPendingInvites);
router.post("/:cookbookId/accept", acceptInvite);
router.post("/:cookbookId/decline", declineInvite);
router.get("/:cookbookId", getCookbook);
router.put("/:cookbookId", updateCookbook);
router.delete("/:cookbookId", deleteCookbook);
router.post("/:cookbookId/invite", requireCookbookRole("OWNER"), inviteMember);
router.delete("/:cookbookId/members/:memberId", removeMember);
router.post("/:cookbookId/leave", leaveCookbook);
router.get("/:cookbookId/messages", listMessages);

export default router;
