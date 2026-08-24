import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ = [
  { q: "Comment passer une commande ?", a: "Choisissez un commerce, ajoutez des produits au panier, puis validez en renseignant votre adresse de livraison. Vous recevrez une notification quand le commerce acceptera votre commande. Le délai de préparation est indiqué sur la fiche du commerce." },
  { q: "Comment payer ma commande ?", a: "Le paiement se fait uniquement par Mobile Money : Airtel Money ou MTN MoMo. Après acceptation du commerce, vous recevrez une demande de paiement sur votre téléphone. Aucun paiement en espèces n'est accepté. Le débit a lieu au moment de la validation." },
  { q: "Combien coûte la livraison ?", a: "Les frais de livraison dépendent de votre zone (arrondissement). Le montant exact est calculé automatiquement selon votre adresse de livraison et affiché avant la validation de la commande. Le tarif de base est de 500 FCFA." },
  { q: "Quel est le délai de livraison ?", a: "Le délai total dépend du temps de préparation du commerce (10 à 30 min) et de la distance de livraison. Une estimation est affichée sur la fiche du commerce et dans votre panier avant validation." },
  { q: "Puis-je annuler ma commande ?", a: "Oui, tant que le commerce ne l'a pas acceptée. Après acceptation, vous pouvez demander une annulation mais le remboursement dépend du statut de la commande. Contactez le support si besoin." },
  { q: "Comment suivre ma livraison ?", a: "Dans l'onglet Commandes, ouvrez votre commande active. Vous verrez le statut en temps réel : préparation, livreur assigné, en route, livrée. Vous pouvez contacter le livreur directement depuis l'application." },
  { q: "Comment modifier mon adresse ?", a: "Allez dans Profil > Mes adresses. Vous pouvez ajouter, modifier ou supprimer des adresses. Sélectionnez l'adresse principale pour vos commandes." },
  { q: "Le commerce a refusé ma commande, que faire ?", a: "Si un commerce ne peut pas préparer votre commande, le statut passe à 'Refusée'. Vous n'avez rien payé, votre commande est simplement annulée. Essayez un autre commerce ou réessayez plus tard." },
  { q: "Comment contacter le support ?", a: "Envoyez un email à support@golivra.cg. Notre équipe vous répondra dans les meilleurs délais. Pour les urgences,utilisez le chat dans l'application." },
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
