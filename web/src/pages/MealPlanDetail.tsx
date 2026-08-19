import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import type { MealPlan, Recipe } from "../lib/types";
import { ArrowLeft, Trash2, X } from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Petit-déjeuner",
  LUNCH: "Déjeuner",
  DINNER: "Dîner",
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
    alert("Planning supprimé avec succès");
    navigate("/mealplans");
  }

  if (!mealPlan) return <Layout><p>Chargement...</p></Layout>;

  const sortedEntries = [...mealPlan.recipes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Layout>
      <Link to="/mealplans" className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-paprika mb-4">
        <ArrowLeft size={14} /> Plannings
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold">{mealPlan.name}</h1>
        <button onClick={handleDeletePlan} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
          <Trash2 size={14} /> Supprimer
        </button>
      </div>

      <form onSubmit={handleAddRecipe} className="bg-paper border border-line rounded-2xl p-5 mb-8 flex flex-col gap-3">
        <h2 className="font-display font-semibold">Ajouter une recette</h2>
        <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm">
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
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1"
          />
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="BREAKFAST">Petit-déjeuner</option>
            <option value="LUNCH">Déjeuner</option>
            <option value="DINNER">Dîner</option>
            <option value="SNACK">Collation</option>
          </select>
          <input
            type="number"
            placeholder="Portions"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm w-28"
            min={1}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-indigo text-cream rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-light">
          Ajouter au planning
        </button>
      </form>

      <h2 className="font-display text-xl font-semibold mb-4">Repas planifiés</h2>
      <ul className="flex flex-col gap-2">
        {sortedEntries.map((entry) => (
          <li key={entry.id} className="bg-paper border border-line rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-mono text-xs uppercase text-paprika">
                {new Date(entry.date).toLocaleDateString("fr-FR")} · {entry.mealType && MEAL_TYPE_LABELS[entry.mealType]}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Link to={`/recipes/${entry.recipe.id}`} className="font-display font-semibold hover:text-paprika">
                  {entry.recipe.title}
                </Link>
                {entry.servings && <span className="text-sm text-ink/50">({entry.servings} portions)</span>}
              </div>
            </div>
            <button onClick={() => handleRemoveEntry(entry.id)} className="text-ink/30 hover:text-red-500">
              <X size={16} />
            </button>
          </li>
        ))}
        {sortedEntries.length === 0 && <p className="text-ink/50 text-sm">Aucune recette planifiée.</p>}
      </ul>
    </Layout>
  );
}
