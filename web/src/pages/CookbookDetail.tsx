import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { roleLabel } from "../lib/roles";
import Layout from "../components/Layout";
import type { CookbookDetail, Recipe } from "../lib/types";
import { ArrowLeft, MessageCircle, Pencil, Trash2, LogOut, Plus, UserMinus } from "lucide-react";

const FALLBACK_IMG = "https://commons.wikimedia.org/wiki/Special:FilePath/Thieboudienne.JPG";

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
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de l'invitation");
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/cookbooks/${cookbookId}`, { name: editName });
      setIsEditing(false);
      loadCookbook();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de la modification");
    }
  }

  async function handleDelete() {
    if (!confirm("Voulez-vous supprimer ce cookbook ?")) return;
    await api.delete(`/cookbooks/${cookbookId}`);
    alert("Cookbook supprimé avec succès");
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
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de l'ajout");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Exclure ce membre du cookbook ?")) return;
    try {
      await api.delete(`/cookbooks/${cookbookId}/members/${memberId}`);
      loadCookbook();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de l'exclusion");
    }
  }

  async function handleLeave() {
    if (!confirm("Voulez-vous quitter ce cookbook ?")) return;
    try {
      await api.post(`/cookbooks/${cookbookId}/leave`);
      alert("Vous avez quitté le cookbook");
      navigate("/cookbooks");
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur");
    }
  }

  if (!cookbook) return <Layout><p>Chargement...</p></Layout>;

  const isOwner = cookbook.myRole === "OWNER";
  const canAddRecipe = cookbook.myRole === "OWNER" || cookbook.myRole === "EDITOR";

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <Link to="/cookbooks" className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-paprika">
          <ArrowLeft size={14} /> Cookbooks
        </Link>
        <Link
          to={`/cookbooks/${cookbookId}/chat`}
          className="flex items-center gap-1.5 text-sm bg-indigo text-cream px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-light"
        >
          <MessageCircle size={14} /> Discussion
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        {isEditing ? (
          <form onSubmit={handleRename} className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-paprika text-white rounded-lg px-3 py-2 text-sm font-medium">
              Enregistrer
            </button>
          </form>
        ) : (
          <h1 className="font-display text-3xl font-bold">{cookbook.name}</h1>
        )}
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm hover:bg-paper">
              <Pencil size={14} /> Renommer
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        )}
        {!isOwner && (
          <button onClick={handleLeave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
            <LogOut size={14} /> Quitter
          </button>
        )}
      </div>

      {isOwner && cookbook.members && (
        <div className="bg-paper border border-line rounded-2xl p-5 mb-8">
          <h2 className="font-display font-semibold mb-3">Membres</h2>
          <ul className="flex flex-col gap-2 mb-4">
            {cookbook.members.map((m) => (
              <li key={m.id} className="flex justify-between items-center text-sm py-1.5 border-b border-line last:border-0">
                <span>
                  {m.user.firstName} {m.user.lastName}
                  <span className="text-ink/40 ml-1">({m.user.email})</span>
                  <span className="ml-2 font-mono text-xs uppercase text-paprika">{roleLabel(m.role)}</span>
                  {m.status === "PENDING" && <span className="ml-2 text-xs text-gold">en attente</span>}
                </span>
                {m.role !== "OWNER" && (
                  <button onClick={() => handleRemoveMember(m.id)} className="text-red-500 hover:text-red-700">
                    <UserMinus size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              placeholder="Email à inviter"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
              required
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm">
              <option value="READER">Lecteur</option>
              <option value="COMMENTER">Commentateur</option>
              <option value="EDITOR">Éditeur</option>
            </select>
            <button type="submit" className="bg-indigo text-cream rounded-lg px-4 py-2 text-sm font-medium">
              Inviter
            </button>
          </form>
        </div>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl font-semibold">Recettes</h2>
        {canAddRecipe && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddExisting(!showAddExisting)}
              className="text-sm border border-line rounded-lg px-3 py-1.5 hover:bg-paper"
            >
              Recette existante
            </button>
            <Link
              to={`/recipes/new?cookbookId=${cookbookId}`}
              className="flex items-center gap-1.5 text-sm bg-paprika text-white rounded-lg px-3 py-1.5 font-medium"
            >
              <Plus size={14} /> Nouvelle
            </Link>
          </div>
        )}
      </div>

      {showAddExisting && (
        <form onSubmit={handleAddExisting} className="flex gap-2 mb-6">
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Choisir une recette personnelle</option>
            {personalRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          <button type="submit" className="bg-indigo text-cream rounded-lg px-4 py-2 text-sm font-medium">
            Ajouter
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-4">
        {cookbook.recipes.map((r) => (
          <Link
            key={r.id}
            to={`/recipes/${r.id}`}
            className="group bg-paper border border-line rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-28 overflow-hidden bg-line">
              <img src={r.imageUrl || FALLBACK_IMG} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <p className="font-display font-semibold p-3 truncate">{r.title}</p>
          </Link>
        ))}
      </div>
      {cookbook.recipes.length === 0 && <p className="text-ink/50 text-sm">Aucune recette pour l'instant.</p>}
    </Layout>
  );
}
