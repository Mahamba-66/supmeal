import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/Layout";
import type { Recipe } from "../lib/types";
import { Clock, Users, Star, Pencil, Trash2, ArrowLeft } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200^&q=80";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId?: string;
  user: { firstName: string; lastName: string };
}

export default function RecipeDetail() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const currentUser = useAuthStore((s) => s.user);

  async function loadRecipe() {
    const res = await api.get(`/recipes/${recipeId}`);
    setRecipe(res.data.recipe);
    setComments(res.data.recipe.comments ?? []);
  }

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  async function toggleFavorite() {
    const res = await api.post(`/recipes/${recipeId}/favorite`);
    setIsFavorited(res.data.favorited);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await api.post(`/recipes/${recipeId}/comments`, { content: newComment });
    setComments([...comments, res.data.comment]);
    setNewComment("");
  }

  function startEditComment(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingContent("");
  }

  async function handleUpdateComment(commentId: string) {
    if (!editingContent.trim()) return;
    const res = await api.put(`/recipes/${recipeId}/comments/${commentId}`, { content: editingContent });
    setComments(comments.map((c) => (c.id === commentId ? res.data.comment : c)));
    cancelEditComment();
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Voulez-vous supprimer ce commentaire ?")) return;
    await api.delete(`/recipes/${recipeId}/comments/${commentId}`);
    setComments(comments.filter((c) => c.id !== commentId));
  }

  async function handleDelete() {
    if (!confirm("Voulez-vous supprimer cette recette ?")) return;
    await api.delete(`/recipes/${recipeId}`);
    alert("Recette supprimee avec succes");
    navigate("/recipes");
  }

  if (!recipe) return <Layout><p>Chargement...</p></Layout>;

  const canEdit = recipe.authorId === currentUser?.id;
  const isPersonalRecipe = !recipe.cookbookId;
  const canComment =
    (isPersonalRecipe && canEdit) ||
    (!isPersonalRecipe &&
      recipe.myCookbookRole !== null &&
      recipe.myCookbookRole !== undefined &&
      recipe.myCookbookRole !== "READER");

  return (
    <Layout>
      <Link to="/recipes" className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-paprika mb-4">
        <ArrowLeft size={14} /> Recettes
      </Link>

      <div className="relative h-72 rounded-2xl overflow-hidden mb-6 bg-line">
        <img src={recipe.imageUrl || FALLBACK_IMG} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
          <h1 className="font-display text-3xl font-bold text-white">{recipe.title}</h1>
          <button
            onClick={toggleFavorite}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              isFavorited ? "bg-gold text-indigo" : "bg-white/20 text-white backdrop-blur"
            }`}
          >
            <Star size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6 font-mono text-sm text-ink/60">
          <span className="flex items-center gap-1.5"><Clock size={15} /> {recipe.prepTime + recipe.cookTime} min</span>
          <span className="flex items-center gap-1.5"><Users size={15} /> {recipe.servings} portions</span>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/recipes/${recipeId}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm hover:bg-cream">
              <Pencil size={14} /> Modifier
            </Link>
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mb-8">
        {recipe.tags.map((t) => (
          <span key={t.id} className="text-xs bg-paprika/10 text-paprika-dark rounded-full px-3 py-1 font-medium">
            {t.name}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div>
          <h2 className="font-display font-semibold text-lg mb-3">Ingredients</h2>
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((i) => (
              <li key={i.id} className="text-sm flex justify-between border-b border-line pb-2">
                <span>{i.name}</span>
                <span className="font-mono text-ink/50">{i.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2">
          <h2 className="font-display font-semibold text-lg mb-3">Preparation</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink/80">{recipe.steps}</p>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-line">
        <h2 className="font-display font-semibold text-lg mb-4">Commentaires</h2>
        <ul className="flex flex-col gap-3 mb-4">
          {comments.map((c) => {
            const isCommentAuthor = c.userId === currentUser?.id;
            const isEditingThis = editingCommentId === c.id;
            return (
              <li key={c.id} className="text-sm bg-paper border border-line rounded-xl p-3">
                {isEditingThis ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="border border-line rounded px-2 py-1 flex-1 text-sm"
                    />
                    <button onClick={() => handleUpdateComment(c.id)} className="text-paprika text-xs font-medium">Enregistrer</button>
                    <button onClick={cancelEditComment} className="text-ink/40 text-xs">Annuler</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>
                      <span className="font-semibold">{c.user.firstName} {c.user.lastName}</span>: {c.content}
                    </span>
                    {isCommentAuthor && (
                      <span className="flex gap-2 text-xs shrink-0 ml-2">
                        <button onClick={() => startEditComment(c)} className="text-paprika">Modifier</button>
                        <button onClick={() => handleDeleteComment(c.id)} className="text-red-500">Supprimer</button>
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {comments.length === 0 && <p className="text-ink/40 text-sm">Aucun commentaire.</p>}
        </ul>

        {canComment && (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un commentaire"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:border-paprika"
            />
            <button type="submit" className="bg-indigo text-cream rounded-lg px-4 py-2 text-sm font-medium">
              Envoyer
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
