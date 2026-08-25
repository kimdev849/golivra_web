import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken } from "../../lib/api";
import { toast } from "sonner";

export function VendorAddProduct() {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [stockIllimite, setStockIllimite] = useState(true);
  const [kind, setKind] = useState<"plat" | "article">("plat");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prix) { toast.error("Nom et prix requis"); return; }
    if (Number(prix) < 10) { toast.error("Le prix minimum est 10 FCFA"); return; }
    const token = getSessionToken();
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch("/api/products/enterprise/0", { method: "POST", token, jsonBody: {
        nom: nom.trim(), description: description.trim() || null, prix: Number(prix),
        stock: stockIllimite ? null : (stock ? Number(stock) : null), stock_illimite: stockIllimite,
        est_disponible: true, kind,
      }});
      toast.success("Produit ajouté");
      navigate("/vendor/catalog");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link to="/vendor/catalog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Catalogue</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Ajouter un produit</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Type</label>
          <div className="flex gap-2">
            {(["plat", "article"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${kind === k ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}>
                {k === "plat" ? "🍽️ Plat" : "📦 Article"}
              </button>
            ))}
          </div>
        </div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Nom *</label><input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" required /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Prix (FCFA) *</label><input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} min="10" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" required /></div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="stockIllimite" checked={stockIllimite} onChange={(e) => setStockIllimite(e.target.checked)} className="rounded" />
          <label htmlFor="stockIllimite" className="text-sm text-gray-700">Stock illimité</label>
        </div>
        {!stockIllimite && <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Stock</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" /></div>}
        <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
