import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Store, ShoppingBag, ChevronLeft } from "lucide-react";
import { getFavoriteEnterpriseIds, getFavoriteProducts, toggleFavoriteEnterpriseId, toggleFavoriteProduct } from "../lib/favorites";
import { fetchFavorites, fetchFavoriteProducts } from "../lib/favorites-api";
import { getSessionToken, apiFetch } from "../lib/api";
import { resolveEnterpriseImage, resolveImageUrl } from "../lib/images";
import { toast } from "sonner";

function formatFcfa(n: number | string) { return `${Number(n).toLocaleString("fr-FR")} FCFA`; }

export function FavoritesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"enterprises" | "products">("enterprises");
  const [enterpriseIds, setEnterpriseIds] = useState<string[]>([]);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [productRefs, setProductRefs] = useState<{ produit_id: string; produit_kind: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const token = getSessionToken();
    if (!token) {
      setEnterpriseIds(getFavoriteEnterpriseIds());
      setProductRefs(getFavoriteProducts());
      setLoading(false);
      return;
    }

    try {
      const [favResult, favProdsResult] = await Promise.allSettled([
        fetchFavorites(token),
        fetchFavoriteProducts(token),
      ]);

      let favIds: string[] = [];
      if (favResult.status === "fulfilled") {
        favIds = favResult.value.enterprise_ids ?? [];
        setEnterpriseIds(favIds);
      } else {
        favIds = getFavoriteEnterpriseIds();
        setEnterpriseIds(favIds);
      }

      let prodRefs: { produit_id: string; produit_kind: string }[] = [];
      if (favProdsResult.status === "fulfilled") {
        prodRefs = (favProdsResult.value.items ?? []) as any[];
        setProductRefs(prodRefs);
      } else {
        prodRefs = getFavoriteProducts();
        setProductRefs(prodRefs);
      }

      // Fetch enterprise details
      if (favIds.length > 0) {
        try {
          const data = await apiFetch(`/api/enterprises/batch?ids=${favIds.join(",")}`);
          setEnterprises(Array.isArray(data) ? data : []);
        } catch { /* try individual fetches */ 
          const details = await Promise.allSettled(
            favIds.map((id) => apiFetch(`/api/enterprises/${id}`))
          );
          setEnterprises(details.filter((r) => r.status === "fulfilled").map((r) => (r as any).value));
        }
      }

      // Fetch product details — try /api/products/batch first, then feed fallback
      if (prodRefs.length > 0) {
        const ids = prodRefs.map((p) => p.produit_id);
        try {
          const data = await apiFetch(`/api/products/batch?ids=${ids.join(",")}`);
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          } else {
            throw new Error("empty");
          }
        } catch {
          // Fallback: fetch from feed and filter
          try {
            const feedData: any = await apiFetch("/api/products/feed?limit=200");
            const feed = Array.isArray(feedData) ? feedData : feedData?.items ?? [];
            const idSet = new Set(ids);
            const matched = feed.filter((p: any) => idSet.has(p.id));
            setProducts(matched);
          } catch {
            setProducts([]);
          }
        }
      }
    } catch {
      setEnterpriseIds(getFavoriteEnterpriseIds());
      setProductRefs(getFavoriteProducts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleEnt = async (id: string) => {
    const fav = await toggleFavoriteEnterpriseId(id);
    setEnterpriseIds((prev) => fav ? [...prev, id] : prev.filter((x) => x !== id));
    setEnterprises((prev) => fav ? prev : prev.filter((e) => e.id !== id));
    toast.success(fav ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  const toggleProd = async (id: string, kind: "plat" | "article") => {
    const fav = await toggleFavoriteProduct(id, kind);
    setProductRefs((prev) => fav ? [...prev, { produit_id: id, produit_kind: kind }] : prev.filter((p) => p.produit_id !== id));
    setProducts((prev) => fav ? prev : prev.filter((p) => p.id !== id));
    toast.success(fav ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-10 bg-gray-200 rounded-full w-32" />
          <div className="h-10 bg-gray-200 rounded-full w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ background: "var(--bg)", color: "var(--txt)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full border flex items-center justify-center transition" style={{ background: "var(--brand-50)", borderColor: "var(--border)" }}>
          <ChevronLeft size={26} style={{ color: "var(--brand-deep)" }} />
        </button>
        <h1 className="flex-1 text-lg font-extrabold text-center" style={{ color: "var(--txt)" }}>Mes favoris</h1>
        <div className="w-11" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["enterprises", "products"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition"
            style={{
              background: tab === t ? "var(--brand)" : "var(--surface-muted)",
              color: tab === t ? "#FFFFFF" : "var(--txt-muted)",
            }}
          >
            {t === "enterprises" ? `Commerces (${enterpriseIds.length})` : `Produits (${productRefs.length})`}
          </button>
        ))}
      </div>

      {/* Enterprises tab */}
      {tab === "enterprises" && (
        enterpriseIds.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--txt-muted)", opacity: 0.3 }} />
            <p className="font-semibold" style={{ color: "var(--txt)" }}>Aucun commerce favori</p>
            <p className="text-sm mt-1" style={{ color: "var(--txt-muted)" }}>Ajoutez des commerces depuis leur page.</p>
          </div>
        ) : enterprises.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--txt-muted)" }}>Chargement des commerces…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enterprises.map((e: any) => (
              <div key={e.id} className="rounded-xl border overflow-hidden flex" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <Link to={`/marketplace/${e.id}`} className="w-24 h-24 flex-shrink-0" style={{ background: "var(--surface-muted)" }}>
                  {resolveEnterpriseImage(e) ? (
                    <img src={resolveEnterpriseImage(e)!} alt={e.nom ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--txt-muted)", opacity: 0.3 }}><Store className="w-6 h-6" /></div>
                  )}
                </Link>
                <div className="p-3 flex-1 min-w-0">
                  <Link to={`/marketplace/${e.id}`} className="text-sm font-semibold truncate block hover:underline" style={{ color: "var(--txt)" }}>{e.nom}</Link>
                  {e.categorie_nom && <p className="text-xs mt-0.5" style={{ color: "var(--txt-muted)" }}>{e.categorie_nom}</p>}
                  <button onClick={() => toggleEnt(e.id)} className="text-xs mt-1 hover:underline" style={{ color: "var(--error)" }}>Retirer</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Products tab */}
      {tab === "products" && (
        productRefs.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--txt-muted)", opacity: 0.3 }} />
            <p className="font-semibold" style={{ color: "var(--txt)" }}>Aucun produit favori</p>
            <p className="text-sm mt-1" style={{ color: "var(--txt-muted)" }}>Ajoutez des produits depuis leur page.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "var(--txt-muted)" }}>Chargement des produits…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p: any) => (
              <div key={p.id} className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <Link to={`/product/${p.id}`} className="aspect-square block" style={{ background: "var(--surface-muted)" }}>
                  {resolveImageUrl(p) ? (
                    <img src={resolveImageUrl(p)!} alt={p.nom ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--txt-muted)", opacity: 0.3 }}><ShoppingBag className="w-8 h-8" /></div>
                  )}
                </Link>
                <div className="p-3">
                  <Link to={`/product/${p.id}`} className="text-sm font-semibold truncate block hover:underline" style={{ color: "var(--txt)" }}>{p.nom}</Link>
                  <span className="text-sm font-bold" style={{ color: "var(--brand)" }}>{formatFcfa(p.prix)}</span>
                  <button onClick={() => toggleProd(p.id, (p.kind as "plat") || "plat")} className="block text-xs mt-1 hover:underline" style={{ color: "var(--error)" }}>Retirer</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
