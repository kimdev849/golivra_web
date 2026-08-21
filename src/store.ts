import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  type AuthSession,
  type AuthUser,
} from "./lib/api";

export type { AuthUser };

// ─── Role helpers (matches mobile roles.ts) ──────────────────────────────────

export function isMerchantRole(role: string | null | undefined): boolean {
  return role === "restaurateur" || role === "commercant";
}

export function isCourierRole(role: string | null | undefined): boolean {
  return role === "livreur";
}

export function homePathForRole(role: string | null | undefined): string {
  if (isMerchantRole(role)) return "/vendor";
  if (isCourierRole(role)) return "/courier";
  return "/";
}

// ─── Auth Store ──────────────────────────────────────────────────────────────

type AuthStore = {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (s: AuthSession) => void;
  logout: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isAuthenticated: false,
      setSession: (s) => {
        setSessionToken(s.token);
        set({ session: s, user: s.user, isAuthenticated: true });
      },
      logout: () => {
        clearSessionToken();
        set({ session: null, user: null, isAuthenticated: false });
      },
      hydrate: () => {
        if (get().isAuthenticated) return;
        const token = getSessionToken();
        if (!token) set({ session: null, user: null, isAuthenticated: false });
      },
    }),
    { name: "golivra-auth" },
  ),
);

// ─── Cart Store (matches mobile cart-local.ts) ───────────────────────────────

export type CartLine = {
  productId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  image_url?: string | null;
  options?: { label: string; prix_sup: number }[];
  stockSnapshot?: number;
};

export type CartSegment = {
  enterpriseId: string;
  enterpriseNom: string;
  enterpriseType?: "restaurant" | "boutique";
  fraisLivraison?: number;
  lines: CartLine[];
};

export type CartState = { segments: CartSegment[] } | null;

type CartStore = {
  cart: CartState;
  itemCount: number;
  setCart: (c: CartState) => void;
  clearCart: () => void;
  addItem: (segment: {
    enterpriseId: string;
    enterpriseNom: string;
    enterpriseType?: string;
    fraisLivraison?: number;
  }, item: CartLine) => void;
  updateQuantity: (enterpriseId: string, productId: string, qty: number) => void;
  removeItem: (enterpriseId: string, productId: string) => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      itemCount: 0,
      setCart: (c) => {
        const count =
          c?.segments.reduce(
            (acc, s) => acc + s.lines.reduce((a, l) => a + l.quantite, 0),
            0,
          ) ?? 0;
        set({ cart: c, itemCount: count });
      },
      clearCart: () => set({ cart: null, itemCount: 0 }),
      addItem: (seg, item) => {
        const current = get().cart;
        const segments = current?.segments ? [...current.segments] : [];

        const existingSegIdx = segments.findIndex((s) => s.enterpriseId === seg.enterpriseId);
        if (existingSegIdx >= 0) {
          const existingSeg = { ...segments[existingSegIdx], lines: [...segments[existingSegIdx].lines] };
          const existingLineIdx = existingSeg.lines.findIndex((l) => l.productId === item.productId);
          if (existingLineIdx >= 0) {
            existingSeg.lines[existingLineIdx] = {
              ...existingSeg.lines[existingLineIdx],
              quantite: existingSeg.lines[existingLineIdx].quantite + item.quantite,
            };
          } else {
            existingSeg.lines.push(item);
          }
          segments[existingSegIdx] = existingSeg;
        } else {
          segments.push({
            enterpriseId: seg.enterpriseId,
            enterpriseNom: seg.enterpriseNom,
            enterpriseType: seg.enterpriseType as "restaurant" | "boutique" | undefined,
            fraisLivraison: seg.fraisLivraison,
            lines: [item],
          });
        }

        const newCart = { segments };
        const count = newCart.segments.reduce(
          (acc, s) => acc + s.lines.reduce((a, l) => a + l.quantite, 0),
          0,
        );
        set({ cart: newCart, itemCount: count });
      },
      updateQuantity: (enterpriseId, productId, qty) => {
        const current = get().cart;
        if (!current?.segments) return;

        const segments = current.segments.map((seg) => {
          if (seg.enterpriseId !== enterpriseId) return seg;
          return {
            ...seg,
            lines: seg.lines
              .map((l) => (l.productId === productId ? { ...l, quantite: qty } : l))
              .filter((l) => l.quantite > 0),
          };
        }).filter((s) => s.lines.length > 0);

        const newCart = segments.length ? { segments } : null;
        const count =
          newCart?.segments.reduce(
            (acc, s) => acc + s.lines.reduce((a, l) => a + l.quantite, 0),
            0,
          ) ?? 0;
        set({ cart: newCart, itemCount: count });
      },
      removeItem: (enterpriseId, productId) => {
        get().updateQuantity(enterpriseId, productId, 0);
      },
    }),
    { name: "golivra-cart" },
  ),
);
