import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { resolveImageUrl } from "../../lib/images";
import { toast } from "sonner";

function formatFcfa(n: number | string) { return `${Number(n).toLocaleString("fr-FR")} FCFA`; }

type Product = { id: string; nom: string; prix: number; stock?: number | null; est_disponible: boolean; kind: string; image_url?: string | null };

export function VendorCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<Product[]>("/api/enterprises/mine", { token })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async (product: Product) => {
    const token = getSessionToken();
    if (!token) return;
    try {
      await apiFetch(`/api/products/enterprise/0/${product.id}`, { method: "PATCH", token, jsonBody: { est_disponible: !product.est_disponible } });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, est_disponible: !p.est_disponible } : p));
      toast.success(product.est_disponible ? "Produit masqué" : "Produit rendu visible");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Supprimer "${product.nom}" ?`)) return;
    const token = getSessionToken();
    if (!token) return;
    try {
      await apiFetch(`/api/products/enterprise/0/${product.id}`, { method: "DELETE", token });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Produit supprimé");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Catalogue ({products.length})</h2>
        <a href="/vendor/add-product" className="bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-brand-700 transition flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter</a>
      </div>
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><Package className="w-10 h-10 mx-auto mb-3 text-gray-300" /><p className="font-semibold">Aucun produit</p></div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${p.est_disponible ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {resolveImageUrl(p) ? <img src={resolveImageUrl(p)!} alt={p.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-5 h-5" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.nom}</p>
                <p className="text-xs text-gray-500">{formatFcfa(p.prix)} {p.stock != null ? `· Stock: ${p.stock}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleAvailability(p)} className="p-1.5 text-gray-400 hover:text-brand transition" title={p.est_disponible ? "Masquer" : "Afficher"}>
                  {p.est_disponible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteProduct(p)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Supprimer">
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
