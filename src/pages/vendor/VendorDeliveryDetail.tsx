import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Truck, MapPin, Clock, Phone, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/format";

export function VendorDeliveryDetail() {
  const { orderId } = useParams();
  const queryClient = useQueryClient();

  const { data: order } = useQuery<any>({
    queryKey: ["vendor-order", orderId],
    queryFn: () => apiFetch(`/api/orders/vendor/mine/${orderId}`),
    enabled: !!orderId,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiFetch(`/api/orders/vendor/mine/${orderId}/accept`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Commande acceptée");
      queryClient.invalidateQueries({ queryKey: ["vendor-order", orderId] });
    },
    onError: () => toast.error("Erreur lors de l'acceptation"),
  });

  const readyMutation = useMutation({
    mutationFn: () => apiFetch(`/api/orders/vendor/mine/${orderId}/ready`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Commande prête pour livraison");
      queryClient.invalidateQueries({ queryKey: ["vendor-order", orderId] });
    },
    onError: () => toast.error("Erreur"),
  });

  if (!order) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-4">
      <Link to="/vendor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Commande #{order.id.slice(0, 8)}</h2>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusLabel(order.statut).color}`}>
            {getStatusLabel(order.statut).label}
          </span>
        </div>

        {/* Articles */}
        <div className="space-y-3 mb-4">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.nom}</p>
                <p className="text-xs text-gray-500">× {item.quantite}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatPrice(item.prix * item.quantite)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-sm font-bold text-gray-900">Total</span>
          <span className="text-sm font-bold text-brand">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Livraison */}
      {order.adresse_livraison && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold text-gray-900">Adresse de livraison</span>
          </div>
          <p className="text-sm text-gray-600">{order.adresse_livraison}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {order.statut === "en_attente" && (
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {acceptMutation.isPending ? "Acceptation..." : "Accepter"}
          </button>
        )}
        {order.statut === "acceptee" && (
          <button
            onClick={() => readyMutation.mutate()}
            disabled={readyMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition disabled:opacity-50"
          >
            <Package className="w-4 h-4" />
            {readyMutation.isPending ? "Préparation..." : "Prêt"}
          </button>
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "en_attente": return { label: "En attente", color: "bg-yellow-100 text-yellow-700" };
    case "acceptee": return { label: "Acceptée", color: "bg-blue-100 text-blue-700" };
    case "en_preparation": return { label: "En préparation", color: "bg-orange-100 text-orange-700" };
    case "prete": return { label: "Prête", color: "bg-purple-100 text-purple-700" };
    case "en_cours": return { label: "En cours", color: "bg-blue-100 text-blue-700" };
    case "livree": return { label: "Livrée", color: "bg-green-100 text-green-700" };
    case "annulee": return { label: "Annulée", color: "bg-red-100 text-red-700" };
    default: return { label: status, color: "bg-gray-100 text-gray-600" };
  }
}
