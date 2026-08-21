import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken } from "../lib/api";
import { Bell, ChevronLeft, Package, ShoppingBag, Truck, Wallet, BadgePercent } from "lucide-react";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "À l'instant";
    if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function iconFor(type: string) {
  if (type.startsWith("commande")) return Package;
  if (type.startsWith("paiement")) return Wallet;
  if (type.includes("livraison") || type.startsWith("retard")) return Truck;
  if (type.startsWith("promotion")) return BadgePercent;
  if (type.includes("commerce")) return ShoppingBag;
  return Bell;
}

function moneyType(type: string): boolean {
  return type.startsWith("paiement") || type.startsWith("promotion");
}

/** Navigate based on notification type and data — matches mobile notification-navigation.ts */
function navigateFromNotification(navigate: any, n: any) {
  const data = n.data || {};
  const type = n.type || "";

  // Order-related notifications → order tracking
  if (data.orderId || data.order_id) {
    const orderId = data.orderId || data.order_id;
    if (type.includes("livraison") && data.deliveryId) {
      navigate(`/delivery/${data.deliveryId}`);
    } else {
      navigate(`/orders/${orderId}`);
    }
    return;
  }

  // Delivery notifications
  if (data.deliveryId || data.delivery_id) {
    navigate(`/delivery/${data.deliveryId || data.delivery_id}`);
    return;
  }

  // Commerce/enterprise notifications → marketplace
  if (data.enterpriseId || data.enterprise_id) {
    navigate(`/marketplace/${data.enterpriseId || data.enterprise_id}`);
    return;
  }

  // Payment notifications → orders
  if (type.startsWith("paiement")) {
    navigate("/orders");
    return;
  }

  // Promotion → home with promo filter
  if (type.startsWith("promotion")) {
    navigate("/?filter=promo");
    return;
  }

  // Default: go to notifications themselves
  navigate("/notifications");
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getSessionToken();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications", { token: token! }),
    enabled: !!token,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const notifications = (data as any)?.items ?? (Array.isArray(data) ? data : []);
  const unreadCount = (data as any)?.unread_count ?? 0;

  // Mark single notification as read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token: token! });
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old?.items) return old;
        const wasUnread = old.items.find((n: any) => n.id === id && !n.est_lue);
        return {
          ...old,
          items: old.items.map((n: any) => (n.id === id ? { ...n, est_lue: true } : n)),
          unread_count: wasUnread ? Math.max(0, (old.unread_count ?? 1) - 1) : old.unread_count,
        };
      });
    },
  });

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/notifications/read-all", { method: "PATCH", token: token! });
    },
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.map((n: any) => ({ ...n, est_lue: true })), unread_count: 0 };
      });
    },
  });

  const handleOpen = (n: any) => {
    // Mark as read first
    if (!n.est_lue) markRead.mutate(n.id);
    // Then navigate
    navigateFromNotification(navigate, n);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 border-b border-line pb-3">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-brand-50 border border-line-strong flex items-center justify-center hover:bg-brand-100 transition">
          <ChevronLeft size={26} className="text-brand-deep" />
        </button>
        <h1 className="flex-1 text-lg font-extrabold text-brand-deep text-center">Notifications</h1>
        {unreadCount > 0 ? (
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="px-2 py-1.5">
            <span className="text-xs font-extrabold text-brand">Tout lire</span>
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      <p className="text-[13.5px] text-txt-secondary leading-relaxed mt-4 mb-3">
        Vos alertes commandes, paiements et livraisons GoLivra.
        {unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})` : ""}
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 p-3 bg-surface border border-line rounded-xl animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-16">
          <p className="text-sm text-error font-semibold mb-3">Impossible de charger les notifications.</p>
          <button onClick={() => refetch()} className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold">Réessayer</button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && notifications.length === 0 && (
        <div className="text-center py-16 border border-line rounded-2xl bg-surface">
          <div className="w-14 h-14 rounded-full bg-brand-50 border border-line-strong flex items-center justify-center mx-auto mb-3">
            <Bell size={28} className="text-brand" />
          </div>
          <h2 className="text-lg font-extrabold text-brand-deep">Aucune notification</h2>
          <p className="text-sm text-txt-muted mt-1 mb-4">Vous serez informé ici des événements importants sur vos commandes.</p>
          <Link to="/" className="inline-block bg-brand text-white px-6 py-3 rounded-xl text-sm font-bold">Parcourir le marketplace</Link>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && !error && notifications.length > 0 && (
        <div className="space-y-2.5">
          {notifications.map((n: any) => {
            const Icon = iconFor(n.type || "");
            const isMoney = moneyType(n.type || "");
            const unread = !n.est_lue;
            return (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition hover:shadow-sm ${
                  unread ? "bg-brand-50/50 border-brand-200" : "bg-surface border-line"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border flex-shrink-0 ${
                  isMoney ? "bg-accent/10 border-accent/20" : "bg-brand-50 border-brand-200"
                }`}>
                  <Icon size={18} className={isMoney ? "text-accent-deep" : "text-brand"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold leading-tight text-txt">{n.titre}</p>
                  {n.corps && <p className="text-[13px] text-txt-secondary mt-0.5 line-clamp-3">{n.corps}</p>}
                  <p className="text-[11.5px] text-txt-muted mt-1">{formatWhen(n.created_at)}</p>
                </div>
                {unread && <div className="w-2.5 h-2.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
