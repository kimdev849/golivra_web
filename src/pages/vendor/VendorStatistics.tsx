import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";

function formatFcfa(n: number) { return `${n.toLocaleString("fr-FR")} FCFA`; }

export function VendorStatistics() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<Record<string, unknown>>("/api/vendor/stats", { token })
      .then((data) => setStats(data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  const items = [
    { label: "Commandes totales", value: String(stats.commandes_total ?? 0) },
    { label: "CA total", value: formatFcfa(Number(stats.ca_total_fcfa ?? 0)) },
    { label: "Panier moyen", value: formatFcfa(Number(stats.panier_moyen_fcfa ?? 0)) },
    { label: "Note moyenne", value: stats.note_moyenne ? `${Number(stats.note_moyenne).toFixed(1)} ⭐` : "—" },
  ];

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Statistiques</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xl font-black text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
