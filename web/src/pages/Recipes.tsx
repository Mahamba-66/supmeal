import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/Layout";
import type { Recipe } from "../lib/types";
import { Search, Star, Clock, Plus } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600^&q=80";

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  async function loadRecipes() {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (favoriteOnly) params.favorite = "true";
    const res = await api.get("/recipes", { params });
    setRecipes(res.data.recipes);
  }

  useEffect(() => {
    loadRecipes();
  }, [query, favoriteOnly]);

  return (
    <Layout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">Votre carnet</p>
          <h1 className="font-display text-3xl font-bold">Recettes</h1>
        </div>
        <Link
          to="/recipes/new"
          className="flex items-center gap-2 bg-indigo text-cream px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-light transition-colors"
        >
          <Plus size={16} />
          Nouvelle recette
        </Link>
      </div>

      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Chercher une recette, un ingredient..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-paper border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-paprika"
          />
        </div>
        <button
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            favoriteOnly ? "bg-gold/20 border-gold text-paprika-dark" : "bg-paper border-line text-ink/60"
          }`}
        >
          <Star size={16} fill={favoriteOnly ? "currentColor" : "none"} />
          Favoris
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {recipes.map((r) => {
          const isFav = r.favorites?.some((f) => f.userId === currentUser?.id);
          return (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="group bg-paper border border-line rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-40 overflow-hidden bg-line">
                <img
                  src={r.imageUrl || FALLBACK_IMG}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isFav && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Star size={14} className="text-gold" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-lg mb-1 truncate">{r.title}</h3>
                <div className="flex items-center gap-3 text-xs text-ink/50 font-mono mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {r.prepTime + r.cookTime} min
                  </span>
                  <span>{r.servings} portions</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {r.tags.slice(0, 3).map((t) => (
                    <span key={t.id} className="text-xs bg-cream border border-line rounded-full px-2 py-0.5 text-ink/60">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {recipes.length === 0 && (
        <p className="text-ink/50 text-center py-12">Aucune recette trouvee. Creez-en une pour commencer.</p>
      )}
    </Layout>
  );
}
