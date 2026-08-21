import type { ProductFormData } from './vendor-product-types';

export function createEmptyProductForm(kind: 'plat' | 'article' = 'plat'): ProductFormData {
  return {
    nom: '',
    description: '',
    prix: '',
    prixPromo: '',
    promoDebutAt: '',
    promoFinAt: '',
    stock: '',
    stockIllimite: false,
    estDisponible: true,
    kind,
    imageUrl: null,
    imageDataUrl: null,
    options: [],
    tags: '',
  };
}
