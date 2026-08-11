import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createMealPlan,
  listMealPlans,
  getMealPlan,
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
  deleteMealPlan,
} from "../controllers/mealplan.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createMealPlan);
router.get("/", listMealPlans);
router.get("/:mealPlanId", getMealPlan);
router.delete("/:mealPlanId", deleteMealPlan);
router.post("/:mealPlanId/recipes", addRecipeToMealPlan);
router.delete("/:mealPlanId/recipes/:entryId", removeRecipeFromMealPlan);

export default router;
