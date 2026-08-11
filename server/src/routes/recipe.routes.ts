import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createRecipe,
  listRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
} from "../controllers/recipe.controller.js";
import commentRoutes from "./comment.routes.js";

const router = Router();

router.use(requireAuth);

router.post("/", createRecipe);
router.get("/", listRecipes);
router.get("/:recipeId", getRecipe);
router.put("/:recipeId", updateRecipe);
router.delete("/:recipeId", deleteRecipe);
router.post("/:recipeId/favorite", toggleFavorite);
router.use("/:recipeId/comments", commentRoutes);

export default router;
