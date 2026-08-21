import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Package, Truck, CheckCircle } from "lucide-react";
import { formatPrice } from "../lib/format";

const STEPS = [
  { key: "en_attente", label: "En attente", icon: Clock },
  { key: "assignee", label: "Assignée", icon: Truck },
  { key: "recuperee", label: "Récupérée", icon: Package },
  { key: "en_cours", label: "En route", icon: MapPin },
  { key: "livree", label: "Livrée", icon: CheckCircle },
];

export function DeliveryDetail() {
  const { id } = useParams();

  const { data: delivery } = useQuery<any>({
    queryKey: ["delivery", id],
    queryFn: () => apiFetch(`/api/deliveries/${id}`),
    enabled: !!id,
  });

  if (!delivery) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  const currentStep = STEPS.findIndex((s) => s.key === delivery.statut);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link to="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h2 className="text-lg font-bold text-gray-900">Livraison #{id?.slice(0, 8)}</h2>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-4">
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? "bg-brand text-white" : isActive ? "bg-brand/20 text-brand" : "bg-gray-100 text-gray-400"}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isActive ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                </div>
                {isActive && i < currentStep && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">DÉPART</p>
            <p className="text-sm text-gray-900">{delivery.pickup_address || delivery.adresse_depart}</p>
          </div>
        </div>
        <div className="ml-3 border-l-2 border-dashed border-gray-200 h-4" />
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">ARRIVÉE</p>
            <p className="text-sm text-gray-900">{delivery.delivery_address || delivery.adresse_arrivee}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      {delivery.frais > 0 && (
        <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Frais de livraison</span>
          <span className="text-lg font-bold text-brand">{formatPrice(delivery.frais)}</span>
        </div>
      )}
    </div>
  );
}
