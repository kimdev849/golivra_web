import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package, Clock, CheckCircle2, Truck, ShoppingBag, TrendingUp,
  Bell, ChevronRight, ClipboardList, ArrowRight, Store, UtensilsCrossed,
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
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
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

function statusStyle(s: string) {
  switch (s) {
    case "en_attente": return { bg: "bg-amber-50", text: "text-amber-700", label: "En attente" };
    case "acceptee": case "a_preparer": return { bg: "bg-green-50", text: "text-brand", label: "Acceptée" };
    case "en_preparation": return { bg: "bg-amber-50", text: "text-amber-700", label: "En préparation" };
    case "prete": return { bg: "bg-green-50", text: "text-brand", label: "Prête" };
    case "en_livraison": return { bg: "bg-blue-50", text: "text-blue-600", label: "En livraison" };
    case "livree": return { bg: "bg-green-50", text: "text-brand", label: "Livrée" };
    case "annulee": case "refusee": return { bg: "bg-red-50", text: "text-red-600", label: "Annulée" };
    default: return { bg: "bg-gray-100", text: "text-gray-600", label: s };
  }
}

/* ── Storefront illustration (SVG art like mobile) ── */
function StorefrontArt() {
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-4 pointer-events-none">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-100 to-green-200/30" />
      {/* Sun */}
      <div className="absolute top-3 right-8 w-10 h-10 rounded-full bg-yellow-300/60 blur-md" />
      {/* Awning */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-12 h-4 ${i % 2 === 0 ? "bg-white/90" : "bg-brand/80"}`} />
        ))}
      </div>
      {/* Building */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-white rounded-t-xl border border-gray-200 shadow-lg">
        {/* Window */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-8 bg-blue-50 border border-blue-200 rounded-sm">
          <div className="absolute top-0 left-1/2 w-px h-full bg-blue-200" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-blue-200" />
        </div>
        {/* Door */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-14 bg-brand/20 border border-brand/30 rounded-t-md">
          <div className="absolute top-1/2 right-1 w-1.5 h-1.5 rounded-full bg-brand/50" />
        </div>
      </div>
      {/* Halos */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-3 bg-brand/5 rounded-full blur-md" />
    </div>
  );
}

export function VendorDashboard() {
  const { shop, orders, setOrders, products } = useVendorCtx();
  const [now, setNow] = useState(Date.now());

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
        const o = await apiFetch<any[]>("/api/vendor/orders", { token });
        if (Array.isArray(o)) setOrders(o);
      } catch {}
    }, 20000);
    return () => clearInterval(t);
  }, [setOrders]);

  const pending = orders.filter((o: any) => o.statut === "en_attente");
  const active = orders.filter((o: any) => ["acceptee", "a_preparer", "en_preparation", "prete"].includes(o.statut));
  const delivered = orders.filter((o: any) => o.statut === "livree");
  const todayOrders = orders.filter((o: any) => isSameDay(o.cree_le));
  const todayRevenue = todayOrders.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
  const totalProducts = products.length;

  if (!shop) return null;

  const commerceLabel = shop.type === "restaurant" ? "Restaurant" : "Boutique";

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Hero art + Greeting ── */}
      <StorefrontArt />

      <div>
        <p className="text-sm text-txt-muted font-medium">{greetingFr()},</p>
        <h1 className="text-xl font-extrabold text-txt mt-0.5">{shop.nom || "Mon commerce"}</h1>
        <p className="text-xs text-txt-muted mt-0.5 capitalize">{todayLabel()} · {commerceLabel}</p>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/vendor/orders" className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center hover:shadow-md transition">
          <p className="text-2xl font-black text-amber-600">{pending.length}</p>
          <p className="text-[11px] font-semibold text-amber-700">À accepter</p>
        </Link>
        <Link to="/vendor/orders" className="bg-green-50 border border-green-200/60 rounded-xl p-3 text-center hover:shadow-md transition">
          <p className="text-2xl font-black text-brand">{active.length}</p>
          <p className="text-[11px] font-semibold text-brand">En cours</p>
        </Link>
        <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-600">{todayRevenue > 0 ? todayRevenue.toLocaleString("fr-FR") : "0"}</p>
          <p className="text-[11px] font-semibold text-blue-600">FCFA aujourd'hui</p>
        </div>
        <Link to="/vendor/products" className="bg-purple-50 border border-purple-200/60 rounded-xl p-3 text-center hover:shadow-md transition">
          <p className="text-2xl font-black text-purple-600">{totalProducts}</p>
          <p className="text-[11px] font-semibold text-purple-600">Produits</p>
        </Link>
      </div>

      {/* ── Pending orders (to accept) ── */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-txt flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              À accepter
            </h2>
            <Link to="/vendor/orders" className="text-xs font-semibold text-brand flex items-center gap-0.5">
              Tout voir <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 5).map((o: any) => {
              const remaining = remainingSecs(o.acceptation_limite_at, now);
              return (
                <Link key={o.id} to={`/vendor/orders/${o.id}`} className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-xl hover:shadow-md transition active:scale-[0.98]">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-txt truncate">#{(o.numero || o.id || "").slice(0, 8)}</p>
                    <p className="text-xs text-amber-600 font-semibold">
                      {remaining !== null && remaining > 0
                        ? `⏱ ${mmss(remaining)} pour accepter`
                        : "En attente"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-txt">{formatFcfa(Number(o.total || 0))}</span>
                    {remaining !== null && remaining > 0 && (
                      <div className="text-[10px] text-amber-500 font-medium mt-0.5">Échéance</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Active orders ── */}
      {active.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-txt flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              En cours
            </h2>
            <Link to="/vendor/orders" className="text-xs font-semibold text-brand flex items-center gap-0.5">
              Tout voir <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {active.slice(0, 5).map((o: any) => {
              const st = statusStyle(o.statut);
              return (
                <Link key={o.id} to={`/vendor/orders/${o.id}`} className="flex items-center gap-3 p-3 bg-white border border-line rounded-xl hover:shadow-md transition active:scale-[0.98]">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                    <ClipboardList size={18} className={st.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-txt truncate">#{(o.numero || o.id || "").slice(0, 8)}</p>
                    <p className={`text-xs font-semibold ${st.text}`}>{st.label}</p>
                  </div>
                  <span className="text-sm font-bold text-txt">{formatFcfa(Number(o.total || 0))}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recently delivered ── */}
      {delivered.length > 0 && (
        <section>
          <h2 className="text-base font-extrabold text-txt mb-3">Livrées aujourd'hui</h2>
          <div className="space-y-2">
            {delivered.slice(0, 3).map((o: any) => (
              <Link key={o.id} to={`/vendor/orders/${o.id}`} className="flex items-center gap-3 p-3 bg-white border border-line rounded-xl hover:shadow-md transition">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-50 flex-shrink-0">
                  <CheckCircle2 size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-txt">#{(o.numero || o.id || "").slice(0, 8)}</p>
                  <p className="text-xs text-txt-muted">Livrée ✓</p>
                </div>
                <span className="text-sm font-bold text-txt">{formatFcfa(Number(o.total || 0))}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick actions ── */}
      <section>
        <h2 className="text-base font-extrabold text-txt mb-3">Raccourcis</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/vendor/products" className="bg-white border border-line rounded-xl p-4 text-center hover:shadow-md transition active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-2">
              {shop.type === "restaurant" ? <UtensilsCrossed size={18} className="text-brand" /> : <Package size={18} className="text-brand" />}
            </div>
            <p className="text-xs font-bold text-txt">{shop.type === "restaurant" ? "Mon menu" : "Mes produits"}</p>
          </Link>
          <Link to="/vendor/orders" className="bg-white border border-line rounded-xl p-4 text-center hover:shadow-md transition active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
              <ClipboardList size={18} className="text-amber-600" />
            </div>
            <p className="text-xs font-bold text-txt">Commandes</p>
          </Link>
          <Link to="/vendor/more" className="bg-white border border-line rounded-xl p-4 text-center hover:shadow-md transition active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold text-txt">Statistiques</p>
          </Link>
          <Link to="/vendor/deliveries" className="bg-white border border-line rounded-xl p-4 text-center hover:shadow-md transition active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
              <Truck size={18} className="text-purple-600" />
            </div>
            <p className="text-xs font-bold text-txt">Livraisons</p>
          </Link>
        </div>
      </section>

      {/* ── Empty state ── */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-brand/40" />
          </div>
          <p className="text-sm font-bold text-txt-muted">Aucune commande pour le moment</p>
          <p className="text-xs text-txt-muted mt-1">Les commandes apparaîtront ici dès qu'un client commanderait.</p>
          <Link to="/vendor/products" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition">
            Ajouter des produits <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
