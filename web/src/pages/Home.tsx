import { useAuthStore } from "../store/authStore";

export default function Home() {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">SUPMEAL</h1>
      <p className="mt-4">Connecte en tant que {user?.firstName} {user?.lastName} ({user?.email})</p>
      <button onClick={logout} className="mt-4 bg-gray-200 rounded px-3 py-2">
        Se deconnecter
      </button>
    </div>
  );
}
