import { useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { Download, Upload, AlertTriangle } from "lucide-react";

export default function DataManagement() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    try {
      const res = await api.get("/data/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "supmeal-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur lors de l'export");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await api.post("/data/import", data);
      setResult(
        `${res.data.importedRecipes} recette(s) et ${res.data.importedCookbooks} cookbook(s) importés avec succès`
      );
    } catch (err: any) {
      const errData = err.response?.data?.error;
      const message = typeof errData === "string" ? errData : "Fichier invalide ou erreur lors de l'import";
      setError(message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <Layout>
      <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">Vos données</p>
      <h1 className="font-display text-3xl font-bold mb-8">Import / Export</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-paper border border-line rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-indigo/10 flex items-center justify-center mb-4">
            <Download size={18} className="text-indigo" />
          </div>
          <h2 className="font-display font-semibold mb-2">Exporter mes données</h2>
          <p className="text-sm text-ink/60 mb-4">
            Télécharge tes recettes personnelles et les cookbooks dont tu es propriétaire, au format JSON.
            Ce fichier contient tes données en clair.
          </p>
          <button onClick={handleExport} className="bg-indigo text-cream rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-light">
            Télécharger
          </button>
        </div>

        <div className="bg-paper border border-line rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-4">
            <Upload size={18} className="text-paprika-dark" />
          </div>
          <h2 className="font-display font-semibold mb-2">Importer des données</h2>
          <p className="text-sm text-ink/60 mb-4">
            Sélectionne un fichier JSON au format SUPMEAL. Les éléments importés te seront attribués comme créateur.
          </p>
          <input
            id="import-file-input"
            type="file"
            accept="application/json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
          <label
            htmlFor="import-file-input"
            className="inline-block cursor-pointer bg-paprika text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-paprika-dark"
          >
            Choisir un fichier
          </label>
          {importing && <p className="text-sm text-ink/50 mt-2">Import en cours...</p>}
          {result && <p className="text-sm text-green-600 mt-2">{result}</p>}
          {error && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
