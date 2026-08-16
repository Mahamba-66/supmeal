import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

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
        `${res.data.importedRecipes} recette(s) et ${res.data.importedCookbooks} cookbook(s) importes avec succes`
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
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Import / Export</h1>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Exporter mes donnees</h2>
        <p className="text-sm text-gray-500 mb-4">
          Telecharge toutes tes recettes personnelles et les cookbooks dont tu es proprietaire, au format JSON.
          Attention: ce fichier contiendra tes donnees en clair, lisibles par quiconque l'ouvre.
        </p>
        <button onClick={handleExport} className="bg-purple-600 text-white rounded px-4 py-2">
          Telecharger mes donnees
        </button>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Importer des donnees</h2>
        <p className="text-sm text-gray-500 mb-4">
          Selectionne un fichier JSON au format SUPMEAL. Les recettes et cookbooks importes te seront attribues
          en tant que createur.
        </p>
        <input
          type="file"
          accept="application/json"
          onChange={handleImport}
          disabled={importing}
          className="text-sm"
        />
        {importing && <p className="text-sm text-gray-500 mt-2">Import en cours...</p>}
        {result && <p className="text-sm text-green-600 mt-2">{result}</p>}
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
