import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    localStorage.setItem("token", token);

    api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setAuth(token, res.data.user);
        navigate("/");
      })
      .catch(() => {
        navigate("/login");
      });
  }, [searchParams, navigate, setAuth]);

  return <div className="p-8 text-center">Connexion en cours...</div>;
}
