import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { resolveImageUrl } from "../../lib/images";
import { useState } from "react";
import { Package, Plus, Trash2, Search, Edit } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/format";
import { Link } from "react-router-dom";

export function VendorStock() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["vendor-stock", search],
    queryFn: () => apiFetch(`/api/vendors/products${search ? `?q=${search}` : ""}`),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      apiFetch(`/api/vendors/products/${id}/stock`, { method: "PUT", body: JSON.stringify({ stock }) }),
    onSuccess: () => {
      toast.success("Stock mis à jour");
      queryClient.invalidateQueries({ queryKey: ["vendor-stock"] });
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Gestion du stock</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
          placeholder="Rechercher un produit..."
        />
      </div>

      <div className="space-y-2">
        {products.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center overflow-hidden">
                  {resolveImageUrl(p) ? (
                    <img src={resolveImageUrl(p)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-brand" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.nom}</p>
                  <p className="text-xs text-gray-500">{formatPrice(p.prix)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={p.stock ?? 0}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val !== p.stock) {
                      updateStockMutation.mutate({ id: p.id, stock: val });
                    }
                  }}
                  className="w-16 text-center border rounded-lg px-2 py-1 text-sm font-bold"
                  min={0}
                />
                <span className="text-xs text-gray-500">unités</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
