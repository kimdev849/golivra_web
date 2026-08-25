import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { vendorOrderStatusLabel as statusLabel } from "../../lib/ux-copy";
import { toast } from "sonner";

function formatFcfa(n: number) { return `${n.toLocaleString("fr-FR")} FCFA`; }

type VendorOrder = {
  id: string; ref: string; statut: string; prixTotal: number; fraisLivraison: number;
  paiement_statut?: string; sous_commande_id?: string; acceptation_limite_at?: string;
  clientNom: string; clientTel: string; adresse: string;
  lignes: { id: string; nom: string; quantite: number; prixUnitaire: number }[];
  creeLeLabel: string;
};

export function VendorOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token || !id) return;
    apiFetch<VendorOrder>(`/api/orders/vendor/${id}`, { token })
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const runStatus = async (statut: string, msg: string, actionKey: string, raisonRefus?: string) => {
    if (!order || !order.sous_commande_id || !id) return;
    const token = getSessionToken();
    if (!token) return;
    setActing(actionKey);
    try {
      await apiFetch(`/api/orders/vendor/${id}/status`, { method: "PATCH", token, jsonBody: { statut, sousCommandeId: order.sous_commande_id, raisonRefus } });
      setOrder((prev) => prev ? { ...prev, statut } : prev);
      toast.success(msg);
      if (statut === "refusee") navigate("/vendor");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setActing(null); }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-6"><div className="h-48 bg-gray-100 rounded-xl animate-pulse" /></div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500"><p>Commande introuvable</p></div>;

  const showAccept = order.statut === "en_attente";
  const paid = order.paiement_statut === "valide";
  const showPrep = order.statut === "a_preparer" || order.statut === "en_preparation";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/vendor" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Retour</Link>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">#{order.ref}</h1>
          <p className="text-sm text-gray-500">{order.creeLeLabel}</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">{statusLabel(order.statut)}</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Client</h2>
        <p className="text-sm text-gray-700">{order.clientNom}</p>
        {order.clientTel && <a href={`tel:${order.clientTel}`} className="text-xs text-brand hover:underline flex items-center gap-1"><Phone className="w-3 h-3" /> {order.clientTel}</a>}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Articles</h2>
        {order.lignes.map((l) => (
          <div key={l.id} className="flex justify-between text-sm py-1"><span>{l.quantite}× {l.nom}</span><span className="font-medium">{formatFcfa(l.prixUnitaire * l.quantite)}</span></div>
        ))}
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-sm"><span className="text-gray-500">Livraison</span><span>{formatFcfa(order.fraisLivraison)}</span></div>
        <div className="flex justify-between font-bold text-sm mt-1"><span>Total</span><span className="text-brand">{formatFcfa(order.prixTotal + order.fraisLivraison)}</span></div>
      </div>
      {showAccept && (
        <div className="flex gap-3">
          <button disabled={!!acting} onClick={() => runStatus("acceptee", "Commande acceptée", "accept")} className="flex-1 bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {acting === "accept" ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-4 h-4" />} Accepter
          </button>
          <button disabled={!!acting} onClick={() => { if (confirm("Refuser cette commande ?")) runStatus("refusee", "Commande refusée", "refuse", "Refusé par le commerce"); }} className="flex-1 border-2 border-red-300 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {acting === "refuse" ? <span className="animate-spin">⏳</span> : <XCircle className="w-4 h-4" />} Refuser
          </button>
        </div>
      )}
      {showPrep && (
        <button disabled={!!acting} onClick={() => order.statut === 'en_preparation'
          ? runStatus('prete', 'Commande prête.', 'ready')
          : runStatus('en_preparation', 'Préparation démarrée.', 'prep')} 
          className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition disabled:opacity-50">
          {(acting === 'prep' || acting === 'ready') ? 'En cours…' : order.statut === 'en_preparation' ? 'Marquer prête' : 'Commencer la préparation'}
        </button>
      )}
      {!paid && order.statut === "a_preparer" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">En attente de paiement du client…</div>
      )}
    </div>
  );
}
