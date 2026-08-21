import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, ChevronRight, AlertTriangle } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { useVendorCtx } from "./VendorLayout";

type FilterKey = "all" | "prep" | "ship";

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

function matchesFilter(o: any, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "prep") return ["en_attente", "a_preparer", "en_preparation", "prete"].includes(o.statut);
  if (f === "ship") return o.statut === "en_livraison";
  return true;
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function VendorOrders() {
  const { orders, setOrders, shop } = useVendorCtx();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetch = async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const o = await apiFetch<any[]>("/api/orders/vendor/mine", { token });
        if (Array.isArray(o)) setOrders(o);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [setOrders]);

  // Clock for countdowns
  useEffect(() => {
    const hasPending = orders.some((o: any) => o.statut === "en_attente" && o.acceptation_limite_at);
    if (!hasPending) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [orders]);

  // Polling every 15s
  useEffect(() => {
    const t = setInterval(async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const o = await apiFetch<any[]>("/api/orders/vendor/mine", { token });
        if (Array.isArray(o)) setOrders(o);
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [setOrders]);

  const counts = useMemo(() => ({
    all: orders.length,
    prep: orders.filter((o: any) => matchesFilter(o, "prep")).length,
    ship: orders.filter((o: any) => matchesFilter(o, "ship")).length,
  }), [orders]);

  const list = useMemo(() => orders.filter((o: any) => matchesFilter(o, filter)), [orders, filter]);

  const pills: { key: FilterKey; label: string }[] = [
    { key: "all", label: `Tout (${counts.all})` },
    { key: "prep", label: `Préparation (${counts.prep})` },
    { key: "ship", label: `Livraison (${counts.ship})` },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-txt">COMMANDES</h1>
      </div>

      {/* ── Hours warning ── */}
      {!shop?.enLigne && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Vous êtes hors ligne. Les commandes ne seront pas reçues.</p>
        </div>
      )}

      {/* ── Filter pills ── */}
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

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Order list ── */}
      {!loading && list.length > 0 && (
        <div className="space-y-2">
          {list.map((o: any) => {
            const st = statusStyle(o.statut);
            const remaining = remainingSecs(o.acceptation_limite_at, now);
            return (
              <Link
                key={o.id}
                to={`/vendor/orders/${o.id}`}
                className="flex items-center gap-3 p-3 bg-white border border-line rounded-xl hover:shadow-md transition active:scale-[0.98]"
              >
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                  <span className={`text-lg font-black ${st.text}`}>#{(o.numero || o.id || "").slice(-4)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-txt truncate">
                      {o.client_nom || o.client?.nom || "Client"}
                    </p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {o.adresse_livraison && (
                      <span className="text-xs text-txt-muted flex items-center gap-1 truncate">
                        <MapPin size={11} />
                        {o.adresse_livraison.quartier || o.adresse_livraison.rue || ""}
                      </span>
                    )}
                    {o.cree_le && (
                      <span className="text-xs text-txt-muted">{formatTime(o.cree_le)}</span>
                    )}
                  </div>
                </div>

                {/* Right side: price + countdown */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-txt">
                    {Number(o.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] text-txt-muted">FCFA</span>
                  </p>
                  {o.statut === "en_attente" && remaining !== null && remaining > 0 && (
                    <p className="text-xs text-amber-600 font-bold mt-0.5">⏱ {mmss(remaining)}</p>
                  )}
                  {o.statut === "en_attente" && remaining !== null && remaining <= 0 && (
                    <p className="text-xs text-red-500 font-bold mt-0.5">Délai expiré</p>
                  )}
                </div>

                <ChevronRight size={16} className="text-txt-muted flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && list.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-txt-muted">
            {filter === "all" ? "Aucune commande" : "Aucune commande dans cette catégorie"}
          </p>
          <p className="text-xs text-txt-muted mt-1">
            {filter === "all" ? "Les commandes apparaîtront ici." : "Essayez un autre filtre."}
          </p>
        </div>
      )}
    </div>
  );
}
