import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import {
  BookOpen,
  ChefHat,
  CalendarDays,
  Mail,
  Download,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get("/cookbooks/invites/pending").then((res) => {
      setPendingCount(res.data.invites.length);
    }).catch(() => {});
  }, [location.pathname]);

  const NAV_ITEMS = [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/cookbooks", label: "Cookbooks", icon: BookOpen },
    { to: "/recipes", label: "Recettes", icon: ChefHat },
    { to: "/mealplans", label: "Plannings", icon: CalendarDays },
    { to: "/invites", label: "Invitations", icon: Mail, badge: pendingCount },
    { to: "/data", label: "Import / Export", icon: Download },
    { to: "/profile", label: "Mon profil", icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-64 bg-indigo text-cream flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="font-display text-xl font-bold tracking-tight">
            SUPMEAL
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? "bg-paprika text-white"
                    : "text-cream/70 hover:bg-white/10 hover:text-cream"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
                {item.badge ? item.badge > 0 && (
                  <span className="ml-auto bg-gold text-indigo text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-cream/50 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/70 hover:bg-white/10 hover:text-cream transition-colors"
          >
            <LogOut size={18} strokeWidth={2} />
            Se deconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
