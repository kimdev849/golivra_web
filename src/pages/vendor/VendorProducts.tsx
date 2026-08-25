import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package, Plus, Search, Star, X, AlertCircle, UtensilsCrossed,
} from "lucide-react";
import { apiFetch, getSessionToken } from "../../lib/api";
import { useVendorCtx } from "./VendorLayout";

type ProductTab = "all" | "on" | "off";

function formatFcfa(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

function stockLabel(p: any, commerceType: string) {
  if (commerceType === "restaurant") {
    return p.est_disponible || p.enLigne
      ? { label: "En carte", color: "text-brand", dot: true }
      : { label: "Indisponible", color: "text-txt-muted", dot: false };
  }
  if (p.stock_illimite) return { label: "Stock illimité", color: "text-txt-muted", dot: false };
  const stock = Number(p.stock ?? 0);
  if (stock <= 0) return { label: "Rupture de stock", color: "text-red-500", dot: false };
  if (stock <= 5) return { label: `Stock faible · ${stock}`, color: "text-amber-600", dot: false };
  return { label: `${stock} en stock`, color: "text-txt-muted", dot: false };
}

function promoPercent(p: any): number | null {
  const base = Number(p.prix);
  const promo = Number(p.prix_promo);
  if (!base || !promo || promo <= 0 || promo >= base) return null;
  return Math.round(((base - promo) / base) * 100);
}

function productThumb(p: any): string | null {
  if (p.image_url) return p.image_url;
  if (p.images_urls?.length > 0) return p.images_urls[0];
  if (p.imageUrl) return p.imageUrl;
  if (p.imagesUrls?.length > 0) return p.imagesUrls[0];
  return null;
}

export function VendorProducts() {
  const { shop, products, setProducts } = useVendorCtx();
  const [tab, setTab] = useState<ProductTab>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const commerceType = shop?.type === "restaurant" ? "restaurant" : "boutique";
  const itemLabel = commerceType === "restaurant" ? "plat" : "produit";

  // Fetch products
  useEffect(() => {
    const fetch = async () => {
      const token = getSessionToken();
      if (!token) return;
      try {
        const p = await apiFetch<any[]>(shop?.id ? `/api/products/enterprise/${shop.id}` : "/api/products/enterprise/", { token });
        if (Array.isArray(p)) setProducts(p);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [setProducts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? products.filter((p: any) => (p.nom || "").toLowerCase().includes(q)) : products;
    if (tab === "on") return base.filter((p: any) => p.est_disponible || p.enLigne);
    if (tab === "off") return base.filter((p: any) => !(p.est_disponible || p.enLigne));
    return base;
  }, [products, tab, query]);

  const counts = useMemo(() => ({
    all: products.length,
    on: products.filter((p: any) => p.est_disponible || p.enLigne).length,
    off: products.filter((p: any) => !(p.est_disponible || p.enLigne)).length,
  }), [products]);

  const toggleOnline = async (id: string, value: boolean) => {
    if (!shop?.id) return;
    const prev = products;
    setProducts((p: any[]) => p.map((x) => (x.id === id ? { ...x, est_disponible: value, enLigne: value } : x)));
    setBusyId(id);
    try {
      const token = getSessionToken();
      if (!token) throw new Error("Session expirée");
      await apiFetch(`/api/products/enterprise/0/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ estDisponible: value }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      setProducts(prev);
    } finally { setBusyId(null); }
  };

  const doDelete = async () => {
    if (!confirmDelete || !shop?.id) return;
    const { id } = confirmDelete;
    const prev = products;
    setProducts((p: any[]) => p.filter((x: any) => x.id !== id));
    setConfirmDelete(null);
    setBusyId(id);
    try {
      const token = getSessionToken();
      if (!token) throw new Error("Session expirée");
      await apiFetch(`/api/products/enterprise/0/${id}`, { method: "DELETE", token });
    } catch {
      setProducts(prev);
    } finally { setBusyId(null); }
  };

  const pills: { key: ProductTab; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: counts.all },
    { key: "on", label: commerceType === "restaurant" ? "En carte" : "En ligne", count: counts.on },
    { key: "off", label: "Hors ligne", count: counts.off },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-txt">
          {commerceType === "restaurant" ? "MENU" : "PRODUITS"}
        </h1>
        <Link
          to="/vendor/add-product"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition"
        >
          <Plus size={16} /> Ajouter
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
        <input
          type="text"
          placeholder={`Rechercher un ${itemLabel}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-8 py-2.5 bg-surface-muted border border-line rounded-xl text-sm text-txt focus:border-brand transition"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Tab pills ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {pills.map((p) => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition border ${
              tab === p.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-txt-muted border-line hover:border-brand/30"
            }`}
          >
            {p.label} ({p.count})
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Product list ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((p: any) => {
            const thumb = productThumb(p);
            const st = stockLabel(p, commerceType);
            const promo = promoPercent(p);
            const price = Number(p.prix_promo || p.prix || 0);
            const isOn = p.est_disponible || p.enLigne;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-white border border-line rounded-xl hover:shadow-md transition">
                {/* Thumbnail */}
                <Link to={`/vendor/edit-product/${p.id}`} className="w-16 h-16 rounded-xl overflow-hidden bg-surface-muted flex-shrink-0">
                  {thumb ? (
                    <img src={thumb} alt={p.nom} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {commerceType === "restaurant"
                        ? <UtensilsCrossed size={20} className="text-txt-muted/30" />
                        : <Package size={20} className="text-txt-muted/30" />}
                    </div>
                  )}
                </Link>

                {/* Info */}
                <Link to={`/vendor/edit-product/${p.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-txt truncate">{p.nom}</p>
                    {promo && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded">
                        -{promo}%
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${st.color}`}>
                    {st.dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1" />}
                    {st.label}
                  </p>
                  <p className="text-sm font-bold text-brand mt-0.5">{formatFcfa(price)}</p>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle online/offline */}
                  <button
                    disabled={busyId === p.id}
                    onClick={() => toggleOnline(p.id, !isOn)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? "bg-brand" : "bg-gray-300"} ${busyId === p.id ? "opacity-50" : ""}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOn ? "left-[22px]" : "left-0.5"}`} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDelete({ id: p.id, name: p.nom })}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-brand/40" />
          </div>
          <p className="text-sm font-bold text-txt-muted">
            {query ? `Aucun ${itemLabel} trouvé` : "Aucun produit"}
          </p>
          <p className="text-xs text-txt-muted mt-1">
            {query ? "Essayez une autre recherche" : `Ajoutez votre premier ${itemLabel}`}
          </p>
          {!query && (
            <Link to="/vendor/add-product" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition">
              <Plus size={16} /> Ajouter
            </Link>
          )}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-extrabold text-txt text-center">Supprimer ?</h3>
            <p className="text-sm text-txt-muted text-center mt-2">
              Supprimer définitivement « {confirmDelete.name} » ?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 border border-line rounded-xl text-sm font-bold text-txt hover:bg-surface-muted transition"
              >
                Annuler
              </button>
              <button
                onClick={doDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
