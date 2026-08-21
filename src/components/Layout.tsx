import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, ClipboardList, User, Heart, Bell } from "lucide-react";
import { useAuthStore, useCartStore } from "../store";

const NAV_CLIENT = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/explore", icon: Search, label: "Explorer" },
  { path: "/cart", icon: ShoppingCart, label: "Panier" },
  { path: "/orders", icon: ClipboardList, label: "Commandes" },
  { path: "/profile", icon: User, label: "Profil" },
];

/** Desktop nav — no Profil item (avatar/profile button already in the top-right). */
const NAV_DESKTOP = NAV_CLIENT.filter((n) => n.path !== "/profile");

export function Layout() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);

  // Pages that should show NO layout (fullscreen pages)
  const noLayout = ["/how-multi-delivery", "/explore/all"];
  // Pages that hide the MOBILE header/bottom-nav (but desktop header still shows)
  const noMobileHeader = ["/profile", "/settings", "/addresses", "/favorites"].some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
  // Pages that hide BOTH desktop + mobile (fullscreen only)
  const noDesktopHeader = noLayout.includes(location.pathname);
  if (noLayout.includes(location.pathname)) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* ── Header desktop — always shown except fullscreen ── */}
      {!noDesktopHeader && (
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-line shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/images/logo.png" alt="GoLivra" className="h-8 w-auto" />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_DESKTOP.map((n) => {
              const active = location.pathname === n.path || (n.path !== "/" && location.pathname.startsWith(n.path));
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active ? "bg-brand text-white" : "text-txt-muted hover:bg-brand-50 hover:text-brand"
                  }`}
                >
                  <n.icon className="w-3.5 h-3.5" />
                  {n.label}
                  {n.path === "/cart" && itemCount > 0 && (
                    <span className="ml-0.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link to="/notifications" className="p-2 rounded-lg text-txt-muted hover:bg-brand-50 hover:text-brand transition relative">
                <Bell className="w-4 h-4" />
              </Link>
            )}
            {isAuthenticated && user ? (
              <Link to="/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 transition" title="Mon profil">
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                  {user.nom?.[0] || "U"}
                </div>
                <span className="text-xs font-semibold text-brand">{user.nom}</span>
              </Link>
            ) : !isAuthenticated ? (
              <Link to="/auth" className="px-3 py-1.5 bg-brand text-white rounded-full text-xs font-bold hover:bg-brand-700 transition">
                Connexion
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      )}

      {/* ── Mobile header — hidden on profile/settings/etc ── */}
      {!noMobileHeader && (
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-line px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-7 w-auto" />
        </Link>
        {/* Bell + Heart only on Home/Explore/Marketplace — NOT on profile, settings, etc. */}
        {isAuthenticated && (location.pathname === "/" || location.pathname === "/explore" || location.pathname.startsWith("/marketplace") || location.pathname.startsWith("/product")) && (
          <div className="flex items-center gap-1">
            <Link to="/notifications" className="p-2 text-txt-muted hover:text-brand transition">
              <Bell className="w-4 h-4" />
            </Link>
            <Link to="/favorites" className="p-2 text-txt-muted hover:text-brand transition">
              <Heart className="w-4 h-4" />
            </Link>
          </div>
        )}
      </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24 lg:pb-6">
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ──────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line lg:hidden z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {NAV_CLIENT.map((n) => {
            const active = location.pathname === n.path || (n.path !== "/" && location.pathname.startsWith(n.path));
            return (
              <Link
                key={n.path}
                to={n.path}
                className={`flex flex-col items-center gap-0.5 w-full py-2 transition ${active ? "text-brand" : "text-txt-muted"}`}
              >
                <div className="relative">
                  <n.icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                  {n.path === "/cart" && itemCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-accent text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
