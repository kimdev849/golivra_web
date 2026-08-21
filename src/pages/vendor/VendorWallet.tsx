import { useState, useEffect } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";

function formatFcfa(n: number) { return `${n.toLocaleString("fr-FR")} FCFA`; }

export function VendorWallet() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<{ solde: number }>("/api/wallet/balance", { token })
      .then((data) => setBalance(data?.solde ?? 0))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-600 to-brand rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-2"><WalletIcon className="w-6 h-6" /><p className="text-sm font-medium text-white/80">Solde disponible</p></div>
        <p className="text-3xl font-black">{formatFcfa(balance)}</p>
      </div>
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Les gains de vos commandes apparaîtront ici.</p>
      </div>
    </div>
  );
}
