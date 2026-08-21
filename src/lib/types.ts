// ─── User ─────────────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  nom: string;
  prenom?: string;
  telephone: string;
  imageUrl?: string | null;
  photo_url?: string | null;
  roleId?: string | number;
  role?: string | null;
};

export type AuthSession = {
  token: string;
  expireLe: string;
  user: AuthUser;
};

// ─── Enterprise ───────────────────────────────────────────────────────────────
export type EnterprisePublic = {
  id: string;
  nom: string | null;
  type: "restaurant" | "boutique";
  description?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  image_url?: string | null;
  ouvert?: boolean;
  categorie_id?: string | null;
  categorie_nom?: string | null;
  delai_preparation_min?: number;
  delai_livraison_min?: number;
  livraison_propre?: boolean;
  frais_livraison?: number;
  note_moyenne?: number;
  nb_avis?: number;
  cree_le?: string | null;
  created_at?: string | null;
  statut_moderation?: string | null;
  horaires?: EnterpriseHoraires[];
  est_ouvert_maintenant?: boolean;
  accepte_commandes?: boolean;
  message_fermeture?: string | null;
  prochaine_ouverture?: string | null;
  peut_commander_maintenant?: boolean;
  fermeture_plage?: string | null;
  derniere_commande?: string | null;
  message_commande?: string | null;
};

export type EnterpriseHoraires = {
  jour: number;
  ouverture: string | null;
  fermeture: string | null;
};

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductPublic = {
  id: string;
  entreprise_id: string;
  nom: string | null;
  description?: string | null;
  prix: number | string;
  prix_promo?: number | null;
  promo_debut_at?: string | null;
  promo_fin_at?: string | null;
  stock?: number | string | null;
  stock_illimite?: boolean;
  est_disponible?: boolean;
  image_url?: string | null;
  images_urls?: string[] | null;
  kind?: "plat" | "article" | string;
  nb_vues?: number;
  nb_clics?: number;
  nb_ventes?: number;
  options?: ProductOptionGroup[] | null;
  tags?: string[] | null;
  enterprise_nom?: string | null;
  enterprise_type?: "restaurant" | "boutique" | null;
  enterprise_image_url?: string | null;
};

export type ProductOptionGroup = {
  nom: string;
  requis?: boolean;
  choix: { label: string; prix_sup?: number }[];
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export type CartLine = {
  productId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  image_url?: string | null;
  options?: { label: string; prix_sup: number }[];
};

export type CartSegment = {
  enterpriseId: string;
  enterpriseNom: string;
  enterpriseType?: string;
  fraisLivraison?: number;
  lines: CartLine[];
};

export type CartState = { segments: CartSegment[] } | null;

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "en_attente"
  | "commande_creee"
  | "acceptee"
  | "partiellement_acceptee"
  | "a_preparer"
  | "en_preparation"
  | "prete"
  | "en_livraison"
  | "livree"
  | "annulee"
  | "refusee"
  | "remboursee"
  | "expiree";

export type OrderPublic = {
  id: string;
  numero?: string;
  statut: OrderStatus;
  total?: number;
  total_a_payer?: number;
  frais_livraison?: number;
  paiement_statut?: string;
  adresse_livraison?: string;
  cree_le?: string;
  created_at?: string;
  livreur?: { nom: string; telephone?: string; note_moyenne?: number; image_url?: string | null } | null;
  livraison_id?: string;
  livraison_statut?: string;
  eta?: { arriveeEstimeeAt?: string; totalMinutes?: number; tierLabel?: string } | null;
  sousCommandes?: SousCommande[];
  annulation_motif?: string;
  acceptation_limite_at?: string;
  paiement_limite_at?: string;
  items?: { id?: string; nom: string; quantite: number; prix: number; image_url?: string }[];
};

export type SousCommande = {
  id: string;
  commerce_nom?: string;
  statut: OrderStatus;
  restaurant_id?: string;
  boutique_id?: string;
  raison_refus?: string;
  articles?: { id: string; nom: string; quantite: number; prix_unitaire: number }[];
};

// ─── Notification ─────────────────────────────────────────────────────────────
export type Notification = {
  id: string;
  type: string;
  titre: string;
  corps?: string;
  data?: Record<string, unknown>;
  est_lue: boolean;
  created_at: string;
};

// ─── Address ──────────────────────────────────────────────────────────────────
export type Address = {
  id: string;
  libelle?: string;
  ligne1: string;
  ligne2?: string;
  quartier?: string;
  ville?: string;
  pays?: string;
  point_reperes?: string;
  instructions?: string;
  lat?: number;
  lng?: number;
};
