import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Bell, Check, Package, Truck, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function VendorNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["vendor-notifications"],
    queryFn: () => apiFetch("/api/notifications"),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "PUT" }),
    onSuccess: () => {
      toast.success("Toutes lues");
      queryClient.invalidateQueries({ queryKey: ["vendor-notifications"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "commande": return <Package className="w-4 h-4" />;
      case "livraison": return <Truck className="w-4 h-4" />;
      case "message": return <MessageCircle className="w-4 h-4" />;
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
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.lue && markReadMutation.mutate(n.id)}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition cursor-pointer ${!n.lue ? "border-brand/30 bg-brand/5" : "hover:bg-gray-50"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.lue ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-400"}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.titre}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </div>
              {!n.lue && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
