import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../store";
import { Truck, Navigation, Package, Wallet, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../lib/format";

interface CourierProfile {
  livreur?: { est_disponible?: boolean };
  resume?: {
    missions_actives: number;
    missions_aujourdhui: number;
    total_historique: number;
  };
}

interface Mission {
  id: string;
  frais_livraison: number;
  pickup_address: string;
}

export function CourierHome() {
  const { user } = useAuthStore();

  const { session } = useAuthStore();
  const token = session?.token;

  const { data: stats } = useQuery<CourierProfile>({
    queryKey: ["courier-stats"],
    queryFn: () => apiFetch("/api/delivery/courier/me", { token }),
    enabled: !!token,
  });

  const { data: missions = [] } = useQuery<Mission[]>({
    queryKey: ["courier-missions"],
    queryFn: () => apiFetch("/api/delivery/courier/missions?scope=open", { token }),
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bonjour, {user?.prenom || "Coursier"} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Voici votre tableau de bord</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Truck} label="Livraisons aujourd'hui" value={stats?.resume?.missions_aujourdhui || 0} color="text-brand" />
        <StatCard icon={Package} label="En cours" value={stats?.resume?.missions_actives || 0} color="text-blue-600" />
        <StatCard icon={Wallet} label="Total historique" value={String(stats?.resume?.total_historique || 0)} color="text-green-600" />
      </div>

      {/* Missions disponibles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Missions disponibles</h2>
          <Link to="/courier/missions" className="text-xs font-semibold text-brand hover:text-brand/80">Voir tout →</Link>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border text-gray-400">
            <Navigation className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune mission disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.slice(0, 5).map((m) => (
              <Link
                key={m.id}
                to={`/courier/missions/${m.id}`}
                className="block bg-white rounded-xl border p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">#{m.id.slice(0, 8)}</span>
                  <span className="text-sm font-bold text-brand">{formatPrice(m.frais_livraison || 0)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" /> {m.pickup_address?.slice(0, 30)}...
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
