import type { ProductFormData } from './vendor-product-types';

export function toCreateProductPayload(form: ProductFormData): Record<string, unknown> {
  return {
    nom: form.nom.trim(),
    description: form.description.trim() || null,
    prix: Number(form.prix),
    prix_promo: form.prixPromo ? Number(form.prixPromo) : null,
    promo_debut_at: form.promoDebutAt || null,
    promo_fin_at: form.promoFinAt || null,
    stock: form.stockIllimite ? null : (form.stock ? Number(form.stock) : null),
    stock_illimite: form.stockIllimite,
    est_disponible: form.estDisponible,
    kind: form.kind,
    image_url: form.imageUrl,
    image_data_url: form.imageDataUrl,
    options: form.options.length > 0 ? form.options : undefined,
    tags: form.tags.trim() || undefined,
  };
}

export function toUpdateProductPayload(form: ProductFormData): Record<string, unknown> {
  const payload = toCreateProductPayload(form);
  delete payload.image_data_url;
  return payload;
}
