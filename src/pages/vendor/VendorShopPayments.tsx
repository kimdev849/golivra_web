import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { CreditCard, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  numero: string;
  principale: boolean;
}

export function VendorShopPayments() {
  const queryClient = useQueryClient();
  const { data: methods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["vendor-payments"],
    queryFn: () => apiFetch("/api/enterprises/mine"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Moyens de paiement</h2>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand/90 transition">
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun moyen de paiement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{m.provider}</p>
                    <p className="text-xs text-gray-500">{m.numero}</p>
                  </div>
                </div>
                {m.principale && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand bg-brand/10 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Principal
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
