import { Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Trash2 } from "lucide-react";
import { useAuthStore } from "../../store";
import { toast } from "sonner";

export function CourierAccountSettings() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-4">
      <Link to="/courier/profile" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h2 className="text-lg font-bold text-gray-900">Compte</h2>

      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-5 h-5 text-brand" />
            <span className="text-sm font-semibold text-gray-900">Nom</span>
          </div>
          <input
            type="text"
            defaultValue={user?.nom}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-5 h-5 text-brand" />
            <span className="text-sm font-semibold text-gray-900">Téléphone</span>
          </div>
          <input
            type="tel"
            defaultValue={user?.telephone}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Contactez le support pour changer de numéro</p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold text-red-600">Zone dangereuse</span>
          </div>
          <button
            onClick={() => toast.error("Contactez le support pour supprimer votre compte")}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
