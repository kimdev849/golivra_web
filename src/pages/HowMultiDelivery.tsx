import { Link } from "react-router-dom";
import { ArrowLeft, Package, Truck, MapPin, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: Package,
    title: "1. Choisissez vos articles",
    description: "Ajoutez des produits ou plats de différents commerces à votre panier.",
  },
  {
    icon: MapPin,
    title: "2. Définissez vos adresses",
    description: "Renseignez les adresses de livraison pour chaque commande.",
  },
  {
    icon: Truck,
    title: "3. Plusieurs livraisons",
    description: "Vos commandes sont regroupées par commerce et livrées par les meilleurs coursiers.",
  },
  {
    icon: CheckCircle,
    title: "4. Suivez en temps réel",
    description: "Chaque livraison est suivie individuellement du début à la fin.",
  },
];

export function HowMultiDelivery() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h1 className="text-xl font-bold text-gray-900">Comment fonctionne la multi-livraison ?</h1>

      <div className="space-y-4">
        {STEPS.map((step, i) => (
          <div key={i} className="bg-white rounded-xl border p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <step.icon className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/explore"
        className="block text-center py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition"
      >
        Commencer à commander
      </Link>
    </div>
  );
}
