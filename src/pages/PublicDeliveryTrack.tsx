import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useParams } from "react-router-dom";
import { MapPin, Package, Truck, Clock, CheckCircle, Phone } from "lucide-react";

interface PublicTrackData {
  id: string;
  statut: string;
  client_nom?: string;
  commerce_nom?: string;
  adresse_livraison?: string;
  note?: string;
  created_at?: string;
  attribuee_at?: string | null;
  collectee_at?: string | null;
  livree_at?: string | null;
}

const STEPS = [
  { key: "en_attente", label: "Commande créée", icon: Package },
  { key: "attribuee", label: "Livreur assigné", icon: Truck },
  { key: "en_collecte", label: "Livreur en route", icon: Truck },
  { key: "collectee", label: "Colis récupéré", icon: CheckCircle },
  { key: "en_route", label: "En route vers vous", icon: Truck },
  { key: "livree", label: "Livrée", icon: CheckCircle },
];

function statutIndex(statut: string): number {
  const idx = STEPS.findIndex((s) => s.key === statut);
  return idx >= 0 ? idx : 0;
}

function statutLabel(statut: string): string {
  const s = STEPS.find((s) => s.key === statut);
  return s?.label ?? statut;
}

export function PublicDeliveryTrack() {
  const { id } = useParams<{ id: string }>();

  const { data: delivery, isLoading, isError } = useQuery<PublicTrackData>({
    queryKey: ["public-delivery-track", id],
    queryFn: () => apiFetch(`/api/delivery/track/${id}`),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Chargement du suivi…</p>
        </div>
      </div>
    );
  }

  if (isError || !delivery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">Livraison introuvable</h1>
          <p className="text-sm text-gray-500">Vérifiez le lien reçu et réessayez.</p>
        </div>
      </div>
    );
  }

  const currentIdx = statutIndex(delivery.statut);
  const isDelivered = delivery.statut === "livree";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-8 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900">Suivi de livraison</h1>
          <p className="text-xs text-gray-400 mt-1">#{delivery.id.slice(0, 8)}</p>
        </div>

        {/* Status card */}
        <div className={`rounded-xl border p-4 mb-4 ${isDelivered ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center ${isDelivered ? "bg-green-100" : "bg-brand/10"}`}>
              {isDelivered ? (
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
              ) : (
                <Truck className="w-5 h-5 text-brand mx-auto" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{statutLabel(delivery.statut)}</p>
              <p className="text-xs text-gray-500">
                {isDelivered ? "Votre colis a bien été livré" : "Suivi en cours…"}
              </p>
            </div>
          </div>
        </div>

        {/* Steps timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          {STEPS.map((step, idx) => {
            const done = idx <= currentIdx;
            const current = idx === currentIdx && !isDelivered;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-brand text-white" : "bg-gray-100 text-gray-400"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-0.5 h-6 ${done && idx < currentIdx ? "bg-brand" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pt-1 pb-3">
                  <p className={`text-sm font-medium ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {delivery.commerce_nom && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{delivery.commerce_nom}</span>
            </div>
          )}
          {delivery.adresse_livraison && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">{delivery.adresse_livraison}</span>
            </div>
          )}
          {delivery.created_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                Créée le {new Date(delivery.created_at).toLocaleString("fr-FR")}
              </span>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">GoLivra · Suivi en temps réel</p>
      </div>
    </div>
  );
}
