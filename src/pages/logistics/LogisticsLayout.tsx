import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Truck, Users, AlertTriangle, BarChart3, Bell, Settings } from "lucide-react";
import { useAuthStore } from "../../store";
import { useEffect, useState, createContext, useContext } from "react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type LogisticsCompany = {
  id: string;
  nom: string;
  telephone?: string;
  statut?: string;
  nb_livreurs?: number;
  livreurs?: any[];
};

interface LogisticsCtx {
  company: LogisticsCompany | null;
  loading: boolean;
}

const LogisticsContext = createContext<LogisticsCtx>({ company: null, loading: true });

export function useLogisticsCtx() {
  return useContext(LogisticsContext);
}

function useLogisticsCompany() {
  const [company, setCompany] = useState<LogisticsCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const data = await apiFetch<any>("/api/logistics/company", { token });
        if (data?.id) setCompany(data);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  return { company, loading };
}

function LogisticsNotifBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const countQuery = useQuery({
    queryKey: ["logistics-notif-count"],
    queryFn: async () => {
      const token = getSessionToken();
      if (!token) return 0;
      const data = await apiFetch<{ unread_count?: number; count?: number }>(
        "/api/notifications/unread-count",
        { method: "GET", token }
      );
      return Number(data?.unread_count ?? data?.count ?? 0) || 0;
    },
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["logistics-notif-list"],
    queryFn: async () => {
      const token = getSessionToken();
      if (!token) return [];
      const data = await apiFetch<{ items?: any[]; unread_count?: number } | any[]>(
        "/api/notifications?limit=12",
        { method: "GET", token }
      );
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.items) ? data.items : [];
    },
    refetchInterval: 30_000,
    enabled: open,
  });

  const unread = countQuery.data ?? 0;
  const items = listQuery.data ?? [];

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void listQuery.refetch();
  };

  const markRead = async (id: string) => {
    const token = getSessionToken();
    if (!token) return;
    await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token, jsonBody: {} });
    await queryClient.invalidateQueries({ queryKey: ["logistics-notif-count"] });
    await queryClient.invalidateQueries({ queryKey: ["logistics-notif-list"] });
  };

  const markAll = async () => {
    const token = getSessionToken();
    if (!token) return;
    await apiFetch("/api/notifications/read-all", { method: "PATCH", token, jsonBody: {} });
    await queryClient.invalidateQueries({ queryKey: ["logistics-notif-count"] });
    await queryClient.invalidateQueries({ queryKey: ["logistics-notif-list"] });
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 hover:bg-white/10 rounded-full transition" aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-[400px] overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && (
                <button type="button" className="text-xs font-medium text-blue-600" onClick={() => void markAll()}>
                  Tout lire
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400">Aucune notification.</p>
            ) : (
              items.slice(0, 10).map((n: any) => (
                <div
                  key={n.id}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  onClick={() => { if (!n.est_lue) void markRead(n.id); }}
                >
                  <span className={`text-sm block ${n.est_lue ? "text-gray-500" : "font-bold text-gray-900"}`}>
                    {n.titre}
                  </span>
                  {n.corps && <span className="text-xs text-gray-500 line-clamp-2 block">{n.corps}</span>}
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const LOGISTICS_TABS = [
  { path: "/logistics", icon: Home, label: "Accueil", exact: true },
  { path: "/logistics/incidents", icon: AlertTriangle, label: "Incidents" },
  { path: "/logistics/notifications", icon: Bell, label: "Alertes" },
  { path: "/logistics/deliveries", icon: Truck, label: "Courses" },
  { path: "/logistics/couriers", icon: Users, label: "Livreurs" },
  { path: "/logistics/stats", icon: BarChart3, label: "Stats" },
];

export function LogisticsLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { company, loading } = useLogisticsCompany();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Chargement du centre opérationnel…</p>
        </div>
      </div>
    );
  }

  const isSubPage = !LOGISTICS_TABS.some((t) =>
    t.exact ? location.pathname === t.path : location.pathname.startsWith(t.path)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-900 text-white px-4 h-12 flex items-center justify-between shadow-sm">
        <Link to="/logistics" className="flex items-center gap-2">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-7 w-auto brightness-0 invert" />
          <span className="text-[11px] font-bold opacity-70 hidden sm:inline">Centre Opérationnel</span>
        </Link>
        <div className="flex items-center gap-2">
          {company && (
            <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full">
              {company.nom}
            </span>
          )}
          <LogisticsNotifBell />
          <Link to="/logistics/settings" className="p-2 hover:bg-white/10 rounded-full transition">
            <Settings size={18} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-4 pb-24 lg:pb-6">
        <LogisticsContext.Provider value={{ company, loading }}>
          <Outlet />
        </LogisticsContext.Provider>
      </main>

      {/* Bottom tabs (mobile) */}
      {!isSubPage && (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 z-50 bg-white safe-area-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {LOGISTICS_TABS.map((tab) => {
              const active = tab.exact
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center gap-0.5 w-full py-2 transition ${active ? "text-blue-600" : "text-gray-400"}`}
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
