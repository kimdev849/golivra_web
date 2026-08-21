import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function VendorPreparation() {
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["vendor-orders-prep"],
    queryFn: () => apiFetch("/api/vendors/orders?status=acceptee"),
  });

  const readyMutation = useMutation({
    mutationFn: (orderId: string) => apiFetch(`/api/vendors/orders/${orderId}/ready`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Commande marquée prête");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders-prep"] });
    },
    onError: () => toast.error("Erreur"),
  });

  return (
    <div className="space-y-4">
      <Link to="/vendor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h2 className="text-lg font-bold text-gray-900">Préparation</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune commande à préparer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString("fr-FR")}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Acceptée
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{item.nom} × {item.quantite}</span>
                    <span className="font-semibold">{item.prix} FCFA</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => readyMutation.mutate(order.id)}
                disabled={readyMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                Marquer comme prêt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
