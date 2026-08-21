import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, Clock, CheckCircle2, ShoppingBag, TrendingUp,
  Bell, ChevronRight, ClipboardList, ArrowRight, Store, UtensilsCrossed,
  Truck, BarChart3, User,
} from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { useVendorCtx } from "./VendorLayout";

function formatFcfa(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

function greetingFr() {
  const h = new Date().getHours();
  return h >= 5 && h < 18 ? "Bonjour" : "Bonsoir";
}

function todayLabel() {
  const d = new Date();
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function isSameDay(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function remainingSecs(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return null;
  return Math.max(0, Math.ceil((at - nowMs) / 1000));
}

function mmss(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ── Storefront illustration (like the screenshot) ── */
function StorefrontArt() {
  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden pointer-events-none" style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)" }}>
      {/* Sun */}
      <div className="absolute top-4 right-8 w-14 h-14 rounded-full" style={{ background: "linear-gradient(135deg, #fff9c4 0%, #ffee58 100%)", filter: "blur(8px)", opacity: 0.7 }} />
      {/* Trees */}
      <div className="absolute bottom-0 left-4 w-8 h-16 bg-green-600 rounded-t-full opacity-40" />
      <div className="absolute bottom-0 left-14 w-6 h-12 bg-green-700 rounded-t-full opacity-30" />
      <div className="absolute bottom-0 right-4 w-8 h-16 bg-green-600 rounded-t-full opacity-40" />
      {/* Building */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-28 bg-white rounded-t-2xl border border-gray-200 shadow-lg">
        {/* Awning */}
        <div className="absolute -top-3 left-0 right-0 flex">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 h-3 ${i % 2 === 0 ? "bg-green-600" : "bg-white"}`} style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }} />
          ))}
        </div>
        {/* Window */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-10 bg-blue-50 border border-blue-200 rounded">
          <div className="absolute top-0 left-1/2 w-px h-full bg-blue-200" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-blue-200" />
        </div>
        {/* Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-green-50 border border-green-200 rounded-t-lg">
          <div className="absolute top-1/2 right-1.5 w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>
      {/* Ground line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-200/50" />
    </div>
  );
}

export function VendorDashboard() {
  const { shop, orders, setOrders, products } = useVendorCtx();
  const [now, setNow] = useState(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);

  // Live clock for countdowns
  useEffect(() => {
    const hasPending = orders.some((o: any) => o.statut === "en_attente" && o.acceptation_limite_at);
    if (!hasPending) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [orders]);

  // Refresh orders every 20s
  useEffect(() => {
    const t = setInterval(async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const o = await apiFetch<any[]>("/api/orders/vendor/mine", { token });
        if (Array.isArray(o)) setOrders(o);
      } catch {}
    }, 20000);
    return () => clearInterval(t);
  }, [setOrders]);

  // Fetch unread notifications count
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<{ unread_count?: number }>("/api/notifications/unread-count", { token })
      .then((d) => setUnreadCount(d?.unread_count ?? 0))
      .catch(() => {});
  }, [orders]);

  const pending = orders.filter((o: any) => o.statut === "en_attente");
  const active = orders.filter((o: any) => ["acceptee", "a_preparer", "en_preparation", "prete"].includes(o.statut));
  const delivered = orders.filter((o: any) => o.statut === "livree");
  const todayOrders = orders.filter((o: any) => isSameDay(o.cree_le));
  const todayRevenue = todayOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
  const totalProducts = products.length;

  if (!shop) return null;

  const commerceLabel = shop.type === "restaurant" ? "Restaurant" : shop.type === "boutique" ? "Boutique" : "Commerce";

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ── Header: Greeting + Notification bell ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--txt-muted)" }}>{greetingFr()},</p>
          <h1 className="text-2xl font-black mt-0.5 flex items-center gap-2" style={{ color: "var(--txt)" }}>
            {shop.nom || "Mon commerce"}
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: shop.enLigne ? "#16a34a" : "var(--txt-muted)" }}>
              <span className={`w-2 h-2 rounded-full ${shop.enLigne ? "bg-green-500" : "bg-gray-400"}`} />
              {shop.enLigne ? "En ligne" : "Hors ligne"}
            </span>
            <span className="text-xs" style={{ color: "var(--txt-muted)" }}>•</span>
            <span className="text-xs font-medium" style={{ color: "var(--txt-muted)" }}>{commerceLabel}</span>
          </div>
        </div>
        <Link to="/vendor/notifications" className="relative w-11 h-11 rounded-full flex items-center justify-center transition" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Bell size={20} style={{ color: "var(--txt)" }} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── Storefront Art + Prêt à servir ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="relative">
          <StorefrontArt />
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--txt-muted)" }}>{todayLabel()}</p>
              <h2 className="text-lg font-black mt-1" style={{ color: "var(--txt)" }}>Prêt à servir<br />vos clients 👋</h2>
            </div>
            <Link to="/vendor/more" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition self-start" style={{ background: "var(--brand)", color: "#fff" }}>
              <User size={16} /> Voir mon profil
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats cards (4 columns) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/vendor/orders" className="rounded-xl p-4 transition hover:shadow-md" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
            <ClipboardList size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600">{pending.length}</p>
          <p className="text-xs font-bold text-orange-700 mt-0.5">À accepter</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-muted)" }}>Nouvelles cmdes</p>
        </Link>
        <Link to="/vendor/orders" className="rounded-xl p-4 transition hover:shadow-md" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mb-2">
            <ShoppingBag size={16} className="text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-600">{active.length}</p>
          <p className="text-xs font-bold text-green-700 mt-0.5">En cours</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-muted)" }}>En préparation</p>
        </Link>
        <div className="rounded-xl p-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{todayRevenue > 0 ? todayRevenue.toLocaleString("fr-FR") : "0"}</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">FCFA</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-muted)" }}>Chiffre d'affaires</p>
        </div>
        <Link to="/vendor/products" className="rounded-xl p-4 transition hover:shadow-md" style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
            <Package size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{totalProducts}</p>
          <p className="text-xs font-bold text-purple-600 mt-0.5">Produits</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-muted)" }}>Dans votre menu</p>
        </Link>
      </div>

      {/* ── Activité récente ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold" style={{ color: "var(--txt)" }}>Activité récente</h2>
          <Link to="/vendor/orders" className="text-xs font-bold" style={{ color: "var(--brand)" }}>Voir tout</Link>
        </div>
        <div className="space-y-2">
          {pending.length > 0 ? (
            pending.slice(0, 3).map((o: any) => {
              const remaining = remainingSecs(o.acceptation_limite_at, now);
              return (
                <Link key={o.id} to={`/vendor/orders/${o.id}`} className="flex items-center gap-3 p-3 rounded-xl transition hover:shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Nouvelle commande #{(o.numero || o.id || "").slice(0, 8)}</p>
                    <p className="text-xs text-amber-600 font-semibold">
                      {remaining !== null && remaining > 0 ? `⏱ ${mmss(remaining)}` : "En attente"}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "var(--txt)" }}>{formatFcfa(Number(o.total || 0))}</span>
                </Link>
              );
            })
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Aucune nouvelle commande</p>
                <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Vous êtes à jour !</p>
              </div>
              <span className="text-[11px]" style={{ color: "var(--txt-muted)" }}>À l'instant</span>
            </div>
          )}
          {products.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Menu mis à jour</p>
                <p className="text-xs" style={{ color: "var(--txt-muted)" }}>{totalProducts} produits disponibles</p>
              </div>
            </div>
          )}
          <Link to="/vendor/more" className="flex items-center gap-3 p-3 rounded-xl transition hover:shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Statistiques</p>
              <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Consultez vos performances</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-muted)" }} />
          </Link>
        </div>
      </section>

      {/* ── Raccourcis ── */}
      <section>
        <h2 className="text-base font-extrabold mb-3" style={{ color: "var(--txt)" }}>Raccourcis</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/vendor/products" className="rounded-xl p-4 transition hover:shadow-sm flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              {shop.type === "restaurant" ? <UtensilsCrossed size={18} className="text-green-600" /> : <Package size={18} className="text-green-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>{shop.type === "restaurant" ? "Mon menu" : "Mes produits"}</p>
              <p className="text-[11px]" style={{ color: "var(--txt-muted)" }}>Gérer vos {shop.type === "restaurant" ? "plats" : "produits"}</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-muted)" }} />
          </Link>
          <Link to="/vendor/orders" className="rounded-xl p-4 transition hover:shadow-sm flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <ClipboardList size={18} className="text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Commandes</p>
              <p className="text-[11px]" style={{ color: "var(--txt-muted)" }}>Voir toutes les commandes</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-muted)" }} />
          </Link>
          <Link to="/vendor/more" className="rounded-xl p-4 transition hover:shadow-sm flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Statistiques</p>
              <p className="text-[11px]" style={{ color: "var(--txt-muted)" }}>Voir vos performances</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-muted)" }} />
          </Link>
          <Link to="/vendor/deliveries" className="rounded-xl p-4 transition hover:shadow-sm flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--txt)" }}>Livraisons</p>
              <p className="text-[11px]" style={{ color: "var(--txt-muted)" }}>Suivre les livraisons</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--txt-muted)" }} />
          </Link>
        </div>
      </section>
    </div>
  );
}
