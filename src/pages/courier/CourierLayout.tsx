import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Navigation, User, Bell, Menu, X } from "lucide-react";
import { useAuthStore } from "../../store";

const NAV = [
  { path: "/courier", icon: Home, label: "Accueil" },
  { path: "/courier/missions", icon: Navigation, label: "Missions" },
  { path: "/courier/notifications", icon: Bell, label: "Alertes" },
  { path: "/courier/profile", icon: User, label: "Profil" },
];

export function CourierLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile */}
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Link to="/courier" className="flex items-center gap-2">
            <img src="/assets/images/logo.png" alt="GoLivra" className="h-7 w-auto" />
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/courier" className="flex items-center gap-2">
            <img src="/assets/images/logo.png" alt="GoLivra" className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = location.pathname === n.path;
              return (
                <Link key={n.path} to={n.path} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${active ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {NAV.map((n) => {
            const active = location.pathname === n.path;
            return (
              <Link key={n.path} to={n.path} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${active ? "text-brand" : "text-gray-400"}`}>
                <n.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
