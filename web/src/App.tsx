import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cookbooks from "./pages/Cookbooks";
import CookbookDetailPage from "./pages/CookbookDetail";
import Recipes from "./pages/Recipes";
import RecipeCreate from "./pages/RecipeCreate";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeEdit from "./pages/RecipeEdit";
import Invites from "./pages/Invites";
import MealPlans from "./pages/MealPlans";
import MealPlanDetail from "./pages/MealPlanDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/cookbooks" element={<ProtectedRoute><Cookbooks /></ProtectedRoute>} />
        <Route path="/cookbooks/:cookbookId" element={<ProtectedRoute><CookbookDetailPage /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/recipes/new" element={<ProtectedRoute><RecipeCreate /></ProtectedRoute>} />
        <Route path="/recipes/:recipeId" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        <Route path="/recipes/:recipeId/edit" element={<ProtectedRoute><RecipeEdit /></ProtectedRoute>} />
        <Route path="/invites" element={<ProtectedRoute><Invites /></ProtectedRoute>} />
        <Route path="/mealplans" element={<ProtectedRoute><MealPlans /></ProtectedRoute>} />
        <Route path="/mealplans/:mealPlanId" element={<ProtectedRoute><MealPlanDetail /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
