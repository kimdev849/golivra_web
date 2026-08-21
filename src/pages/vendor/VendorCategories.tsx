import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  nom: string;
  produit_count: number;
}

export function VendorCategories() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["vendor-categories"],
    queryFn: () => apiFetch("/api/enterprises/mine"),
  });

  const [newCat, setNewCat] = useState("");
  const [showForm, setShowForm] = useState(false);

  const addMutation = useMutation({
    mutationFn: (nom: string) => apiFetch("/api/enterprises/mine", { method: "POST", body: JSON.stringify({ nom }) }),
    onSuccess: () => {
      toast.success("Catégorie ajoutée");
      queryClient.invalidateQueries({ queryKey: ["vendor-categories"] });
      setNewCat("");
      setShowForm(false);
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/enterprises/mine/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Catégorie supprimée");
      queryClient.invalidateQueries({ queryKey: ["vendor-categories"] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Catégories</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand/90 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-4 flex gap-2">
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Nom de la catégorie"
          />
          <button
            onClick={() => addMutation.mutate(newCat)}
            disabled={!newCat.trim() || addMutation.isPending}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{cat.nom}</p>
                <p className="text-xs text-gray-500">{cat.produit_count} produits</p>
              </div>
            </div>
            <button
              onClick={() => deleteMutation.mutate(cat.id)}
              className="text-red-400 hover:text-red-600 transition p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
