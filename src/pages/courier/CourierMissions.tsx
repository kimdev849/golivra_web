import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Navigation, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../lib/format";
import { useState } from "react";

interface Mission {
  id: string;
  frais_livraison: number;
  pickup_address: string;
  delivery_address: string;
  statut: string;
}

const TABS = [
  { key: "open", label: "Disponibles", status: "" },
  { key: "mine", label: "En cours", status: "" },
  { key: "livree", label: "Terminées", status: "livree" },
];

export function CourierMissions() {
  const [tab, setTab] = useState("open");

  const selectedTab = TABS.find((t) => t.key === tab);
  const statusParam = selectedTab?.status ? `&status=${selectedTab.status}` : '';
  const scopeParam = tab === 'open' ? '&scope=open' : tab === 'mine' ? '&scope=mine' : '';

  const { data: missions = [] } = useQuery<Mission[]>({
    queryKey: ["courier-missions", tab],
    queryFn: () => apiFetch(`/api/couriers/missions?${scopeParam}${statusParam}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Missions</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${tab === t.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune mission</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <Link
              key={m.id}
              to={`/courier/missions/${m.id}`}
              className="block bg-white rounded-xl border p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">Mission #{m.id.slice(0, 8)}</span>
                <span className="text-sm font-bold text-brand">{formatPrice(m.frais_livraison || 0)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Ramassage</p>
                    <p className="text-sm text-gray-900">{m.pickup_address || "Adresse non définie"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Livraison</p>
                    <p className="text-sm text-gray-900">{m.delivery_address || "Adresse non définie"}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
