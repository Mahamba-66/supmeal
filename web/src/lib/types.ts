export interface Cookbook {
  id: string;
  name: string;
  createdAt: string;
  myRole?: string;
}

export interface CookbookMember {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface CookbookDetail extends Cookbook {
  members?: CookbookMember[];
  recipes: Recipe[];
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Favorite {
  id: string;
  userId: string;
}

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Recipe {
  id: string;
  title: string;
  steps: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string | null;
  source: string | null;
  authorId: string;
  cookbookId: string | null;
  ingredients: Ingredient[];
  tags: Tag[];
  favorites?: Favorite[];
  myCookbookRole?: string | null;
  author?: Author;
}

export interface PendingInvite {
  id: string;
  role: string;
  cookbook: { id: string; name: string };
}

export interface MealPlanRecipeEntry {
  id: string;
  date: string;
  mealType: string | null;
  servings: number | null;
  recipe: Recipe;
}

export interface MealPlan {
  id: string;
  name: string;
  createdAt: string;
  userId: string | null;
  cookbookId: string | null;
  recipes: MealPlanRecipeEntry[];
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  cookbookId: string;
  user: { id: string; firstName: string; lastName: string };
}
