import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { MealPlan, Recipe } from "../lib/types";

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Petit-dejeuner",
  LUNCH: "Dejeuner",
  DINNER: "Diner",
  SNACK: "Collation",
};

export default function MealPlanDetail() {
  const { mealPlanId } = useParams();
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [date, setDate] = useState("");
  const [mealType, setMealType] = useState("DINNER");
  const [servings, setServings] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadMealPlan() {
    const res = await api.get(`/mealplans/${mealPlanId}`);
    setMealPlan(res.data.mealPlan);
  }

  useEffect(() => {
    loadMealPlan();
    api.get("/recipes").then((res) => setAvailableRecipes(res.data.recipes));
  }, [mealPlanId]);

  async function handleAddRecipe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipeId || !date) {
      setError("Choisissez une recette et une date");
      return;
    }
    try {
      await api.post(`/mealplans/${mealPlanId}/recipes`, {
        recipeId,
        date: new Date(date).toISOString(),
        mealType,
        ...(servings ? { servings: Number(servings) } : {}),
      });
      setRecipeId("");
      setDate("");
      setServings("");
      loadMealPlan();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de l'ajout");
    }
  }

  async function handleRemoveEntry(entryId: string) {
    if (!confirm("Retirer cette recette du planning ?")) return;
    await api.delete(`/mealplans/${mealPlanId}/recipes/${entryId}`);
    loadMealPlan();
  }

  async function handleDeletePlan() {
    if (!confirm("Voulez-vous supprimer ce planning ?")) return;
    await api.delete(`/mealplans/${mealPlanId}`);
    alert("Planning supprime avec succes");
    navigate("/mealplans");
  }

  if (!mealPlan) return <div className="p-8">Chargement...</div>;

  const sortedEntries = [...mealPlan.recipes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/mealplans" className="text-sm text-purple-600">{"<- Retour aux plannings"}</Link>

      <div className="flex justify-between items-center mt-2 mb-6">
        <h1 className="text-2xl font-bold">{mealPlan.name}</h1>
        <button onClick={handleDeletePlan} className="px-3 py-1 rounded border bg-red-50 text-red-600 text-sm">
          Supprimer le planning
        </button>
      </div>

      <form onSubmit={handleAddRecipe} className="flex flex-col gap-2 mb-8 border rounded p-4">
        <h2 className="font-semibold">Ajouter une recette</h2>
        <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Choisir une recette</option>
          {availableRecipes.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  min={new Date().toISOString().split("T")[0]}
  className="border rounded px-3 py-2 flex-1"
/>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="border rounded px-3 py-2">
            <option value="BREAKFAST">Petit-dejeuner</option>
            <option value="LUNCH">Dejeuner</option>
            <option value="DINNER">Diner</option>
            <option value="SNACK">Collation</option>
          </select>
          <input
            type="number"
            placeholder="Portions"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="border rounded px-3 py-2 w-28"
            min={1}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Ajouter au planning
        </button>
      </form>

      <h2 className="font-semibold mb-2">Repas planifies</h2>
      <ul className="flex flex-col gap-2">
        {sortedEntries.map((entry) => (
          <li key={entry.id} className="border rounded px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-semibold">
                {new Date(entry.date).toLocaleDateString("fr-FR")}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {entry.mealType && MEAL_TYPE_LABELS[entry.mealType]}
              </span>
              <div>
                <Link to={`/recipes/${entry.recipe.id}`} className="text-purple-600">
                  {entry.recipe.title}
                </Link>
                {entry.servings && <span className="ml-2 text-sm text-gray-500">({entry.servings} portions)</span>}
              </div>
            </div>
            <button onClick={() => handleRemoveEntry(entry.id)} className="text-red-600 text-sm">
              Retirer
            </button>
          </li>
        ))}
        {sortedEntries.length === 0 && <p className="text-gray-500">Aucune recette planifiee.</p>}
      </ul>
    </div>
  );
}
