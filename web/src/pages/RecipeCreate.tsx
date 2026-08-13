import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Cookbook } from "../lib/types";

interface IngredientInput {
  name: string;
  quantity: string;
}

export default function RecipeCreate() {
  const [searchParams] = useSearchParams();
  const preselectedCookbookId = searchParams.get("cookbookId") ?? "";

  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(10);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([{ name: "", quantity: "" }]);
  const [tagsInput, setTagsInput] = useState("");
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [cookbookId, setCookbookId] = useState(preselectedCookbookId);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/cookbooks").then((res) => {
      const editable = res.data.cookbooks.filter(
        (cb: Cookbook) => cb.myRole === "OWNER" || cb.myRole === "EDITOR"
      );
      setCookbooks(editable);
    });
  }, []);

  function updateIngredient(index: number, field: keyof IngredientInput, value: string) {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  }

  function addIngredient() {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validIngredients = ingredients.filter((i) => i.name.trim() && i.quantity.trim());
    if (validIngredients.length === 0) {
      setError("Ajoutez au moins un ingredient");
      return;
    }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const res = await api.post("/recipes", {
        title,
        steps,
        prepTime,
        cookTime,
        servings,
        ingredients: validIngredients,
        tags,
        ...(cookbookId ? { cookbookId } : {}),
      });
      navigate(`/recipes/${res.data.recipe.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur lors de la creation");
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/recipes" className="text-sm text-purple-600">{"<- Retour aux recettes"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Nouvelle recette</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Titre de la recette"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />

        <label className="flex flex-col text-sm gap-1">
          Emplacement
          <select
            value={cookbookId}
            onChange={(e) => setCookbookId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Recette personnelle</option>
            {cookbooks.map((cb) => (
              <option key={cb.id} value={cb.id}>{cb.name}</option>
            ))}
          </select>
        </label>

        <textarea
          placeholder="Etapes de preparation"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="border rounded px-3 py-2 min-h-32"
          required
        />

        <div className="flex gap-4">
          <label className="flex flex-col text-sm gap-1">
            Preparation (min)
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
              min={0}
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            Cuisson (min)
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
              min={0}
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            Portions
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
              min={1}
            />
          </label>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Ingredients</h2>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nom"
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
              <input
                type="text"
                placeholder="Quantite"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                className="border rounded px-3 py-2 w-32"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="text-red-500 px-2"
              >
                x
              </button>
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="text-sm text-purple-600">
            + Ajouter un ingredient
          </button>
        </div>

        <input
          type="text"
          placeholder="Tags separes par des virgules (ex: italien, rapide)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Creer la recette
        </button>
      </form>
    </div>
  );
}
