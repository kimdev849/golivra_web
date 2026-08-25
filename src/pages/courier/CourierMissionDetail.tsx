import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Package, CheckCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/format";

interface Mission {
  id: string;
  statut: string;
  pickup_address: string;
  pickup_name?: string;
  pickup_phone?: string;
  delivery_address: string;
  delivery_name?: string;
  delivery_phone?: string;
  frais_livraison: number;
  montant_total?: number;
}

export function CourierMissionDetail() {
  const { missionId } = useParams();
  const queryClient = useQueryClient();

  const { data: mission } = useQuery<Mission>({
    queryKey: ["courier-mission", missionId],
    queryFn: () => apiFetch(`/api/couriers/missions/${missionId}`),
    enabled: !!missionId,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiFetch(`/api/couriers/missions/${missionId}/accept`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Mission acceptée");
      queryClient.invalidateQueries({ queryKey: ["courier-mission", missionId] });
    },
    onError: () => toast.error("Erreur lors de l'acceptation"),
  });

  const pickupMutation = useMutation({
    mutationFn: () => apiFetch(`/api/couriers/missions/${missionId}/pickup`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Colis récupéré");
      queryClient.invalidateQueries({ queryKey: ["courier-mission", missionId] });
    },
    onError: () => toast.error("Erreur"),
  });

  const deliverMutation = useMutation({
    mutationFn: () => apiFetch(`/api/couriers/missions/${missionId}/deliver`, { method: "PUT" }),
    onSuccess: () => {
      toast.success("Livraison effectuée");
      queryClient.invalidateQueries({ queryKey: ["courier-mission", missionId] });
    },
    onError: () => toast.error("Erreur"),
  });

  if (!mission) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  const statusActions: Record<string, { mutation: any; label: string; icon: any; color: string }[]> = {
    en_attente: [{ mutation: acceptMutation, label: "Accepter la mission", icon: CheckCircle, color: "bg-green-500" }],
    attribuee: [{ mutation: pickupMutation, label: "Colis récupéré", icon: Package, color: "bg-brand" }],
    en_collecte: [{ mutation: pickupMutation, label: "Confirmer récupération", icon: Package, color: "bg-brand" }],
    collectee: [{ mutation: deliverMutation, label: "Livraison effectuée", icon: Truck, color: "bg-blue-500" }],
    en_route: [{ mutation: deliverMutation, label: "Confirmer livraison", icon: Truck, color: "bg-blue-500" }],
  };

  const actions = statusActions[mission.statut] || [];

  return (
    <div className="space-y-4 min-w-0 max-w-xl">
      <Link to="/courier/missions" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Mission #{mission.id.slice(0, 8)}</h2>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(mission.statut)}`}>
            {mission.statut}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">RAMASSAGE</p>
              <p className="text-sm text-gray-900">{mission.pickup_address}</p>
              {mission.pickup_name && <p className="text-xs text-gray-500 mt-0.5">{mission.pickup_name}</p>}
              {mission.pickup_phone && (
                <a href={`tel:${mission.pickup_phone}`} className="text-xs text-brand flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {mission.pickup_phone}
                </a>
              )}
            </div>
          </div>

          <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4" />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">LIVRAISON</p>
              <p className="text-sm text-gray-900">{mission.delivery_address}</p>
              {mission.delivery_name && <p className="text-xs text-gray-500 mt-0.5">{mission.delivery_name}</p>}
              {mission.delivery_phone && (
                <a href={`tel:${mission.delivery_phone}`} className="text-xs text-brand flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {mission.delivery_phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Frais de livraison</span>
            <span className="text-sm font-semibold text-gray-900">{formatPrice(mission.frais_livraison || 0)}</span>
          </div>
          {mission.montant_total ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Montant payé par le commerce</span>
              <span className="text-sm font-semibold text-gray-900">{formatPrice(mission.montant_total)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-bold text-gray-900">Vos gains</span>
            <span className="text-lg font-bold text-brand">{formatPrice(mission.frais_livraison || 0)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => action.mutation.mutate()}
            disabled={action.mutation.isPending}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${action.color} text-white rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50`}
          >
            <action.icon className="w-4 h-4" />
            {action.mutation.isPending ? "Chargement..." : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "en_attente": return "bg-yellow-100 text-yellow-700";
    case "attribuee": return "bg-blue-100 text-blue-700";
    case "en_collecte": return "bg-blue-100 text-blue-700";
    case "collectee": return "bg-orange-100 text-orange-700";
    case "en_route": return "bg-orange-100 text-orange-700";
    case "livree": return "bg-green-100 text-green-700";
    case "annulee": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
}
