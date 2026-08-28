import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken, logoutRemote, friendlyErrorMessage } from "../lib/api";
import { resolveUrl } from "../lib/images";
import { useAuthStore, useCartStore } from "../store";
import {
  Bell, CalendarDays, Camera, Check, ChevronRight, ClipboardList, Clock,
  Heart, HelpCircle, LogOut, MapPin, Pencil, Phone, Settings, ShoppingBag, User,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout: authLogout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);

  const token = getSessionToken();

  // ── Profile data ──
  const { data: me, isLoading: loadingProfile } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch("/api/auth/me", { token: token! }),
    enabled: !!token,
    staleTime: 120_000,
  });

  // ── Orders for stats ──
  const { data: orders = [] } = useQuery({
    queryKey: ["profile-orders"],
    queryFn: () => apiFetch("/api/orders", { token: token! }),
    enabled: !!token,
    staleTime: 60_000,
  });

  // ── Addresses for stats ──
  const { data: addresses = [] } = useQuery({
    queryKey: ["profile-addresses"],
    queryFn: () => apiFetch("/api/addresses", { token: token! }),
    enabled: !!token,
    staleTime: 60_000,
  });

  // ── Favorites count (enterprises + products, like mobile) ──
  const { data: favEntData } = useQuery({
    queryKey: ["profile-fav-ent"],
    queryFn: () => apiFetch("/api/favorites", { token: token! }),
    enabled: !!token,
    staleTime: 60_000,
  });
  const { data: favProdData } = useQuery({
    queryKey: ["profile-fav-prod"],
    queryFn: () => apiFetch("/api/favorites/products", { token: token! }),
    enabled: !!token,
    staleTime: 60_000,
  });

  const m = me as any;
  const orderList = Array.isArray(orders) ? orders : [];
  const addressList = Array.isArray(addresses) ? addresses : [];
  const totalOrders = orderList.length;
  const activeOrders = orderList.filter((o: any) => !["livree", "annulee", "remboursee", "expiree"].includes(o.statut)).length;
  const totalAddresses = addressList.length;
  const favEntCount = Array.isArray((favEntData as any)?.items) ? (favEntData as any).items.length : (Array.isArray((favEntData as any)?.enterprise_ids) ? (favEntData as any).enterprise_ids.length : 0);
  const favProdCount = Array.isArray((favProdData as any)?.items) ? (favProdData as any).items.length : 0;
  const totalFavorites = favEntCount + favProdCount;

  const memberSince = m?.created_at
    ? new Date(m.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const handleLogout = async () => {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return;
    try {
      if (token) await logoutRemote(token);
    } catch { /* ignore */ }
    authLogout();
    // Clear all react-query caches so no stale user data is shown
    queryClient.clear();
    toast.success("Déconnecté");
    navigate("/", { replace: true });
  };

  // ── Guest view: not connected ──
  if (!token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
          <User size={36} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-txt">Bienvenue sur GoLivra</h1>
          <p className="text-sm text-txt-muted mt-1">Connectez-vous pour gérer vos commandes, favoris et profil.</p>
        </div>
        <div className="space-y-3">
          <Link to="/auth" className="block w-full py-3.5 rounded-xl bg-brand text-white font-bold text-center hover:bg-brand-deep transition">Se connecter</Link>
          <Link to="/signup" className="block w-full py-3.5 rounded-xl border border-line bg-surface text-brand font-bold text-center hover:bg-brand-50 transition">Créer un compte</Link>
        </div>
        <div className="pt-4 space-y-2.5 border-t border-line">
          <MenuRow icon={Settings} title="Paramètres" to="/settings" />
          <MenuRow icon={HelpCircle} title="Centre d'aide" to="/help-center" />
        </div>
      </div>
    );
  }

  if (loadingProfile && !m) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* ── Header: Bonjour + name + verified badge ── */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-txt-muted font-medium">Bonjour,</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-[22px] font-bold text-txt truncate">{m?.nom || "Client GoLivra"}</h1>
            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-brand-50 transition">
            <Settings size={18} className="text-txt" />
          </Link>
        </div>
      </div>

      {/* ── Profile block: avatar + contact + edit button ── */}
      <div className="flex items-center gap-4">
        <Link to="/profile/edit" className="relative flex-shrink-0">
          <div className="w-[92px] h-[92px] rounded-full bg-brand-50 flex items-center justify-center overflow-hidden">
            {(m?.imageUrl || m?.image_url) ? (
              <img src={resolveUrl(m.imageUrl || m.image_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={42} className="text-brand-deep" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand border-2 border-white flex items-center justify-center">
            <Camera size={13} className="text-white" strokeWidth={2.6} />
          </div>
        </Link>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-brand-deep flex-shrink-0" />
            <span className="text-sm font-semibold text-txt truncate">{m?.telephone || "—"}</span>
          </div>
          {memberSince && (
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-brand-deep flex-shrink-0" />
              <span className="text-[13px] text-txt-muted truncate">Membre depuis le {memberSince}</span>
            </div>
          )}
          <Link
            to="/profile/edit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-brand bg-brand-50 hover:bg-brand-100 transition mt-1"
          >
            <Pencil size={13} className="text-brand-deep" strokeWidth={2.4} />
            <span className="text-xs font-semibold text-brand-deep">Modifier le profil</span>
          </Link>
        </div>
      </div>

      {/* ── Stats card (3 columns) ── */}
      <div className="flex items-center border border-line rounded-2xl bg-surface py-4 shadow-sm">
        <div className="flex-1 flex flex-col items-center gap-1">
          <ClipboardList size={19} className="text-brand" />
          <span className="text-[19px] font-bold text-txt">{totalOrders}</span>
          <span className="text-xs text-txt-muted">Commandes</span>
        </div>
        <div className="w-px h-8 bg-line" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <Heart size={19} className="text-brand" />
          <span className="text-[19px] font-bold text-txt">{totalFavorites}</span>
          <span className="text-xs text-txt-muted">Favoris</span>
        </div>
        <div className="w-px h-8 bg-line" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <MapPin size={19} className="text-brand" />
          <span className="text-[19px] font-bold text-txt">{totalAddresses}</span>
          <span className="text-xs text-txt-muted">Adresses</span>
        </div>
      </div>

      {/* ── Mon activité ── */}
      <h2 className="text-base font-semibold text-txt">Mon activité</h2>
      <div className="space-y-2.5">
        <MenuRow icon={ShoppingBag} title="Mes commandes" to="/orders" pill={totalOrders > 0 ? `${totalOrders} commande${totalOrders > 1 ? "s" : ""}` : undefined} />
        <MenuRow icon={Heart} title="Mes favoris" to="/favorites" count={totalFavorites > 0 ? totalFavorites : undefined} />
        <MenuRow icon={MapPin} title="Mes adresses" to="/addresses" count={totalAddresses} />
        <MenuRow icon={Clock} title="Commandes en cours" to="/orders" count={activeOrders} />
        <MenuRow icon={Settings} title="Paramètres" to="/settings" />
        <MenuRow icon={HelpCircle} title="Centre d'aide" to="/help-center" />
        <MenuRow icon={LogOut} title="Se déconnecter" onClick={handleLogout} danger />
      </div>
    </div>
  );
}

// ─── Menu Row ──────────────────────────────────────────────────────────────

function MenuRow({
  icon: Icon, title, to, onClick, pill, count, danger,
}: {
  icon: any; title: string; to?: string; onClick?: () => void;
  pill?: string; count?: number; danger?: boolean;
}) {
  const inner = (
    <div className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition ${danger ? "bg-surface hover:bg-error/5" : "bg-surface-muted hover:bg-brand-50"}`}>
      <div className={`w-10 h-10 rounded-[13px] flex items-center justify-center ${danger ? "bg-error/10" : "bg-brand-50"}`}>
        <Icon size={18} className={danger ? "text-error" : "text-brand-deep"} />
      </div>
      <span className={`flex-1 text-[15px] font-semibold ${danger ? "text-error" : "text-txt"}`}>{title}</span>
      {pill ? (
        <span className="px-2.5 py-1 rounded-full bg-brand text-white text-xs font-semibold">{pill}</span>
      ) : count !== undefined ? (
        <span className="text-sm text-txt-muted font-medium">{count}</span>
      ) : null}
      <ChevronRight size={17} className="text-txt-muted" />
    </div>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}
