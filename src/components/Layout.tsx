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
    <div className="min-h-screen bg-surface-muted" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* ── Header desktop — always shown except fullscreen ── */}
      {!noDesktopHeader && (
      <header className="hidden lg:block sticky top-0 z-50 border-b shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-full max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/assets/images/logo.png" alt="GoLivra" className="h-10 w-auto" />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_DESKTOP.map((n) => {
              const active = location.pathname === n.path || (n.path !== "/" && location.pathname.startsWith(n.path));
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    active ? "text-white" : "hover:text-brand"
                  }`}
                  style={active ? { background: 'var(--brand)' } : { color: 'var(--txt-muted)' }}
                >
                  <n.icon className="w-4 h-4" />
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

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/notifications" className="p-2 rounded-xl transition relative" style={{ color: 'var(--txt-muted)' }}>
                <Bell className="w-5 h-5" />
              </Link>
            )}
            {isAuthenticated && user ? (
              <Link to="/profile" className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full transition" style={{ background: 'var(--brand-50)' }} title="Mon profil">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--brand)' }}>
                  {user.nom?.[0] || "U"}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{user.nom}</span>
              </Link>
            ) : !isAuthenticated ? (
              <Link to="/auth" className="px-4 py-2 rounded-full text-sm font-bold transition" style={{ background: 'var(--brand)', color: '#fff' }}>
                Connexion
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      )}

      {/* ── Mobile header — hidden on profile/settings/etc ── */}
      {!noMobileHeader && (
      <header className="lg:hidden sticky top-0 z-50 border-b px-4 h-12 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
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

      <main style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '16px', paddingBottom: '24px', overflowX: 'hidden' }}>
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ──────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 border-t lg:hidden z-50 safe-area-bottom" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
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
