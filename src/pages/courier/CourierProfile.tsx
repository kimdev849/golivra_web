import { useAuthStore } from "../../store";
import { Link } from "react-router-dom";
import { User, Settings, Bell, HelpCircle, LogOut, ChevronRight, Edit, Shield, Truck } from "lucide-react";

export function CourierProfile() {
  const { user, logout } = useAuthStore();

  const MENU = [
    { path: "/courier/profile/edit", icon: Edit, label: "Modifier le profil" },
    { path: "/courier/settings", icon: Settings, label: "Paramètres" },
    { path: "/courier/notifications", icon: Bell, label: "Notifications" },
    { path: "/courier/help-center", icon: HelpCircle, label: "Centre d'aide" },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-xl border p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <Truck className="w-8 h-8 text-brand" />
          )}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{user?.prenom} {user?.nom}</h2>
        <p className="text-sm text-gray-500">{user?.telephone}</p>
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand bg-brand/10 px-3 py-1 rounded-full">
          <Truck className="w-3 h-3" /> Coursier
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {MENU.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 bg-white rounded-xl border p-4 hover:shadow-md transition"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900 flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); window.location.href = "/"; }}
        className="flex items-center gap-3 w-full bg-white rounded-xl border p-4 hover:bg-red-50 transition text-red-600"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold">Se déconnecter</span>
      </button>
    </div>
  );
}
