import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const HERO_IMG = "/Thieb.jpeg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      const errData = err.response?.data?.error;
      setError(typeof errData === "string" ? errData : "Email ou mot de passe incorrect");
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={HERO_IMG} alt="Thiéboudienne" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo/90 via-indigo/20 to-transparent" />
        
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-mono text-xs uppercase tracking-widest text-gold mb-3">Le carnet partagé</p>
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Vos recettes,<br />vos plannings,<br />votre équipe en cuisine.
          </h2>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-sm">
          <p className="font-display text-2xl font-bold mb-1">SUPMEAL</p>
          <h1 className="text-2xl font-semibold mb-8">Content de vous revoir</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <label className="text-sm font-medium text-ink/70 mb-1 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper focus:outline-none focus:border-paprika"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-indigo text-cream rounded-lg py-2.5 font-medium hover:bg-indigo-light transition-colors mt-2"
            >
              Se connecter
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink/40">ou</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <a           href="http://localhost:3000/auth/google"
            className="flex items-center justify-center gap-2 border border-line rounded-lg py-2.5 text-sm font-medium hover:bg-paper transition-colors"
          >
            Continuer avec Google
          </a>

          <p className="mt-6 text-sm text-center text-ink/60">
            Pas de compte ? <Link to="/register" className="text-paprika font-medium">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
