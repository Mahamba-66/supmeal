import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Recipe } from "../lib/types";

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

  if (!recipe) return <div className="p-8">Chargement...</div>;

  const canEdit = recipe.authorId === currentUser?.id;
  const isPersonalRecipe = !recipe.cookbookId;
  const canComment =
    (isPersonalRecipe && canEdit) ||
    (!isPersonalRecipe &&
      recipe.myCookbookRole !== null &&
      recipe.myCookbookRole !== undefined &&
      recipe.myCookbookRole !== "READER");

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="flex gap-4 text-sm text-purple-600">
        <Link to="/">{"<- Tableau de bord"}</Link>
        <Link to="/recipes">{"<- Recettes"}</Link>
        <Link to="/cookbooks">{"<- Cookbooks"}</Link>
      </div>

      <div className="flex justify-between items-start mt-4 mb-4">
        <h1 className="text-2xl font-bold">{recipe.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFavorite}
            className={`px-3 py-1 rounded border ${isFavorited ? "bg-yellow-400 border-yellow-500" : "bg-white"}`}
          >
            {isFavorited ? "Favori" : "+ Favori"}
          </button>
          {canEdit && (
            <>
              <Link to={`/recipes/${recipeId}/edit`} className="px-3 py-1 rounded border bg-white">
                Modifier
              </Link>
              <button onClick={handleDelete} className="px-3 py-1 rounded border bg-red-50 text-red-600">
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Preparation: {recipe.prepTime} min - Cuisson: {recipe.cookTime} min - {recipe.servings} portions
      </p>

      <div className="flex gap-1 mb-6">
        {recipe.tags.map((t) => (
          <span key={t.id} className="text-xs bg-purple-100 text-purple-700 rounded px-2 py-0.5">
            {t.name}
          </span>
        ))}
      </div>

      <h2 className="font-semibold mb-2">Ingredients</h2>
      <ul className="mb-6 list-disc list-inside">
        {recipe.ingredients.map((i) => (
          <li key={i.id}>{i.quantity} {i.name}</li>
        ))}
      </ul>

      <h2 className="font-semibold mb-2">Etapes</h2>
      <p className="mb-6 whitespace-pre-line">{recipe.steps}</p>

      <h2 className="font-semibold mb-2">Commentaires</h2>
      <ul className="flex flex-col gap-2 mb-4">
        {comments.map((c) => {
          const isCommentAuthor = c.userId === currentUser?.id;
          const isEditingThis = editingCommentId === c.id;

          return (
            <li key={c.id} className="text-sm border-b pb-2">
              {isEditingThis ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="border rounded px-2 py-1 flex-1"
                  />
                  <button onClick={() => handleUpdateComment(c.id)} className="text-purple-600">
                    Enregistrer
                  </button>
                  <button onClick={cancelEditComment} className="text-gray-500">
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span>
                    <span className="font-semibold">{c.user.firstName} {c.user.lastName}</span>: {c.content}
                  </span>
                  {isCommentAuthor && (
                    <span className="flex gap-2 text-xs">
                      <button onClick={() => startEditComment(c)} className="text-purple-600">
                        Modifier
                      </button>
                      <button onClick={() => handleDeleteComment(c.id)} className="text-red-600">
                        Supprimer
                      </button>
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {comments.length === 0 && <p className="text-gray-500 text-sm">Aucun commentaire.</p>}
      </ul>

      {canComment && (
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un commentaire"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
            Envoyer
          </button>
        </form>
      )}
    </div>
  );
}
