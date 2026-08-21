import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail, BookOpen } from "lucide-react";

const FAQ = [
  {
    q: "Comment accepter une commande ?",
    a: "Allez dans l'onglet Commandes, trouvez la commande en attente et cliquez sur Accepter.",
  },
  {
    q: "Comment modifier mes horaires ?",
    a: "Dans Espace vendeur → Plus → Horaires d'ouverture, vous pouvez modifier vos plages horaires.",
  },
  {
    q: "Comment ajouter un produit ?",
    a: "Dans Catalogue, cliquez sur Ajouter un produit, remplissez le formulaire et sauvegardez.",
  },
  {
    q: "Comment consulter mes gains ?",
    a: "Allez dans Portefeuille pour voir votre solde et l'historique de vos transactions.",
  },
  {
    q: "Comment gérer mon stock ?",
    a: "Dans Plus → Stock, vous pouvez modifier la quantité disponible pour chaque produit.",
  },
];

export function VendorHelpCenter() {
  return (
    <div className="space-y-4">
      <Link to="/vendor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h2 className="text-lg font-bold text-gray-900">Centre d'aide</h2>

      {/* Contact */}
      <div className="bg-brand/5 rounded-xl border border-brand/20 p-4">
        <p className="text-sm font-bold text-brand mb-2">Besoin d'aide ?</p>
        <div className="space-y-2">
          <a href="tel:+22500000000" className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand transition">
            <Phone className="w-4 h-4" /> Appelez-nous
          </a>
          <a href="mailto:support@golivra.com" className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand transition">
            <Mail className="w-4 h-4" /> support@golivra.com
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" /> Questions fréquentes
        </h3>
        {FAQ.map((item, i) => (
          <details key={i} className="bg-white rounded-xl border p-4 group">
            <summary className="text-sm font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
              {item.q}
              <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
            </summary>
            <p className="text-sm text-gray-600 mt-2">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
