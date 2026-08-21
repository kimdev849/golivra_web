import { Package } from "lucide-react";
export function OrderDeliveriesSummaryPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Résumé des livraisons</h1>
      <div className="text-center py-16 text-gray-500">
        <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="font-semibold">Sélectionnez une commande pour voir les détails de livraison.</p>
      </div>
    </div>
  );
}
