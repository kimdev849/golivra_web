import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Shield, Globe, Moon, HelpCircle } from "lucide-react";
import { useState } from "react";

export function CourierSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("fr");

  return (
    <div className="space-y-4">
      <Link to="/courier/profile" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h2 className="text-lg font-bold text-gray-900">Paramètres</h2>

      <div className="space-y-3">
        {/* Notifications */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-brand" />
              <span className="text-sm font-semibold text-gray-900">Notifications push</span>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition ${notificationsEnabled ? "bg-brand" : "bg-gray-300"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-brand" />
            <span className="text-sm font-semibold text-gray-900">Langue</span>
          </div>
          <div className="flex gap-2 mt-3">
            {["fr", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${language === l ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {l === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white rounded-xl border p-4">
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand transition">
              <Shield className="w-5 h-5 text-gray-400" /> Politique de confidentialité
            </a>
            <a href="#" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand transition">
              <HelpCircle className="w-5 h-5 text-gray-400" /> Conditions d'utilisation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
