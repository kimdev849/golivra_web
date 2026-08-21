import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { toast } from "sonner";

export function VendorShopSettings() {
  const [shop, setShop] = useState<Record<string, unknown>>({});
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [telephone, setTelephone] = useState("");
  const [delaiPrep, setDelaiPrep] = useState("20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<Record<string, unknown>>(shop?.id ? `/api/enterprises/${shop.id}` : "/api/enterprises/", { token })
      .then((data) => { setShop(data); setNom((data.nom as string) ?? ""); setDescription((data.description as string) ?? ""); setTelephone((data.telephone as string) ?? ""); setDelaiPrep(String((data.delai_preparation_min as number) ?? 20)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getSessionToken();
    if (!token) return;
    setSaving(true);
    try {
      await apiFetch(shop?.id ? `/api/enterprises/${shop.id}` : "/api/enterprises/", { method: "PATCH", token, jsonBody: { nom: nom.trim(), description: description.trim() || null, telephone: telephone.trim() || null, delai_preparation_min: Number(delaiPrep) || 20 } });
      toast.success("Paramètres enregistrés");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setSaving(false); }
  };

  if (loading) return <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <h2 className="text-base font-bold text-gray-900">Paramètres du commerce</h2>
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Nom du commerce</label><input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Téléphone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Temps de préparation (min)</label><input type="number" value={delaiPrep} onChange={(e) => setDelaiPrep(e.target.value)} min="5" max="180" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" /></div>
      </div>
      <button type="submit" disabled={saving} className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
