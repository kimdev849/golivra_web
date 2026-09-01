import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { Link, useNavigate } from "react-router-dom";
import { EnterprisePublic } from "../lib/types";
import { useAuthStore, useCartStore } from "../store";
import {
  Search, ChevronRight, Star, MapPin, Bell, X,
  LayoutGrid, UtensilsCrossed, ShoppingBag, Package, BadgePercent, Store,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { resolveImageUrl, resolveEnterpriseImage } from "../lib/images";
import { ProductCardImage } from "../components/ProductCardImage";

// ─── Types ─────────────────────────────────────────────────────────────────

type FilterTab = "all" | "plat" | "article" | "restaurant" | "boutique" | "promo";
type SortKey = "recent" | "popular" | "price_low" | "price_high";

type MarketingCampaign = {
  id: string;
  nom: string;
  description: string | null;
  type: string;
  image_url: string | null;
  date_debut: string | null;
  date_fin: string | null;
};

// ─── Filter categories (matches mobile FOOD_CATEGORIES exactly) ────────────

const FOOD_CATEGORIES: { key: FilterTab; label: string; Icon: LucideIcon }[] = [
  { key: "all", label: "Tout", Icon: LayoutGrid },
  { key: "plat", label: "Plats", Icon: UtensilsCrossed },
  { key: "restaurant", label: "Restos", Icon: Store },
  { key: "boutique", label: "Boutiques", Icon: ShoppingBag },
  { key: "article", label: "Produits", Icon: Package },
  { key: "promo", label: "Promos", Icon: BadgePercent },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

function isPromoProduct(p: any): boolean {
  if (p.prix_promo == null) return false;
  return Number(p.prix_promo) < Number(p.prix);
}

function promoPercent(p: any): number | null {
  if (!isPromoProduct(p)) return null;
  const pct = Math.round((1 - Number(p.prix_promo) / Number(p.prix)) * 100);
  return pct > 0 ? pct : null;
}

// ─── Sort Row ─────────────────────────────────────────────────────────────

function SortRow({ category, sort, setSort, compact }: { category: FilterTab; sort: SortKey; setSort: (s: SortKey) => void; compact?: boolean }) {
  const options: { key: SortKey; label: string }[] =
    category === "restaurant" || category === "boutique"
      ? [{ key: "popular", label: "Populaires" }, { key: "recent", label: "Récents" }]
      : [{ key: "price_low", label: "Prix ↑" }, { key: "price_high", label: "Prix ↓" }];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setSort(o.key)}
          className={`${compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-[12px]"} rounded-full font-semibold border transition whitespace-nowrap`}
          style={{
            background: sort === o.key ? "var(--brand)" : "var(--surface)",
            color: sort === o.key ? "#FFF" : "var(--txt-secondary)",
            borderColor: sort === o.key ? "var(--brand)" : "var(--border)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Show splash ONLY for first-time non-authenticated visitors
  const [showSplash] = useState(() => {
    if (isAuthenticated) return false;
    return !safeGetItem("onboarding_done");
  });
  if (showSplash) {
    return (
      <SplashOverlay
        onDiscover={() => {
          safeSetItem("onboarding_done", "true");
          // Ne pas naviguer : on reste sur la page d'accueil
          window.location.reload();
        }}
        onLogin={() => {
          safeSetItem("onboarding_done", "true");
          navigate("/auth", { replace: true });
        }}
      />
    );
  }

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  // ── Fetch enterprises ──
  const { data: restaurants = [] } = useQuery<EnterprisePublic[]>({
    queryKey: ["enterprises", "restaurant"],
    queryFn: () => apiFetch("/api/enterprises?type=restaurant"),
    staleTime: 120_000,
  });

  const { data: boutiques = [] } = useQuery<EnterprisePublic[]>({
    queryKey: ["enterprises", "boutique"],
    queryFn: () => apiFetch("/api/enterprises?type=boutique"),
    staleTime: 120_000,
  });

  // ── Fetch product feed ──
  const feedParams = category === "plat" ? "&type=plat" : category === "article" ? "&type=article" : category === "promo" ? "&promo=true" : "";
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["home-feed", category],
    queryFn: () => apiFetch(`/api/products/feed?limit=48&offset=0${feedParams}`),
    staleTime: 180_000,
  });

  // ── Active campaigns ──
  const { data: campaigns = [] } = useQuery<MarketingCampaign[]>({
    queryKey: ["active-campaigns"],
    queryFn: () => apiFetch("/api/campaigns/active"),
    staleTime: 60_000,
  });

  // ── Search ──
  const { data: searchResult, isFetching: searching } = useQuery({
    queryKey: ["home-search", search, category],
    queryFn: () => apiFetch(`/api/catalog/search?q=${encodeURIComponent(search)}&limit=40`),
    enabled: search.trim().length >= 2,
    staleTime: 45_000,
  });

  const searchActive = search.trim().length >= 2;
  const rawProducts: any[] = searchActive
    ? (searchResult as any)?.products ?? []
    : Array.isArray(products) ? products : [];

  const displayProducts: any[] = [...rawProducts].sort((a: any, b: any) => {
    if (sort === "price_low") return Number(a.prix_promo || a.prix || 0) - Number(b.prix_promo || b.prix || 0);
    if (sort === "price_high") return Number(b.prix_promo || b.prix || 0) - Number(a.prix_promo || a.prix || 0);
    return 0; // recent = default order from API
  });

  const rawEnterprises: EnterprisePublic[] = searchActive
    ? (searchResult as any)?.enterprises ?? []
    : category === "restaurant" ? restaurants
    : category === "boutique" ? boutiques
    : [];

  const displayEnterprises: EnterprisePublic[] = [...rawEnterprises].sort((a, b) => {
    if (sort === "popular") return (b.note_moyenne || 0) - (a.note_moyenne || 0);
    return 0; // recent = default order
  });
  const showProductGrid = category !== "restaurant" && category !== "boutique";

  // ── Discover section (top 3 popular, with at least 1 product in feed) ──
  const enterpriseIdsWithProducts = new Set((Array.isArray(products) ? products : []).map((p: any) => p.entreprise_id));
  const discoverEnterprises = [...restaurants, ...boutiques]
    .filter((e) => enterpriseIdsWithProducts.has(e.id))
    .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
    .slice(0, 3);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const handleScroll = useCallback(() => {
    setShowBackToTop(window.scrollY > 400);
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="space-y-4">
      {/* ── Sticky header: location + search + filters ── */}
      <div className="sticky top-0 lg:top-[66px] z-30 bg-surface-muted/95 backdrop-blur-sm border-b border-line/50">
        {/* ── MOBILE layout (vertical stack) ── */}
        <div className="lg:hidden pt-3 pb-2 space-y-3 px-0">
          {/* Top bar: location + bell */}
          <div className="flex items-center justify-between">
            <Link to="/addresses" className="flex items-center gap-1 text-txt hover:opacity-80 transition">
              <MapPin size={16} className="text-brand" strokeWidth={2.5} />
              <span className="text-base font-bold">Brazzaville</span>
              <span className="text-txt-muted">›</span>
            </Link>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Link to="/notifications" className="relative w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-brand-50 transition">
                  <Bell size={18} className="text-txt" />
                </Link>
              )}
            </div>
          </div>
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-surface-muted border border-line rounded-[14px] px-4 py-3">
            <Search size={17} className="text-txt-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un plat, un produit, un restaurant…" className="flex-1 bg-transparent text-sm text-txt placeholder-txt-muted" />
            {search.length > 0 && (<button onClick={() => setSearch("")}><X size={16} className="text-txt-muted" /></button>)}
          </div>
          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap pb-1">
            {FOOD_CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button key={c.key} onClick={() => setCategory(c.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap transition ${active ? "bg-brand text-white border-brand shadow-sm" : "bg-surface text-txt border-line hover:bg-brand-50"}`}>
                  <c.Icon size={14} strokeWidth={active ? 2.4 : 2} />{c.label}
                </button>
              );
            })}
          </div>
          {/* Sort row */}
          <SortRow category={category} sort={sort} setSort={setSort} />
        </div>

        {/* ── DESKTOP layout (compact horizontal) ── */}
        <div className="hidden lg:flex items-center gap-3 px-4 lg:px-6 xl:px-8 py-2.5 min-w-0 overflow-hidden">
          {/* Search bar — takes most space */}
          <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-xl px-4 py-2.5 min-w-0">
            <Search size={16} className="text-txt-muted flex-shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="flex-1 bg-transparent text-sm text-txt placeholder-txt-muted min-w-0" />
            {search.length > 0 && (<button onClick={() => setSearch("")}><X size={14} className="text-txt-muted" /></button>)}
          </div>
          {/* Filter chips — scrollable if too many */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink min-w-0">
            {FOOD_CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button key={c.key} onClick={() => setCategory(c.key)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition ${active ? "bg-brand text-white border-brand shadow-sm" : "bg-surface text-txt border-line hover:bg-brand-50"}`}>
                  <c.Icon size={12} strokeWidth={active ? 2.4 : 2} />{c.label}
                </button>
              );
            })}
          </div>
          {/* Sort — compact */}
          <div className="flex-shrink-0">
            <SortRow category={category} sort={sort} setSort={setSort} compact />
          </div>
        </div>
      </div>

      {/* ── Active order widget ── */}
      {isAuthenticated && <ActiveOrderWidget />}

      {/* ── Campaign banner ── */}
      {!searchActive && category === "all" && campaigns.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl overflow-hidden bg-brand text-white"
              style={{ minHeight: 80 }}
            >
              {resolveEnterpriseImage(c) ? (
                <img src={resolveEnterpriseImage(c)!} alt={c.nom} className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-brand/90 to-brand/60" />
              <div className="relative px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">{c.type === "promo" ? "Offre du jour" : "Campagne"}</p>
                <h3 className="text-lg font-extrabold mt-0.5">{c.nom}</h3>
                {c.description && <p className="text-sm opacity-90 mt-0.5 line-clamp-2">{c.description}</p>}
                {c.type === "promo" && (
                  <button
                    onClick={() => setCategory("promo")}
                    className="mt-2 bg-white text-brand text-xs font-bold px-4 py-1.5 rounded-full hover:bg-white/90 transition"
                  >
                    Voir les promos
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── À DÉCOUVRIR (enterprises) ── */}
      {!searchActive && category === "all" && discoverEnterprises.length > 0 && (
        <section className="bg-surface-muted/50 py-5 rounded-2xl">
          <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-txt">À découvrir</h2>
            <Link to="/explore" className="flex items-center gap-0.5 text-xs font-semibold text-brand">
              Voir plus <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
          <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {discoverEnterprises.map((e) => (
              <Link
                key={e.id}
                to={`/marketplace/${e.id}`}
                className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-line hover:shadow-lg hover:border-brand/20 transition-all duration-200 group"
              >
                <div className="w-full aspect-[16/10] bg-brand-50 flex items-center justify-center overflow-hidden">
                  {resolveEnterpriseImage(e) ? (
                    <img src={resolveEnterpriseImage(e)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Store size={28} className="text-brand/30" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-txt truncate leading-tight">{e.nom}</p>
                  {e.note_moyenne != null && e.note_moyenne > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={12} className="text-accent fill-accent" />
                      <span className="text-xs font-bold text-txt">{e.note_moyenne.toFixed(1)}</span>
                      {e.nb_avis && <span className="text-xs text-txt-muted">({e.nb_avis})</span>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* ── RECOMMANDÉS POUR VOUS ── */}
      {!searchActive && category === "all" && displayProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-txt">Recommandés pour vous</h2>
        </div>
      )}

      {/* ── Enterprise list (restaurants / boutiques) ── */}
      {!searchActive && (category === "restaurant" || category === "boutique") && (
        <section className="max-w-[1200px] mx-auto">
          <h2 className="text-xl font-extrabold text-txt mb-4">
            {category === "restaurant" ? "Restaurants" : "Boutiques"}
          </h2>
          <div className="w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEnterprises.map((ent) => (
              <Link
                key={ent.id}
                to={`/marketplace/${ent.id}`}
                className="flex items-center gap-3.5 p-4 bg-surface border border-line rounded-2xl hover:shadow-lg hover:border-brand/20 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {resolveEnterpriseImage(ent) ? (
                    <img src={resolveEnterpriseImage(ent)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Store size={22} className="text-brand/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-txt truncate">{ent.nom}</p>
                  <p className="text-xs text-txt-muted truncate">
                    {[ent.categorie_nom, ent.description].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {ent.note_moyenne != null && ent.note_moyenne > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={13} className="text-accent fill-accent" />
                    <span className="text-sm font-bold text-txt">{Number(ent.note_moyenne).toFixed(1)}</span>
                  </div>
                )}
                <ChevronRight size={16} className="text-txt-muted flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Product grid — compact cards: 2 cols mobile / 3 tablet / 4 desktop / 5 xl ── */}
      {showProductGrid && displayProducts.length > 0 && (
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-3">
          {displayProducts.map((p: any) => {
            const pct = promoPercent(p);
            return (
              <Link
                key={p.id}
                to={`/product/${p.id}?from=${p.enterprise_type === 'restaurant' ? 'resto' : 'boutique'}`}
                className="group bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-line/50 hover:border-brand/20 transition-all duration-200"
              >
                <div className="w-full aspect-square bg-brand-50 flex items-center justify-center overflow-hidden relative">
                  <ProductCardImage product={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {pct != null && (
                    <span className="absolute top-1.5 left-1.5 bg-error text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      -{pct}%
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-txt truncate leading-tight">{p.nom || "Produit"}</p>
                  {p.enterprise_nom && <p className="text-[10px] text-txt-muted truncate mt-0.5">{p.enterprise_nom}</p>}
                  <span className="text-xs font-extrabold text-brand mt-1 block">
                    {formatFcfa(Number(p.prix_promo ?? p.prix))}
                  </span>
                  {isPromoProduct(p) && (
                    <span className="text-[10px] text-txt-muted line-through">{formatFcfa(Number(p.prix))}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loadingProducts && (
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface rounded-xl overflow-hidden animate-pulse border border-line/50">
              <div className="w-full aspect-square bg-gray-200" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loadingProducts && displayProducts.length === 0 && displayEnterprises.length === 0 && (
        <div className="text-center py-16">
          <img src="/assets/images/logo.png" alt="GoLivra" className="h-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm text-txt-muted font-semibold">
            {searchActive ? "Aucun résultat" : "Aucun produit pour le moment"}
          </p>
          <p className="text-xs text-txt-muted mt-1">
            {searchActive ? "Modifiez la recherche ou les filtres." : "Revenez un peu plus tard !"}
          </p>
        </div>
      )}

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 w-11 h-11 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-700 transition active:scale-95"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// ─── Active Order Widget ────────────────────────────────────────────────────

function ActiveOrderWidget() {
  const { data: orders = [] } = useQuery({
    queryKey: ["active-orders"],
    queryFn: () => apiFetch("/api/orders?status=active&limit=1"),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const activeOrder = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;
  if (!activeOrder) return null;

  return (
    <Link
      to={`/orders/${activeOrder.id}`}
      className="block bg-brand-50 border border-brand-200 rounded-2xl p-4 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-brand mb-1">Commande en cours</p>
          <p className="text-sm font-bold text-txt">#{(activeOrder.id as string).slice(0, 8)}</p>
          <p className="text-xs text-txt-muted mt-0.5">{activeOrder.statut}</p>
        </div>
        <div className="text-brand text-xl font-bold">→</div>
      </div>
    </Link>
  );
}

// ─── Splash Overlay ────────────────────────────────────────────────────────

const GOLIVRA_ORANGE = "#F58A07";

function SplashOverlay({ onDiscover, onLogin }: { onDiscover: () => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-hidden">
      <img
        src="/assets/images/home2.jpg"
        alt="GoLivra - Livraison à Brazzaville"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.65) 100%)" }}
      />
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-12 pointer-events-none">
        <img
          src="/assets/images/logo.png"
          alt="GoLivra"
          className="h-12 w-auto opacity-90"
          style={{ filter: "brightness(0) invert(1)" }}
          draggable={false}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 px-4 pb-8">
        <h1
          className="text-white text-center font-bold leading-snug max-w-sm"
          style={{ fontSize: "clamp(1.35rem, 4vw, 1.65rem)", textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}
        >
          Découvrez vos restaurants, boutiques et produits préférés à Brazzaville
        </h1>
        <p className="text-white/80 text-center text-sm max-w-xs leading-relaxed">
          Commandez en un clin d'œil. Payez par Mobile Money.
        </p>
        {/* CTA principal : Découvrir */}
        <button
          onClick={onDiscover}
          className="w-full max-w-md text-white font-bold tracking-wide transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            backgroundColor: GOLIVRA_ORANGE,
            minHeight: 54,
            borderRadius: 999,
            fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
            boxShadow: "0 8px 22px rgba(245, 138, 7, 0.42)",
          }}
        >
          Découvrir GoLivra
        </button>
        {/* Lien secondaire : J'ai déjà un compte */}
        <button
          onClick={onLogin}
          className="text-white/80 text-sm font-medium hover:text-white transition underline"
        >
          Déjà membre ? Se connecter
        </button>
        <div className="flex items-center gap-4 mt-1 opacity-80">
          <span className="flex items-center gap-1 text-white text-xs"><span className="text-green-400">✓</span> Livraison rapide</span>
          <span className="flex items-center gap-1 text-white text-xs"><span className="text-green-400">✓</span> Mobile Money</span>
          <span className="flex items-center gap-1 text-white text-xs"><span className="text-green-400">✓</span> Brazzaville</span>
        </div>
        <span
          className="text-white/60 font-semibold tracking-wide mt-1"
          style={{ fontSize: 11 }}
        >
          GoLivra · Version bêta
        </span>
      </div>
    </div>
  );
}
