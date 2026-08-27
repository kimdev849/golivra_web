import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, UtensilsCrossed, Truck, LayoutGrid, Bell } from "lucide-react";
import { useAuthStore } from "../../store";
import { useEffect, useState, createContext, useContext } from "react";
import { apiFetch, getSessionToken } from "../../lib/api";

/* ── Vendor theme palette ── */
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

/* ── Fetch vendor data using CORRECT API endpoints (matching mobile) ── */
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
        // 1. Verify role via /api/auth/me
        const me = await apiFetch<any>("/api/auth/me", { token });
        if (me?.role !== "restaurateur" && me?.role !== "commercant") {
          navigate("/", { replace: true });
          return;
        }

        // 2. Fetch vendor shop via /api/enterprises/mine (like mobile enterprise.ts:93)
        const shopsData = await apiFetch<any[]>("/api/enterprises/mine", { method: "GET", token }).catch(() => []);
        const shopList = Array.isArray(shopsData) ? shopsData : [];
        if (shopList.length > 0) {
          const s = shopList[0];
          setShop({
            id: s.id,
            nom: s.nom,
            type: s.type,
            statut_moderation: s.statut_moderation,
            moderation_status: s.moderation_status,
            // Only online if shop is verified AND marked as open
            enLigne: (s.statut_moderation === "active" || s.moderation_status === "verified") && (s.ouvert ?? s.enLigne ?? false),
            avatar: s.image_url,
          });

          // 3. Fetch orders via /api/orders/vendor/mine (like mobile vendor-api.ts:180)
          const o = await apiFetch<any[]>("/api/orders/vendor/mine", { method: "GET", token }).catch(() => []);
          setOrders(Array.isArray(o) ? o : []);

          // 4. Fetch products via /api/products/enterprise/{id} (like mobile vendor-api.ts:99)
          const p = await apiFetch<any[]>(`/api/products/enterprise/${s.id}`, { method: "GET", token }).catch(() => []);
          setProducts(Array.isArray(p) ? p : []);
        } else {
          // No shop found — still let them in, dashboard will show empty state
          setShop(null);
        }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-muted)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--txt-muted)" }}>Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  const isSubPage = location.pathname !== "/vendor" &&
    !VENDOR_TABS.some(t => t.exact ? location.pathname === t.path : location.pathname.startsWith(t.path));

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-muted)" }}>
      {/* ── Green header bar ── */}
      <header className="sticky top-0 z-50 text-white px-4 h-12 flex items-center justify-between shadow-sm" style={{ background: "var(--brand)" }}>
        <Link to="/vendor" className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-7 w-auto brightness-0 invert" />
        </Link>
        <div className="flex items-center gap-2">
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
      <main className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-4 pb-24 lg:pb-6">
        <VendorContext.Provider value={{ shop, orders, setOrders, products, setProducts }}>
          <Outlet />
        </VendorContext.Provider>
      </main>

      {/* ── Bottom tabs (mobile only) ── */}
      {!isSubPage && (
        <nav className="fixed bottom-0 left-0 right-0 border-t z-50 safe-area-bottom" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
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
