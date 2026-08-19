import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import type { Cookbook } from "../lib/types";
import { ArrowLeft, X } from "lucide-react";

interface IngredientInput {
  name: string;
  quantity: string;
}

const PLACEHOLDER_IMG = "https://commons.wikimedia.org/wiki/Special:FilePath/Thieboudienne.JPG";

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

  if (!loaded) return <Layout><p>Chargement...</p></Layout>;

  return (
    <Layout>
      <Link to={`/recipes/${recipeId}`} className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-paprika mb-4">
        <ArrowLeft size={14} /> Retour à la recette
      </Link>
      <h1 className="font-display text-3xl font-bold mb-8">Modifier la recette</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-line rounded-lg px-3 py-2.5 text-lg font-display font-semibold focus:outline-none focus:border-paprika"
          required
        />

        <div>
          <label className="text-sm font-medium mb-2 block">Photo</label>
          <img src={imagePreview || currentImageUrl || PLACEHOLDER_IMG} alt="Aperçu" className="w-full h-48 object-cover rounded-xl mb-2" />
          <input id="recipe-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <label htmlFor="recipe-image-input" className="inline-block cursor-pointer bg-cream border border-line hover:bg-line/50 text-sm font-medium rounded-lg px-4 py-2">
            Choisir une photo
          </label>
          <p className="text-xs text-ink/50 mt-1">Laisser vide pour garder la photo actuelle</p>
        </div>

        <label className="flex flex-col text-sm gap-1">
          Emplacement
          <select value={cookbookId} onChange={(e) => setCookbookId(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">Recette personnelle</option>
            {cookbooks.map((cb) => (<option key={cb.id} value={cb.id}>{cb.name}</option>))}
          </select>
        </label>

        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm min-h-32 focus:outline-none focus:border-paprika"
          required
        />

        <div className="flex gap-4">
          <label className="flex flex-col text-sm gap-1">
            Préparation (min)
            <input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} className="border border-line rounded-lg px-3 py-2 text-sm w-24" min={0} />
          </label>
          <label className="flex flex-col text-sm gap-1">
            Cuisson (min)
            <input type="number" value={cookTime} onChange={(e) => setCookTime(Number(e.target.value))} className="border border-line rounded-lg px-3 py-2 text-sm w-24" min={0} />
          </label>
          <label className="flex flex-col text-sm gap-1">
            Portions
            <input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="border border-line rounded-lg px-3 py-2 text-sm w-24" min={1} />
          </label>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-2">Ingrédients</h2>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" placeholder="Nom" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm flex-1" />
              <input type="text" placeholder="Quantité" value={ing.quantity} onChange={(e) => updateIngredient(i, "quantity", e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm w-32" />
              <button type="button" onClick={() => removeIngredient(i)} className="text-ink/30 hover:text-red-500"><X size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="text-sm text-paprika font-medium">+ Ajouter un ingrédient</button>
        </div>

        <input
          type="text"
          placeholder="Tags séparés par des virgules"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={uploading} className="bg-indigo text-cream rounded-lg py-2.5 font-medium hover:bg-indigo-light disabled:opacity-50">
          {uploading ? "Envoi de la photo..." : "Enregistrer"}
        </button>
      </form>
    </Layout>
  );
}
