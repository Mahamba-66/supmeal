import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Cookbook } from "../lib/types";

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
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [cookbookId, setCookbookId] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      setCurrentImageUrl(r.imageUrl);
      setCookbookId(r.cookbookId ?? "");
      setLoaded(true);
    });
    api.get("/cookbooks").then((res) => {
      const editable = res.data.cookbooks.filter(
        (cb: Cookbook) => cb.myRole === "OWNER" || cb.myRole === "EDITOR"
      );
      setCookbooks(editable);
    });
  }, [recipeId]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

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
      let imageUrl: string | undefined;

      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = `http://localhost:3000${uploadRes.data.imageUrl}`;
        setUploading(false);
      }

      await api.put(`/recipes/${recipeId}`, {
        title,
        steps,
        prepTime,
        cookTime,
        servings,
        ingredients: validIngredients,
        tags,
        cookbookId: cookbookId || null,
        ...(imageUrl ? { imageUrl } : {}),
      });
      navigate(`/recipes/${recipeId}`);
    } catch (err: any) {
      setUploading(false);
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de la modification");
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

        <div>
          <label className="text-sm font-medium mb-1 block">Photo de la recette</label>
          <img
            src={imagePreview || currentImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600^&q=80"}
            alt="Apercu"
            className="w-full h-48 object-cover rounded mb-2"
          />
          <input
            id="recipe-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <label
            htmlFor="recipe-image-input"
            className="inline-block cursor-pointer bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded px-4 py-2"
          >
            Choisir une photo
          </label>
          <p className="text-xs text-gray-500 mt-1">Laisser vide pour garder la photo actuelle</p>
        </div>

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

        <button type="submit" disabled={uploading} className="bg-purple-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {uploading ? "Envoi de la photo..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
