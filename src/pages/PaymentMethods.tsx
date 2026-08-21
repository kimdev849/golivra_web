import { Smartphone, CreditCard } from "lucide-react";

export function PaymentMethodsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Moyens de paiement</h1>
      <div className="space-y-3">
        {[
          { icon: Smartphone, label: "Airtel Money", desc: "Paiement via Airtel Money" },
          { icon: Smartphone, label: "MTN MoMo", desc: "Paiement via MTN Mobile Money" },
          { icon: CreditCard, label: "Paiement à la livraison", desc: "Payer en espèces au livreur" },
        ].map((method, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center"><method.icon className="w-5 h-5 text-brand" /></div>
            <div><p className="text-sm font-semibold text-gray-900">{method.label}</p><p className="text-xs text-gray-500">{method.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
