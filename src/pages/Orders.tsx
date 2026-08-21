import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, getSessionToken } from "../lib/api";
import { Clock, CheckCircle, XCircle, ChevronRight, Package, MapPin, AlertTriangle } from "lucide-react";

type FilterKey = "all" | "active" | "delivered" | "cancelled";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50" },
  commande_creee: { label: "Envoyée", color: "text-blue-700", bg: "bg-blue-50" },
  acceptee: { label: "Acceptée", color: "text-blue-700", bg: "bg-blue-50" },
  en_preparation: { label: "En préparation", color: "text-amber-700", bg: "bg-amber-50" },
  prete: { label: "Prête", color: "text-purple-700", bg: "bg-purple-50" },
  en_livraison: { label: "En livraison", color: "text-brand", bg: "bg-brand-50" },
  livree: { label: "Livrée", color: "text-brand", bg: "bg-green-50" },
  annulee: { label: "Annulée", color: "text-red-600", bg: "bg-red-50" },
  refusee: { label: "Refusée", color: "text-red-600", bg: "bg-red-50" },
  expiree: { label: "Expirée", color: "text-red-600", bg: "bg-red-50" },
};

function getStatus(status: string | null | undefined) {
  return STATUS_CONFIG[status || ""] || { label: status || "Inconnu", color: "text-gray-600", bg: "bg-gray-100" };
}

function matchesFilter(o: any, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "active") return ["en_attente", "commande_creee", "acceptee", "en_preparation", "prete", "en_livraison"].includes(o.statut);
  if (f === "delivered") return o.statut === "livree";
  if (f === "cancelled") return ["annulee", "refusee", "expiree"].includes(o.statut);
  return true;
}

export function OrdersPage() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const token = getSessionToken();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/api/orders", { token: token! }),
    enabled: !!token,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const orders = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o: any) => matchesFilter(o, "active")).length,
    delivered: orders.filter((o: any) => matchesFilter(o, "delivered")).length,
    cancelled: orders.filter((o: any) => matchesFilter(o, "cancelled")).length,
  }), [orders]);

  const list = useMemo(() => orders.filter((o: any) => matchesFilter(o, filter)), [orders, filter]);

  const pills: { key: FilterKey; label: string }[] = [
    { key: "all", label: `Toutes (${counts.all})` },
    { key: "active", label: `En cours (${counts.active})` },
    { key: "delivered", label: `Livrées (${counts.delivered})` },
    { key: "cancelled", label: `Annulées (${counts.cancelled})` },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-xl font-extrabold text-txt">Mes commandes</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="space-y-3 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <AlertTriangle size={48} className="text-red-300 mx-auto mb-3" />
        <h2 className="text-lg font-extrabold text-txt mb-1">Erreur de chargement</h2>
        <p className="text-sm text-txt-muted mb-4">Impossible de charger vos commandes.</p>
        <Link to="/" className="inline-block bg-brand text-white px-6 py-2.5 rounded-xl text-sm font-bold">Retour à l'accueil</Link>
      </div>
    );
  }

  // Empty
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-brand/40" />
        </div>
        <h2 className="text-lg font-extrabold text-txt mb-1">Aucune commande</h2>
        <p className="text-sm text-txt-muted mb-4">Vous n'avez pas encore passé de commande.</p>
        <Link to="/explore" className="inline-block bg-brand text-white px-8 py-3 rounded-full font-extrabold text-sm hover:bg-brand/90 transition">
          Commencer à commander
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <h1 className="text-xl font-extrabold text-txt">Mes commandes</h1>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition border ${
              filter === p.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-txt-muted border-line hover:border-brand/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {list.length > 0 && (
        <div className="space-y-2.5">
          {list.map((order: any) => {
            const st = getStatus(order.statut);
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center gap-3 p-3.5 bg-white border border-line rounded-xl hover:shadow-md transition active:scale-[0.98]"
              >
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                  <span className={`text-base font-black ${st.color}`}>
                    #{(order.numero || order.id || "").slice(-4)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-txt truncate">
                      {order.commerce_nom || order.enterprise_nom || "Commerce"}
                    </p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {order.cree_le && (
                      <span className="text-xs text-txt-muted flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(order.cree_le)}
                      </span>
                    )}
                    {order.adresse_livraison?.quartier && (
                      <span className="text-xs text-txt-muted flex items-center gap-1 truncate">
                        <MapPin size={11} />
                        {order.adresse_livraison.quartier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand">
                    {formatFcfa(Number(order.total || 0))}
                  </p>
                  <p className="text-[10px] text-txt-muted mt-0.5">
                    {order.articles?.length || order.nb_articles || 0} article{(order.articles?.length || order.nb_articles || 0) > 1 ? "s" : ""}
                  </p>
                </div>

                <ChevronRight size={16} className="text-txt-muted flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty filter state */}
      {list.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Package size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-txt-muted">Aucune commande dans cette catégorie</p>
          <p className="text-xs text-txt-muted mt-1">Essayez un autre filtre.</p>
        </div>
      )}
    </div>
  );
}
