import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const HERO_IMG = "/Mafe.jpeg";

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
      setError(typeof errData === "string" ? errData : "Vérifiez les informations saisies");
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo/90 via-indigo/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
         
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Créez, partagez<br />et planifiez<br />vos repas ensemble.
          </h2>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-sm">
          <p className="font-display text-2xl font-bold mb-1">SUPMEAL</p>
          <h1 className="text-2xl font-semibold mb-8">Créer un compte</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-ink/70 mb-1 block">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-ink/70 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1 block">Date de naissance</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70 mb-1 block">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 bg-paper focus:outline-none ${passwordsMismatch ? "border-red-400" : "border-line focus:border-paprika"}`}
                required
              />
              {passwordsMismatch && <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={passwordsMismatch}
              className="bg-indigo text-cream rounded-lg py-2.5 font-medium hover:bg-indigo-light transition-colors mt-2 disabled:opacity-50"
            >
              S'inscrire
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink/40">ou</span>
            <div className="flex-1 h-px bg-line" />
          </div>
<a
          href="http://localhost:3000/auth/google"
            className="flex items-center justify-center gap-2 border border-line rounded-lg py-2.5 text-sm font-medium hover:bg-paper transition-colors"
          >
            Continuer avec Google
          </a>

          <p className="mt-6 text-sm text-center text-ink/60">
            Déjà un compte ? <Link to="/login" className="text-paprika font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
