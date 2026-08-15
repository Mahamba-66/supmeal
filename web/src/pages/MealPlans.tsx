import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { MealPlan, Cookbook } from "../lib/types";

export default function MealPlans() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [name, setName] = useState("");
  const [cookbookId, setCookbookId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadMealPlans() {
    const res = await api.get("/mealplans");
    setMealPlans(res.data.mealPlans);
  }

  useEffect(() => {
    loadMealPlans();
    api.get("/cookbooks").then((res) => {
      const editable = res.data.cookbooks.filter(
        (cb: Cookbook) => cb.myRole === "OWNER" || cb.myRole === "EDITOR"
      );
      setCookbooks(editable);
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/mealplans", { name, ...(cookbookId ? { cookbookId } : {}) });
      setName("");
      setCookbookId("");
      loadMealPlans();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de la creation");
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Mes Plannings</h1>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 mb-8">
        <input
          type="text"
          placeholder="Nom du planning"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <div className="flex gap-2">
          <select
            value={cookbookId}
            onChange={(e) => setCookbookId(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          >
            <option value="">Planning personnel</option>
            {cookbooks.map((cb) => (
              <option key={cb.id} value={cb.id}>{cb.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
            Creer
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <ul className="flex flex-col gap-3">
        {mealPlans.map((mp) => (
          <li key={mp.id}>
            <Link to={`/mealplans/${mp.id}`} className="block border rounded px-4 py-3 hover:bg-gray-50">
              <span className="font-semibold">{mp.name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {mp.recipes.length} recette(s)
              </span>
            </Link>
          </li>
        ))}
        {mealPlans.length === 0 && <p className="text-gray-500">Aucun planning pour l'instant.</p>}
      </ul>
    </div>
  );
}
