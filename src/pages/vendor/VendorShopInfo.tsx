import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { Store, Upload, Save, MapPin } from "lucide-react";
import { toast } from "sonner";

export function VendorShopInfo() {
  const queryClient = useQueryClient();
  const { data: shop } = useQuery<any>({
    queryKey: ["vendor-shop"],
    queryFn: () => apiFetch("/api/enterprises/mine"),
  });

  const [form, setForm] = useState({
    nom_commerce: shop?.nom_commerce || "",
    description: shop?.description || "",
    telephone: shop?.telephone || "",
    logo_url: shop?.logo_url || "",
    couverture_url: shop?.couverture_url || "",
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => apiFetch("/api/enterprises/mine", { method: "PATCH", jsonBody: data }),
    onSuccess: () => { toast.success("Informations sauvegardées"); queryClient.invalidateQueries({ queryKey: ["vendor-shop"] }); },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Informations de la boutique</h2>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center overflow-hidden border-2 border-brand/20">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-brand" />
            )}
          </div>
          <div>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-200 transition">
              <Upload className="w-3.5 h-3.5" /> Changer le logo
            </button>
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du commerce</label>
          <input
            type="text"
            value={form.nom_commerce}
            onChange={(e) => setForm({ ...form, nom_commerce: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Mon Commerce"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Décrivez votre commerce..."
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
          <input
            type="tel"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="+225 XX XX XX XX XX"
          />
        </div>

        {/* Couverture */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Image de couverture</label>
          <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-gray-300">
            {form.couverture_url ? (
              <img src={form.couverture_url} alt="Couverture" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Ajouter une image</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
