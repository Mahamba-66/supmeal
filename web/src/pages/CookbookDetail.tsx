import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { CookbookDetail, Recipe } from "../lib/types";

export default function CookbookDetailPage() {
  const { cookbookId } = useParams();
  const navigate = useNavigate();
  const [cookbook, setCookbook] = useState<CookbookDetail | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("READER");
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalRecipes, setPersonalRecipes] = useState<Recipe[]>([]);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  async function loadCookbook() {
    const res = await api.get(`/cookbooks/${cookbookId}`);
    setCookbook(res.data.cookbook);
    setEditName(res.data.cookbook.name);
  }

  async function loadPersonalRecipes() {
    const res = await api.get("/recipes");
    const perso = res.data.recipes.filter((r: Recipe) => !r.cookbookId);
    setPersonalRecipes(perso);
  }

  useEffect(() => {
    loadCookbook();
    loadPersonalRecipes();
  }, [cookbookId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/cookbooks/${cookbookId}/invite`, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      loadCookbook();
    } catch (err: any) {
      const errData44 = err.response?.data?.error;
setError(typeof errData44 === "string" ? errData44 : "Erreur lors de l'invitation");
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/cookbooks/${cookbookId}`, { name: editName });
      setIsEditing(false);
      loadCookbook();
    } catch (err: any) {
      const errData55 = err.response?.data?.error;
setError(typeof errData55 === "string" ? errData55 : "Erreur lors de la modification");
    }
  }

  async function handleDelete() {
    if (!confirm("Voulez-vous supprimer ce cookbook ?")) return;
    await api.delete(`/cookbooks/${cookbookId}`);
    alert("Cookbook supprime avec succes");
    navigate("/cookbooks");
  }

  async function handleAddExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecipeId) return;
    try {
      await api.post(`/recipes/${selectedRecipeId}/add-to-cookbook`, { cookbookId });
      setSelectedRecipeId("");
      setShowAddExisting(false);
      loadCookbook();
      loadPersonalRecipes();
    } catch (err: any) {
     const errData76 = err.response?.data?.error;
setError(typeof errData76 === "string" ? errData76 : "Erreur lors de l'ajout");
    }
  }

  if (!cookbook) return <div className="p-8">Chargement...</div>;

  const isOwner = cookbook.myRole === "OWNER";
  const canAddRecipe = cookbook.myRole === "OWNER" || cookbook.myRole === "EDITOR";

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center">
  <Link to="/cookbooks" className="text-sm text-purple-600">{"<- Retour"}</Link>
  <Link to={`/cookbooks/${cookbookId}/chat`} className="text-sm text-purple-600">Discussion {"->"}</Link>
</div>

      <div className="flex justify-between items-center mt-2 mb-6">
        {isEditing ? (
          <form onSubmit={handleRename} className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button type="submit" className="bg-purple-600 text-white rounded px-3 py-2 text-sm">
              Enregistrer
            </button>
          </form>
        ) : (
          <h1 className="text-2xl font-bold">{cookbook.name}</h1>
        )}
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="px-3 py-1 rounded border bg-white text-sm">
              Renommer
            </button>
            <button onClick={handleDelete} className="px-3 py-1 rounded border bg-red-50 text-red-600 text-sm">
              Supprimer
            </button>
          </div>
        )}
      </div>

      {isOwner && cookbook.members && (
        <>
          <h2 className="text-lg font-semibold mb-2">Membres</h2>
          <ul className="flex flex-col gap-2 mb-6">
            {cookbook.members.map((m) => (
              <li key={m.id} className="text-sm">
                {m.user.firstName} {m.user.lastName} ({m.user.email}) - <span className="font-semibold">{m.role}</span>
                {m.status === "PENDING" && <span className="ml-2 text-xs text-orange-500">(en attente)</span>}
              </li>
            ))}
          </ul>

          <form onSubmit={handleInvite} className="flex gap-2 mb-8">
            <input
              type="email"
              placeholder="Email a inviter"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
              required
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="border rounded px-3 py-2">
              <option value="READER">Lecteur</option>
              <option value="COMMENTER">Commentateur</option>
              <option value="EDITOR">Editeur</option>
            </select>
            <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
              Inviter
            </button>
          </form>
        </>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Recettes</h2>
        {canAddRecipe && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddExisting(!showAddExisting)}
              className="border rounded px-3 py-1 text-sm"
            >
              + Recette existante
            </button>
            <Link
              to={`/recipes/new?cookbookId=${cookbookId}`}
              className="bg-purple-600 text-white rounded px-3 py-1 text-sm"
            >
              + Nouvelle recette
            </Link>
          </div>
        )}
      </div>

      {showAddExisting && (
        <form onSubmit={handleAddExisting} className="flex gap-2 mb-4">
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          >
            <option value="">Choisir une recette personnelle</option>
            {personalRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2 text-sm">
            Ajouter
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {cookbook.recipes.map((r) => (
          <li key={r.id}>
            <Link to={`/recipes/${r.id}`} className="block border rounded px-4 py-3 hover:bg-gray-50">
              {r.title}
            </Link>
          </li>
        ))}
        {cookbook.recipes.length === 0 && <p className="text-gray-500">Aucune recette pour l'instant.</p>}
      </ul>
    </div>
  );
}
