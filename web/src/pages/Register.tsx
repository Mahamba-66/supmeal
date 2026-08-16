import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        dateOfBirth,
        password,
      });
      setAuth(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
     const errData = err.response?.data?.error;
const message = typeof errData === "string"
  ? errData
  : "Verifiez les informations saisies (mot de passe 8 caracteres min, date valide)";
setError(message);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-6">Inscription</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Prenom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="date"
          placeholder="Date de naissance"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (8 caracteres min)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`border rounded px-3 py-2 ${passwordsMismatch ? "border-red-500" : ""}`}
          required
        />
        {passwordsMismatch && (
          <p className="text-red-500 text-sm">Les mots de passe ne correspondent pas</p>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={passwordsMismatch}
          className="bg-purple-600 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          S'inscrire
        </button>
      </form>
      <div className="mt-4 text-center">
  <a href="http://localhost:3000/auth/google" className="inline-block border rounded px-4 py-2 text-sm">
    Se connecter avec Google
  </a>
</div>
      <p className="mt-4 text-sm">
        Deja un compte ? <Link to="/login" className="text-purple-600">Se connecter</Link>
      </p>
    </div>
  );
}
