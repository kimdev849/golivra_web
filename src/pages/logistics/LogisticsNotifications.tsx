import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getSessionToken } from "../../lib/api";
import { Bell, Truck, AlertTriangle, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface LogistNotif {
  id: string;
  type: string;
  titre: string;
  corps: string;
  est_lue: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
}

export function LogisticsNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<LogistNotif[]>({
    queryKey: ["logistics-notifications"],
    queryFn: async () => {
      const token = getSessionToken();
      const d = await apiFetch<{ items?: LogistNotif[]; unread_count?: number } | LogistNotif[]>(
        "/api/notifications?limit=50",
        { method: "GET", token }
      );
      if (Array.isArray(d)) return d;
      return Array.isArray(d?.items) ? d.items : [];
    },
    refetchInterval: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => {
      const token = getSessionToken();
      return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token, jsonBody: {} });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logistics-notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => {
      const token = getSessionToken();
      return apiFetch("/api/notifications/read-all", { method: "PATCH", token, jsonBody: {} });
    },
    onSuccess: () => {
      toast.success("Toutes marquées comme lues");
      queryClient.invalidateQueries({ queryKey: ["logistics-notifications"] });
    },
  });

  const getIcon = (type: string) => {
    if (type.includes("retard") || type.includes("incident") || type.includes("anomalie") || type.includes("bloquee"))
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    if (type.includes("livraison") || type.includes("livreur") || type.includes("sans_livreur"))
      return <Truck className="w-4 h-4 text-blue-500" />;
    if (type.includes("courier") || type.includes("livreur"))
      return <Users className="w-4 h-4 text-purple-500" />;
    return <Bell className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-500">Alertes retards, incidents et livraisons</p>
        </div>
        <button
          onClick={() => markAllMutation.mutate()}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          Tout marquer lu
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-[3px] border-t-transparent border-blue-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Aucune notification</p>
          <p className="text-xs mt-1">Les alertes de livraison apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.est_lue && markReadMutation.mutate(n.id)}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition cursor-pointer ${
                !n.est_lue ? "border-blue-300 bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !n.est_lue ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.est_lue ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                  {n.titre}
                </p>
                {n.corps && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.corps}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              {!n.est_lue && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
