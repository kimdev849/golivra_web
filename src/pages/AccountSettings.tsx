import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch, getSessionToken } from "../lib/api";
import { toast } from "sonner";

export function AccountSettingsPage() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw) { toast.error("Remplissez tous les champs"); return; }
    if (newPw.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères"); return; }
    const token = getSessionToken();
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch("/api/auth/change-password", { method: "POST", token, jsonBody: { currentPassword: currentPw, newPassword: newPw } });
      toast.success("Mot de passe modifié");
      setCurrentPw(""); setNewPw("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Paramètres</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Changer le mot de passe</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3 text-gray-600"><Lock className="w-5 h-5" /><p className="text-sm">Assurez-vous d'utiliser un mot de passe sécurisé.</p></div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Mot de passe actuel</label>
          <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">Nouveau mot de passe</label>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? "Enregistrement…" : "Modifier"}
        </button>
      </form>
    </div>
  );
}
