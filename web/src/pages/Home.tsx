import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">SUPMEAL</h1>
      <p className="mt-4">Connecte en tant que {user?.firstName} {user?.lastName} ({user?.email})</p>
      <div className="mt-6 flex gap-4">
        <Link to="/cookbooks" className="bg-purple-600 text-white rounded px-4 py-2">
          Mes Cookbooks
        </Link>
        <Link to="/recipes" className="bg-purple-600 text-white rounded px-4 py-2">
          Mes Recettes
        </Link>
        <Link to="/mealplans" className="bg-purple-600 text-white rounded px-4 py-2">
          Mes Plannings
        </Link>
        <Link to="/invites" className="border rounded px-4 py-2">
          Invitations
        </Link>
      </div>
      <button onClick={logout} className="mt-6 bg-gray-200 rounded px-3 py-2">
        Se deconnecter
      </button>
    </div>
  );
}
