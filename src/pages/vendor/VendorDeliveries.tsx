import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, MapPin, Clock, ChevronRight, Package } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";

function formatFcfa(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function deliveryStatusStyle(s: string) {
  switch (s) {
    case "en_attente": case "assignee": return { bg: "bg-amber-50", text: "text-amber-700", label: "En attente" };
    case "en_cours": case "en_route": return { bg: "bg-blue-50", text: "text-blue-600", label: "En route" };
    case "livree": return { bg: "bg-green-50", text: "text-brand", label: "Livrée" };
    case "annulee": return { bg: "bg-red-50", text: "text-red-600", label: "Annulée" };
    default: return { bg: "bg-gray-100", text: "text-gray-600", label: s };
  }
}

export function VendorDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  useEffect(() => {
    const fetch = async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const d = await apiFetch<any[]>("/api/vendor/deliveries", { token });
        if (Array.isArray(d)) setDeliveries(d);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = deliveries.filter((d) => {
    if (filter === "active") return ["en_attente", "assignee", "en_cours", "en_route"].includes(d.statut);
    if (filter === "done") return d.statut === "livree";
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <h1 className="text-xl font-extrabold text-txt">LIVRAISONS</h1>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {[
          { key: "all" as const, label: "Toutes" },
          { key: "active" as const, label: "En cours" },
          { key: "done" as const, label: "Livrées" },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition border ${
              filter === p.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-txt-muted border-line"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((d) => {
            const st = deliveryStatusStyle(d.statut);
            return (
              <Link
                key={d.id}
                to={`/vendor/delivery/${d.id}`}
                className="flex items-center gap-3 p-3 bg-white border border-line rounded-xl hover:shadow-md transition"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                  <Truck size={20} className={st.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-txt truncate">
                      Livraison #{(d.id || "").slice(0, 8)}
                    </p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {d.adresse_destination && (
                      <span className="text-xs text-txt-muted flex items-center gap-1 truncate">
                        <MapPin size={11} />
                        {d.adresse_destination.quartier || d.adresse_destination}
                      </span>
                    )}
                    {d.cree_le && (
                      <span className="text-xs text-txt-muted">{formatTime(d.cree_le)}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-txt-muted flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-txt-muted">Aucune livraison</p>
          <p className="text-xs text-txt-muted mt-1">Les livraisons apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
}
