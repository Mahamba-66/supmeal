import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Cookbook } from "../lib/types";

export default function Cookbooks() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadCookbooks() {
    const res = await api.get("/cookbooks");
    setCookbooks(res.data.cookbooks);
  }

  useEffect(() => {
    loadCookbooks();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/cookbooks", { name });
      setName("");
      loadCookbooks();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur lors de la creation");
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Mes Cookbooks</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Nom du cookbook"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
          required
        />
        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Creer
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <ul className="flex flex-col gap-3">
        {cookbooks.map((cb) => (
          <li key={cb.id}>
            <Link
              to={`/cookbooks/${cb.id}`}
              className="block border rounded px-4 py-3 hover:bg-gray-50"
            >
              <span className="font-semibold">{cb.name}</span>
              <span className="ml-2 text-sm text-gray-500">({cb.myRole})</span>
            </Link>
          </li>
        ))}
        {cookbooks.length === 0 && <p className="text-gray-500">Aucun cookbook pour l'instant.</p>}
      </ul>
    </div>
  );
}
