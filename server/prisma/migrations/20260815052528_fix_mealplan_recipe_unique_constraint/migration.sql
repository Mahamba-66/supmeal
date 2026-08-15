/*
  Warnings:

  - A unique constraint covering the columns `[mealPlanId,recipeId,date,mealType]` on the table `MealPlanRecipe` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MealPlanRecipe_mealPlanId_recipeId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "MealPlanRecipe_mealPlanId_recipeId_date_mealType_key" ON "MealPlanRecipe"("mealPlanId", "recipeId", "date", "mealType");
