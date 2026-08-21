import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Link } from "react-router-dom";
import { Package, MapPin, Clock, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/format";

export function VendorCreateExternalDelivery() {
  const queryClient = useQueryClient();

  const { data: addresses = [] } = useQuery({
    queryKey: ["vendor-addresses"],
    queryFn: () => apiFetch("/api/vendors/addresses"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/vendors/deliveries/external", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Livraison créée");
      queryClient.invalidateQueries({ queryKey: ["vendor-deliveries"] });
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Créer une livraison externe</h2>

      <div className="bg-white rounded-xl border p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du destinataire</label>
          <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nom complet" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
          <input type="tel" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+225 XX XX XX XX XX" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse de livraison</label>
          <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Adresse complète" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description du colis</label>
          <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Description..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Montant à encaisser (optionnel)</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" min={0} />
        </div>
      </div>
    </div>
  );
}
