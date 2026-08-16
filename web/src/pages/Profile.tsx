import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

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
      await api.put("/auth/me", {
        firstName,
        lastName,
        diet: diet || null,
        allergies,
        defaultServings,
      });
      setInfoMessage("Profil mis a jour avec succes");
      loadProfile();
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setInfoError(typeof errData === "string" ? errData : "Erreur lors de la mise a jour");
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
      setPasswordMessage("Mot de passe modifie avec succes");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setPasswordError(typeof errData === "string" ? errData : "Erreur lors du changement de mot de passe");
    }
  }

  if (!profile) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link to="/" className="text-sm text-purple-600">{"<- Retour au tableau de bord"}</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Mon profil</h1>

      <p className="text-sm text-gray-500 mb-6">Email: {profile.email}</p>

      <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4 border rounded p-4 mb-6">
        <h2 className="font-semibold">Informations personnelles</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Prenom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
        </div>
        <input
          type="text"
          placeholder="Regime alimentaire (ex: vegetarien)"
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Allergies separees par des virgules"
          value={allergiesInput}
          onChange={(e) => setAllergiesInput(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <label className="flex flex-col text-sm gap-1">
          Portions par defaut
          <input
            type="number"
            value={defaultServings}
            onChange={(e) => setDefaultServings(Number(e.target.value))}
            className="border rounded px-3 py-2 w-32"
            min={1}
          />
        </label>
        {infoMessage && <p className="text-green-600 text-sm">{infoMessage}</p>}
        {infoError && <p className="text-red-500 text-sm">{infoError}</p>}
        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Enregistrer
        </button>
      </form>

      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 border rounded p-4">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <input
          type="password"
          placeholder="Mot de passe actuel"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Nouveau mot de passe (8 caracteres min)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        {passwordMessage && <p className="text-green-600 text-sm">{passwordMessage}</p>}
        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        <button type="submit" className="bg-purple-600 text-white rounded px-4 py-2">
          Changer le mot de passe
        </button>
      </form>
    </div>
  );
}
