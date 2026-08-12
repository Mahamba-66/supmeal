import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { exportData } from "../controllers/export.controller.js";
import { importData } from "../controllers/import.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/export", exportData);
router.post("/import", importData);

export default router;
