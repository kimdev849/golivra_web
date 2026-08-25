import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../store";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Truck,
  Users,
  Clock,
  Package,
  TrendingUp,
  Shield,
  BarChart3,
} from "lucide-react";

interface Stats {
  livreurs_total: number;
  livreurs_disponibles: number;
  livraisons_en_cours: number;
  livraisons_en_retard: number;
  livraisons_livrees_aujourdhui: number;
  delai_moyen_minutes?: number;
  revenus_livraison_aujourdhui_fcfa?: number;
}

export function LogisticsHome() {
  const { user } = useAuthStore();
  const { session } = useAuthStore();
  const token = session?.token;

  const { data: stats } = useQuery<Stats>({
    queryKey: ["logistics-stats"],
    queryFn: () => apiFetch("/api/logistics/stats", { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const { data: incidents = [] } = useQuery<any[]>({
    queryKey: ["logistics-incidents"],
    queryFn: () => apiFetch("/api/logistics/incidents", { token }),
    refetchInterval: 15_000,
    enabled: !!token,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">
          Bonjour, {user?.prenom || "Gestionnaire"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Centre opérationnel GoLivra</p>
      </div>

      {/* Alert Banner */}
      {incidents.length > 0 && (
        <Link
          to="/logistics/incidents"
          className="block bg-red-50 border border-red-200 rounded-xl p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-red-800">
                🚨 {incidents.length} incident{incidents.length > 1 ? "s" : ""} nécessitant une intervention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Cliquez pour ouvrir le centre d'incidents
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Truck />}
          label="Livraisons en cours"
          value={stats?.livraisons_en_cours || 0}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<AlertTriangle />}
          label="En retard"
          value={stats?.livraisons_en_retard || 0}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<Users />}
          label="Livreurs disponibles"
          value={`${stats?.livreurs_disponibles || 0}/${stats?.livreurs_total || 0}`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Package />}
          label="Livrées aujourd'hui"
          value={stats?.livraisons_livrees_aujourdhui || 0}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/logistics/incidents"
          className="bg-white border border-red-200 rounded-xl p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Centre d'incidents</p>
              <p className="text-xs text-gray-500">Détection → Intervention</p>
            </div>
          </div>
        </Link>

        <Link
          to="/logistics/deliveries"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Courses actives</p>
              <p className="text-xs text-gray-500">{stats?.livraisons_en_cours || 0} en cours</p>
            </div>
          </div>
        </Link>

        <Link
          to="/logistics/couriers"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mes livreurs</p>
              <p className="text-xs text-gray-500">{stats?.livreurs_total || 0} livreurs</p>
            </div>
          </div>
        </Link>

        <Link
          to="/logistics/stats"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Statistiques</p>
              <p className="text-xs text-gray-500">Performance & revenus</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent incidents */}
      {incidents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-900">🚨 Incidents récents</h2>
            <Link to="/logistics/incidents" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {incidents.slice(0, 3).map((inc: any) => (
              <Link
                key={inc.id}
                to="/logistics/incidents"
                className="block bg-white border border-red-200 rounded-xl p-3 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-600">+{inc.delay_label}</span>
                    <span className="text-xs text-gray-500">#{inc.id.slice(0, 8)}</span>
                    {inc.livreur_nom && (
                      <span className="text-xs text-gray-600">• {inc.livreur_nom}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                    {inc.statut_label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${bgColor}`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-gray-500">{label}</p>
    </div>
  );
}
