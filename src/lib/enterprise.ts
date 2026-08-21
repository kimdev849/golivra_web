import { apiFetch } from "./api";

export type EnterpriseCategory = {
  id: string;
  nom: string;
  description?: string | null;
  ordre?: number;
};

const FALLBACK_CATEGORIES: Record<string, EnterpriseCategory[]> = {
  restaurant: [
    { id: "resto-1", nom: "Cuisine africaine", ordre: 1 },
    { id: "resto-2", nom: "Fast-food / Snacks", ordre: 2 },
    { id: "resto-3", nom: "Pizzeria", ordre: 3 },
    { id: "resto-4", nom: "Grill / Brochettes", ordre: 4 },
    { id: "resto-5", nom: "Café / Salon de thé", ordre: 5 },
    { id: "resto-6", nom: "Pâtisserie / Boulangerie", ordre: 6 },
    { id: "resto-7", nom: "Cuisine asiatique", ordre: 7 },
    { id: "resto-8", nom: "Cuisine libanaise", ordre: 8 },
    { id: "resto-9", nom: "Gastronomique", ordre: 9 },
  ],
  boutique: [
    { id: "bout-1", nom: "Mode & Vêtements", ordre: 1 },
    { id: "bout-2", nom: "Épicerie & Alimentation", ordre: 2 },
    { id: "bout-3", nom: "Technologies & Électronique", ordre: 3 },
    { id: "bout-4", nom: "Beauté & Bien-être", ordre: 4 },
    { id: "bout-5", nom: "Maison & Décoration", ordre: 5 },
    { id: "bout-6", nom: "Sport & Loisirs", ordre: 6 },
    { id: "bout-7", nom: "Bijoux & Accessoires", ordre: 7 },
    { id: "bout-8", nom: "Librairie / Papeterie", ordre: 8 },
    { id: "bout-9", nom: "Autre", ordre: 9 },
  ],
};

export async function fetchEnterpriseCategories(
  type: "restaurant" | "boutique"
): Promise<EnterpriseCategory[]> {
  try {
    const data = await apiFetch<EnterpriseCategory[]>(
      `/api/enterprises/categories/${type}`,
      { method: "GET" }
    );
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_CATEGORIES[type] ?? [];
  } catch {
    return FALLBACK_CATEGORIES[type] ?? [];
  }
}
