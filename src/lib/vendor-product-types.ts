export type ProductFormKind = 'plat' | 'article';

export type ProductOptionChoice = { label: string; prix_sup?: number };

export type ProductOptionGroup = { nom: string; requis?: boolean; choix: ProductOptionChoice[] };

export type ProductFormData = {
  nom: string;
  description: string;
  prix: string;
  prixPromo: string;
  promoDebutAt: string;
  promoFinAt: string;
  stock: string;
  stockIllimite: boolean;
  estDisponible: boolean;
  kind: ProductFormKind;
  imageUrl: string | null;
  imageDataUrl: string | null;
  options: ProductOptionGroup[];
  tags: string;
};
