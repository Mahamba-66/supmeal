export interface Cookbook {
  id: string;
  name: string;
  createdAt: string;
  myRole?: string;
}

export interface CookbookMember {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface CookbookDetail extends Cookbook {
  members: CookbookMember[];
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
}
