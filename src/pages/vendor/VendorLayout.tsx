import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, UtensilsCrossed, Package, Truck, LayoutGrid, Bell } from "lucide-react";
import { useAuthStore } from "../../store";
import { useEffect, useState } from "react";
import { apiFetch, getSessionToken } from "../../lib/api";

/* ── Vendor theme palette (green for restaurants, teal for boutiques) ── */
const BRAND = "#4CAF50";

type VendorShop = {
  id: string;
  nom: string;
  type?: string;
  statut_moderation?: string;
  moderation_status?: string;
  enLigne?: boolean;
  avatar?: string;
};

function useVendorShop() {
  const navigate = useNavigate();
  const [shop, setShop] = useState<VendorShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const verify = async () => {
      const token = getSessionToken();
      if (!token) { navigate("/auth", { replace: true }); return; }
      try {
        const me = await apiFetch<any>("/api/auth/me", { token });
        if (me?.role !== "restaurateur" && me?.role !== "commercant") {
          navigate("/", { replace: true });
          return;
        }
        const shops = await apiFetch<any[]>("/api/vendor/shops", { token });
        if (Array.isArray(shops) && shops.length > 0) {
          setShop(shops[0]);
        }
        // Load orders + products for dashboard
        const [o, p] = await Promise.all([
          apiFetch<any[]>("/api/vendor/orders", { token }).catch(() => []),
          apiFetch<any[]>("/api/vendor/products", { token }).catch(() => []),
        ]);
        setOrders(Array.isArray(o) ? o : []);
        setProducts(Array.isArray(p) ? p : []);
      } catch {
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [navigate]);

  return { shop, orders, setOrders, products, setProducts, loading };
}

/* ── Exported context hook for child pages ── */
export function useVendorContext() {
  // This is a simple approach — children read from a React context or prop drilling.
  // For now, child pages fetch their own data independently.
  return {};
}

const VENDOR_TABS = [
  { path: "/vendor", icon: Home, label: "Accueil", exact: true },
  { path: "/vendor/orders", icon: ClipboardList, label: "Commandes" },
  { path: "/vendor/products", icon: UtensilsCrossed, label: "Menu" },
  { path: "/vendor/deliveries", icon: Truck, label: "Livraisons" },
  { path: "/vendor/more", icon: LayoutGrid, label: "Plus" },
];

export function VendorLayout() {
  const location = useLocation();
  const { shop, orders, setOrders, products, setProducts, loading } = useVendorShop();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-txt-muted">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  const isSubPage = location.pathname !== "/vendor" &&
    !VENDOR_TABS.some(t => t.exact ? location.pathname === t.path : location.pathname.startsWith(t.path));

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* ── Green header bar ── */}
      <header className="sticky top-0 z-50 bg-brand text-white px-4 h-12 flex items-center justify-between shadow-sm">
        <Link to="/vendor" className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-7 w-auto brightness-0 invert" />
        </Link>
        <div className="flex items-center gap-2">
          {/* Online/offline pill */}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${shop?.enLigne ? "bg-white/20" : "bg-white/10"}`}>
            <span className={`w-2 h-2 rounded-full ${shop?.enLigne ? "bg-green-300 animate-pulse" : "bg-white/40"}`} />
            {shop?.enLigne ? "En ligne" : "Hors ligne"}
          </span>
          <Link to="/vendor/notifications" className="p-2 hover:bg-white/10 rounded-full transition">
            <Bell size={18} />
          </Link>
        </div>
      </header>

      {/* ── Moderation banner ── */}
      {shop && (shop.statut_moderation === "en_attente" || shop.moderation_status === "pending") && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <p className="text-xs font-extrabold text-amber-700">⏳ Compte en attente</p>
          <p className="text-[11px] text-amber-600">Votre commerce n'est pas encore visible. L'équipe GoLivra vérifie votre inscription.</p>
        </div>
      )}

      {/* ── Content with vendor shop context ── */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24 lg:pb-6">
        <VendorContext.Provider value={{ shop, orders, setOrders, products, setProducts }}>
          <Outlet />
        </VendorContext.Provider>
      </main>

      {/* ── Bottom tabs (mobile only) ── */}
      {!isSubPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line z-50 safe-area-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {VENDOR_TABS.map((tab) => {
              const active = tab.exact
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center gap-0.5 w-full py-2 transition ${active ? "text-brand" : "text-txt-muted"}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/* ── React Context for vendor data ── */
import { createContext, useContext } from "react";

interface VendorCtx {
  shop: VendorShop | null;
  orders: any[];
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
}

const VendorContext = createContext<VendorCtx>({
  shop: null,
  orders: [],
  setOrders: () => {},
  products: [],
  setProducts: () => {},
});

export function useVendorCtx() {
  return useContext(VendorContext);
}
