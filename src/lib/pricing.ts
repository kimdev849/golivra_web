/**
 * Pricing helpers — matches mobile pricing.ts.
 * Delivery fees come from /api/orders/pricing-config.
 * NO hardcoded 500 FCFA fallback — only 1000 FCFA default (same as mobile).
 */
import { apiFetch } from './api';

/** Default base delivery fee — same as mobile FALLBACK_DELIVERY_FEE_FCFA */
export const DEFAULT_DELIVERY_FEE_FCFA = 1000;
export const DEFAULT_MIN_ORDER_FCFA = 1000;

export type PublicPricing = {
  frais_livraison_base_fcfa: number;
  frais_livraison_min_fcfa: number;
  frais_livraison_max_fcfa: number;
  montant_min_commande_fcfa: number;
  zones?: {
    zones: { id: string; name: string; label: string; price_base: number; is_active: boolean; sort_order?: number }[];
    arrondissements: { id: string; name: string; zone_id: string; sort_order?: number }[];
    price_by_arrondissement: Record<string, number>;
    default_price_fcfa: number;
  } | null;
};

export const DEFAULT_PUBLIC_PRICING: PublicPricing = {
  frais_livraison_base_fcfa: DEFAULT_DELIVERY_FEE_FCFA,
  frais_livraison_min_fcfa: DEFAULT_DELIVERY_FEE_FCFA,
  frais_livraison_max_fcfa: 2500,
  montant_min_commande_fcfa: DEFAULT_MIN_ORDER_FCFA,
};

let cached: PublicPricing | null = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

function toPricing(raw: Record<string, unknown>): PublicPricing {
  const base = Number(raw.frais_livraison_base_fcfa);
  const minFee = Number(raw.frais_livraison_min_fcfa);
  const maxFee = Number(raw.frais_livraison_max_fcfa);
  const minOrder = Number(raw.montant_min_commande_fcfa);
  const baseFcfa = Number.isFinite(base) && base > 0 ? Math.round(base) : DEFAULT_DELIVERY_FEE_FCFA;
  const minFcfa = Number.isFinite(minFee) && minFee > 0 ? Math.round(minFee) : DEFAULT_DELIVERY_FEE_FCFA;
  const maxFcfa = Number.isFinite(maxFee) && maxFee > 0 ? Math.round(maxFee) : 2500;
  const minOrderFcfa = Number.isFinite(minOrder) && minOrder > 0 ? Math.round(minOrder) : DEFAULT_MIN_ORDER_FCFA;

  return {
    frais_livraison_base_fcfa: baseFcfa,
    frais_livraison_min_fcfa: minFcfa,
    frais_livraison_max_fcfa: maxFcfa,
    montant_min_commande_fcfa: minOrderFcfa,
    zones: (raw.zones as PublicPricing['zones']) ?? null,
  };
}

export async function fetchPublicPricing(): Promise<PublicPricing> {
  const now = Date.now();
  if (cached && now < cacheAt) return cached;
  try {
    const data = await apiFetch<Record<string, unknown>>('/api/orders/pricing-config');
    cached = toPricing(data);
    cacheAt = now + CACHE_MS;
    return cached;
  } catch {
    return { ...DEFAULT_PUBLIC_PRICING };
  }
}

/**
 * Delivery fee based on quartier/zone — matches mobile deliveryFeeForQuartier.
 * Uses zone pricing if configured, otherwise the base fee from API.
 */
export function deliveryFeeForQuartier(
  quartier: string | null | undefined,
  pricing: PublicPricing = DEFAULT_PUBLIC_PRICING,
): number {
  const q = String(quartier || '').trim();
  const zones = pricing.zones;
  if (zones && q) {
    const fromMap = zones.price_by_arrondissement[q];
    if (Number.isFinite(fromMap) && fromMap > 0) return Math.round(fromMap);
  }
  return pricing.frais_livraison_base_fcfa;
}

/**
 * Clamp a commerce's fee within the platform min/max — matches mobile displayDeliveryFeeFcfa.
 */
export function displayDeliveryFeeFcfa(
  commerceFee: number | null | undefined,
  pricing: PublicPricing = DEFAULT_PUBLIC_PRICING,
): number {
  const min = pricing.frais_livraison_min_fcfa;
  const base = pricing.frais_livraison_base_fcfa;
  const max = pricing.frais_livraison_max_fcfa;
  const fromCommerce = Number(commerceFee);
  if (Number.isFinite(fromCommerce) && fromCommerce > 0) {
    const fee = Math.round(fromCommerce);
    if (fee < min) return base;
    if (fee > max) return max;
    return fee;
  }
  return base;
}
