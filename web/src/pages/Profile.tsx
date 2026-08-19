import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { User, Lock } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  diet: string | null;
  allergies: string[];
  defaultServings: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [diet, setDiet] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [defaultServings, setDefaultServings] = useState(4);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function loadProfile() {
    const res = await api.get("/auth/me");
    const p = res.data.user;
    setProfile(p);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setDiet(p.diet ?? "");
    setAllergiesInput(p.allergies.join(", "));
    setDefaultServings(p.defaultServings);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleUpdateInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoError(null);
    setInfoMessage(null);
    try {
      const allergies = allergiesInput.split(",").map((a) => a.trim()).filter(Boolean);
      await api.put("/auth/me", { firstName, lastName, diet: diet || null, allergies, defaultServings });
      setInfoMessage("Profil mis à jour avec succès");
      loadProfile();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setInfoError(typeof errData === "string" ? errData : "Erreur lors de la mise à jour");
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    try {
      await api.put("/auth/me", { currentPassword, newPassword });
      setPasswordMessage("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setPasswordError(typeof errData === "string" ? errData : "Erreur lors du changement de mot de passe");
    }
  }

  if (!profile) return <Layout><p>Chargement...</p></Layout>;

  return (
    <Layout>
      <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">{profile.email}</p>
      <h1 className="font-display text-3xl font-bold mb-8">Mon profil</h1>

      <div className="grid grid-cols-2 gap-4">
        <form onSubmit={handleUpdateInfo} className="bg-paper border border-line rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-indigo" />
            <h2 className="font-display font-semibold">Informations</h2>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
            />
          </div>
          <input
            type="text"
            placeholder="Régime alimentaire ^(ex: végétarien^)"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
          />
          <input
            type="text"
            placeholder="Allergies séparées par des virgules"
            value={allergiesInput}
            onChange={(e) => setAllergiesInput(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
          />
          <label className="flex flex-col text-sm gap-1">
            Portions par défaut
            <input
              type="number"
              value={defaultServings}
              onChange={(e) => setDefaultServings(Number(e.target.value))}
              className="border border-line rounded-lg px-3 py-2 text-sm w-28"
              min={1}
            />
          </label>
          {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
          {infoError && <p className="text-red-500 text-sm">{infoError}</p>}
          <button type="submit" className="bg-indigo text-cream rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-light">
            Enregistrer
          </button>
        </form>

        <form onSubmit={handleUpdatePassword} className="bg-paper border border-line rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={18} className="text-paprika" />
            <h2 className="font-display font-semibold">Mot de passe</h2>
          </div>
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe ^(8 caractères min^)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-paprika"
          />
          {passwordMessage && <p className="text-green-600 text-sm">{passwordMessage}</p>}
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          <button type="submit" className="bg-paprika text-white rounded-lg py-2.5 text-sm font-medium hover:bg-paprika-dark">
            Changer le mot de passe
          </button>
        </form>
      </div>
    </Layout>
  );
}
