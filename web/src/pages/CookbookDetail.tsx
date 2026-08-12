import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { CookbookDetail } from "../lib/types";

export default function CookbookDetailPage() {
  const { cookbookId } = useParams();
  const [cookbook, setCookbook] = useState<CookbookDetail | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("READER");
  const [error, setError] = useState<string | null>(null);

  async function loadCookbook() {
    const res = await api.get(`/cookbooks/${cookbookId}`);
    setCookbook(res.data.cookbook);
  }

  useEffect(() => {
    loadCookbook();
  }, [cookbookId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/cookbooks/${cookbookId}/invite`, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      loadCookbook();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur lors de l'invitation");
    }
  }

  if (!cookbook) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/cookbooks" className="text-sm text-purple-600">{"<- Retour"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">{cookbook.name}</h1>

      <h2 className="text-lg font-semibold mb-2">Membres</h2>
      <ul className="flex flex-col gap-2 mb-6">
        {cookbook.members.map((m) => (
          <li key={m.id} className="text-sm">
            {m.user.firstName} {m.user.lastName} ({m.user.email}) - <span className="font-semibold">{m.role}</span>
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
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <h2 className="text-lg font-semibold mb-2">Recettes</h2>
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
