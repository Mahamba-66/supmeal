import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { addComment, listComments, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", addComment);
router.get("/", listComments);
router.put("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);

export default router;
