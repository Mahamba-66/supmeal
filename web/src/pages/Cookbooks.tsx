import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { roleLabel } from "../lib/roles";
import Layout from "../components/Layout";
import type { Cookbook } from "../lib/types";
import { Plus, Users, ArrowRight } from "lucide-react";

export default function Cookbooks() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      loadCookbooks();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Erreur lors de la création");
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">Cuisine collective</p>
          <h1 className="font-display text-3xl font-bold">Cookbooks</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo text-cream px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-light transition-colors"
        >
          <Plus size={16} />
          Nouveau cookbook
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-8 bg-paper border border-line rounded-xl p-4">
          <input
            type="text"
            placeholder="Nom du cookbook ^(ex: Recettes de famille^)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
            required
            autoFocus
          />
          <button type="submit" className="bg-paprika text-white rounded-lg px-4 py-2 text-sm font-medium">
            Créer
          </button>
        </form>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {cookbooks.map((cb) => (
          <Link
            key={cb.id}
            to={`/cookbooks/${cb.id}`}
            className="group bg-paper border border-line rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo/10 flex items-center justify-center">
                <Users size={18} className="text-indigo" />
              </div>
              <ArrowRight size={16} className="text-ink/30 group-hover:text-paprika transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{cb.name}</h3>
            <span className="text-xs font-mono uppercase tracking-wide text-ink/50">{roleLabel(cb.myRole ?? "")}</span>
          </Link>
        ))}
      </div>
      {cookbooks.length === 0 && (
        <p className="text-ink/50 text-center py-12">Aucun cookbook pour l'instant. Créez-en un pour partager vos recettes.</p>
      )}
    </Layout>
  );
}
