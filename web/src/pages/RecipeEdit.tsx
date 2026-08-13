import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

interface IngredientInput {
  name: string;
  quantity: string;
}

export default function RecipeEdit() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(10);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([{ name: "", quantity: "" }]);
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get(`/recipes/${recipeId}`).then((res) => {
      const r = res.data.recipe;
      setTitle(r.title);
      setSteps(r.steps);
      setPrepTime(r.prepTime);
      setCookTime(r.cookTime);
      setServings(r.servings);
      setIngredients(r.ingredients.map((i: any) => ({ name: i.name, quantity: i.quantity })));
      setTagsInput(r.tags.map((t: any) => t.name).join(", "));
      setLoaded(true);
    });
  }, [recipeId]);

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
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      await api.put(`/recipes/${recipeId}`, {
        title,
        steps,
        prepTime,
        cookTime,
        servings,
        ingredients: validIngredients,
        tags,
      });
      navigate(`/recipes/${recipeId}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur lors de la modification");
    }
  }

  if (!loaded) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to={`/recipes/${recipeId}`} className="text-sm text-purple-600">{"<- Retour a la recette"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Modifier la recette</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />

        <textarea
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
              <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 px-2">
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
          placeholder="Tags separes par des virgules"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
