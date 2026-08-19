import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import type { MealPlan, Cookbook } from "../lib/types";
import { Plus, ArrowRight, CalendarDays } from "lucide-react";

export default function MealPlans() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [name, setName] = useState("");
  const [cookbookId, setCookbookId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      loadMealPlans();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de la création");
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">Organisez vos repas</p>
          <h1 className="font-display text-3xl font-bold">Plannings</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo text-cream px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-light transition-colors"
        >
          <Plus size={16} />
          Nouveau planning
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 mb-8 bg-paper border border-line rounded-xl p-4">
          <input
            type="text"
            placeholder="Nom du planning ^(ex: Semaine du 18 août^)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
            required
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={cookbookId}
              onChange={(e) => setCookbookId(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Planning personnel</option>
              {cookbooks.map((cb) => (
                <option key={cb.id} value={cb.id}>{cb.name}</option>
              ))}
            </select>
            <button type="submit" className="bg-paprika text-white rounded-lg px-4 py-2 text-sm font-medium">
              Créer
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {mealPlans.map((mp) => (
          <Link
            key={mp.id}
            to={`/mealplans/${mp.id}`}
            className="group bg-paper border border-line rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <CalendarDays size={18} className="text-paprika-dark" />
              </div>
              <ArrowRight size={16} className="text-ink/30 group-hover:text-paprika transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{mp.name}</h3>
            <span className="text-xs font-mono text-ink/50">{mp.recipes.length} recette(s) planifiée(s)</span>
          </Link>
        ))}
      </div>
      {mealPlans.length === 0 && (
        <p className="text-ink/50 text-center py-12">Aucun planning pour l'instant.</p>
      )}
    </Layout>
  );
}
