import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { MapPin, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  label: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  principale: boolean;
}

export function VendorShopAddresses() {
  const queryClient = useQueryClient();
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["vendor-addresses"],
    queryFn: () => apiFetch("/api/enterprises/mine"),
  });

  const [newAddress, setNewAddress] = useState({ label: "", adresse: "" });
  const [showForm, setShowForm] = useState(false);

  const addMutation = useMutation({
    mutationFn: (data: { label: string; adresse: string }) =>
      apiFetch("/api/enterprises/mine", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Adresse ajoutée");
      queryClient.invalidateQueries({ queryKey: ["vendor-addresses"] });
      setNewAddress({ label: "", adresse: "" });
      setShowForm(false);
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/enterprises/mine/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Adresse supprimée");
      queryClient.invalidateQueries({ queryKey: ["vendor-addresses"] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Adresses de livraison</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand/90 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input
            type="text"
            value={newAddress.label}
            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ex: Point de vente, Entrepôt..."
          />
          <input
            type="text"
            value={newAddress.adresse}
            onChange={(e) => setNewAddress({ ...newAddress, adresse: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Adresse complète"
          />
          <button
            onClick={() => addMutation.mutate(newAddress)}
            disabled={!newAddress.label || !newAddress.adresse || addMutation.isPending}
            className="w-full px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {addMutation.isPending ? "Ajout..." : "Ajouter l'adresse"}
          </button>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune adresse enregistrée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{addr.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{addr.adresse}</p>
                    {addr.principale && (
                      <span className="inline-block mt-1 text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                        Principale
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  className="text-red-400 hover:text-red-600 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
