import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken } from "../lib/api";
import { useAuthStore } from "../store";
import { toast } from "sonner";

export function ProfileEditPage() {
  const { user, session, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [nom, setNom] = useState(user?.nom ?? "");
  const [telephone, setTelephone] = useState(user?.telephone ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { toast.error("Le nom est requis"); return; }
    const token = getSessionToken();
    if (!token) return;
    setLoading(true);
    try {
      const updated = await apiFetch<{ id: string; nom: string; telephone: string }>("/api/auth/me", { method: "PATCH", token, jsonBody: { nom: nom.trim(), telephone: telephone.trim() } });
      if (session) { setSession({ ...session, user: { ...session.user, nom: updated.nom, telephone: updated.telephone } }); }
      toast.success("Profil modifié");
      navigate("/profile");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Profil</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Modifier le profil</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Nom</label><input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm" /></div>
        <div><label className="text-xs font-semibold text-gray-700 mb-1 block">Téléphone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm" /></div>
        <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50">{loading ? "Enregistrement…" : "Enregistrer"}</button>
      </form>
    </div>
  );
}
