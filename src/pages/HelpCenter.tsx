import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ = [
  { q: "Comment passer une commande ?", a: "Choisissez un commerce, ajoutez des produits au panier, puis validez. Vous recevrez une notification quand le commerce acceptera votre commande." },
  { q: "Comment payer ma commande ?", a: "Après acceptation du commerce, vous recevez une demande de paiement Mobile Money (Airtel Money ou MTN MoMo). Validez la transaction sur votre téléphone." },
  { q: "Puis-je annuler ma commande ?", a: "Oui, tant que le commerce ne l'a pas acceptée. Après acceptation, vous pouvez annuler mais un remboursement sera déclenché." },
  { q: "Comment suivre ma livraison ?", a: "Dans l'onglet Commandes, ouvrez votre commande active. Vous verrez le statut en temps réel : préparation, livreur assigné, en route, livrée." },
  { q: "Comment modifier mon adresse ?", a: "Allez dans Profil > Mes adresses. Vous pouvez ajouter, modifier ou supprimer des adresses." },
  { q: "Le commerce a refusé ma commande, que faire ?", a: "Si un commerce ne peut pas préparer votre commande, le statut passe à 'Refusée'. Vous n'avez rien payé, votre commande est simplement annulée. Essayez un autre commerce." },
];

export function HelpCenterPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Centre d'aide</h1>
      <div className="space-y-2">
        {FAQ.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-sm font-semibold text-gray-900">{item.q}</span>
              {openIdx === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {openIdx === i && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
