import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Recipe } from "../lib/types";

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
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <div className="flex justify-between items-center mt-2 mb-6">
        <h1 className="text-2xl font-bold">Mes Recettes</h1>
        <Link to="/recipes/new" className="bg-purple-600 text-white rounded px-4 py-2">
          Nouvelle recette
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={favoriteOnly}
            onChange={(e) => setFavoriteOnly(e.target.checked)}
          />
          Favoris uniquement
        </label>
      </div>

      <ul className="flex flex-col gap-3">
        {recipes.map((r) => {
          const isFav = r.favorites?.some((f) => f.userId === currentUser?.id);
          return (
            <li key={r.id}>
              <Link to={`/recipes/${r.id}`} className="block border rounded px-4 py-3 hover:bg-gray-50">
                <span className="font-semibold">{r.title}</span>
                {isFav && <span className="ml-2 text-yellow-500">*Favori</span>}
                <span className="ml-2 text-sm text-gray-500">
                  {r.prepTime + r.cookTime} min - {r.servings} portions
                  {r.author && (
                    r.author.id === currentUser?.id
                      ? " - Crée par vous"
                      : ` - Crée par ${r.author.firstName} ${r.author.lastName} (${r.author.email})`
                  )}
                </span>
                <div className="mt-1 flex gap-1">
                  {r.tags.map((t) => (
                    <span key={t.id} className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-0.5">
                      {t.name}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
        {recipes.length === 0 && <p className="text-gray-500">Aucune recette trouvee.</p>}
      </ul>
    </div>
  );
}
