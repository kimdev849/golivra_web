import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../store";
import { Bell, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CourierNotif {
  id: string;
  type: string;
  titre: string;
  corps: string;
  est_lue: boolean;
  created_at: string;
}

export function CourierNotifications() {
  const queryClient = useQueryClient();

  const { session } = useAuthStore();
  const token = session?.token;

  const { data: notifications = [] } = useQuery<CourierNotif[]>({
    queryKey: ["courier-notifications"],
    queryFn: async () => {
      const d = await apiFetch<{ items?: CourierNotif[]; unread_count?: number } | CourierNotif[]>("/api/notifications?limit=50", { token });
      if (Array.isArray(d)) return d;
      return Array.isArray(d?.items) ? d.items : [];
    },
    enabled: !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courier-notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "PATCH", token }),
    onSuccess: () => {
      toast.success("Toutes lues");
      queryClient.invalidateQueries({ queryKey: ["courier-notifications"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "mission": return <MapPin className="w-4 h-4" />;
      case "livraison": return <Truck className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
        <button
          onClick={() => markAllMutation.mutate()}
          className="text-xs font-semibold text-brand hover:text-brand/80 transition"
        >
          Tout marquer lu
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.est_lue && markReadMutation.mutate(n.id)}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition cursor-pointer ${!n.est_lue ? "border-brand/30 bg-brand/5" : "hover:bg-gray-50"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.est_lue ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-400"}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.titre}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.corps}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </div>
              {!n.est_lue && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
