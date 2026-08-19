import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { ChefHat, BookOpen, CalendarDays, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuthStore();
  const [recipeCount, setRecipeCount] = useState(0);
  const [cookbookCount, setCookbookCount] = useState(0);
  const [mealPlanCount, setMealPlanCount] = useState(0);

  useEffect(() => {
    api.get("/recipes").then((res) => setRecipeCount(res.data.recipes.length));
    api.get("/cookbooks").then((res) => setCookbookCount(res.data.cookbooks.length));
    api.get("/mealplans").then((res) => setMealPlanCount(res.data.mealPlans.length));
  }, []);

  const stats = [
    { label: "Recettes", value: recipeCount, icon: ChefHat, to: "/recipes" },
    { label: "Cookbooks", value: cookbookCount, icon: BookOpen, to: "/cookbooks" },
    { label: "Plannings", value: mealPlanCount, icon: CalendarDays, to: "/mealplans" },
  ];

  return (
    <Layout>
      <p className="font-mono text-xs uppercase tracking-widest text-paprika mb-2">
        Bonjour {user?.firstName}
      </p>
      <h1 className="font-display text-3xl font-bold mb-8">Votre tableau de bord</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.to}
              className="bg-paper border border-line rounded-2xl p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-paprika/10 flex items-center justify-center">
                  <Icon size={20} className="text-paprika" />
                </div>
                <ArrowRight size={16} className="text-ink/30 group-hover:text-paprika transition-colors" />
              </div>
              <p className="font-display text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-ink/60">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/recipes/new"
          className="bg-indigo text-cream rounded-2xl p-6 flex items-center justify-between hover:bg-indigo-light transition-colors"
        >
          <div>
            <p className="font-display text-lg font-semibold">Nouvelle recette</p>
            <p className="text-sm text-cream/60">Ajoutez une recette a votre carnet</p>
          </div>
          <ArrowRight size={20} />
        </Link>
        <Link
          to="/cookbooks"
          className="bg-paper border border-line rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <p className="font-display text-lg font-semibold">Creer un cookbook</p>
            <p className="text-sm text-ink/60">Partagez vos recettes en groupe</p>
          </div>
          <ArrowRight size={20} className="text-paprika" />
        </Link>
      </div>
    </Layout>
  );
}
