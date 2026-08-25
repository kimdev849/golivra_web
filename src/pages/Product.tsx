import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useCartStore } from "../store";
import type { ProductPublic } from "../lib/types";
import {
  ArrowLeft, Heart, Minus, Plus, ShoppingCart, Store, UtensilsCrossed,
  Check, AlertTriangle, ImageIcon, Clock, ChevronRight, Tag,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { GalleryViewer } from "../components/GalleryViewer";
import { toggleFavoriteProduct, isFavoriteProduct } from "../lib/favorites";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

/**
 * Smart product fetch — tries enterprise products first (fast), then feed (fallback).
 * Matches mobile fetchProductById which uses enterprise cache + feed fallback.
 */
async function fetchProductByIdSmart(productId: string, enterpriseId?: string): Promise<ProductPublic | null> {
  // 1. If we know the enterprise, fetch its products (fast, small response)
  if (enterpriseId) {
    try {
      const prods: any[] = await apiFetch(`/api/products/enterprise/${enterpriseId}`);
      if (Array.isArray(prods)) {
        const found = prods.find((p: any) => p.id === productId);
        if (found) return found;
      }
    } catch { /* continue to fallback */ }
  }

  // 2. Try the product feed (larger response)
  try {
    const feed: any[] = await apiFetch("/api/products/feed?limit=200", { timeoutMs: 25_000 });
    if (Array.isArray(feed)) {
      const found = feed.find((p: any) => p.id === productId);
      if (found) return found;
    }
  } catch { /* continue */ }

  // 3. Search catalog as last resort
  try {
    const result: any = await apiFetch("/api/catalog/search?q=&limit=100", { timeoutMs: 20_000 });
    const prods = result?.products ?? [];
    return prods.find((p: any) => p.id === productId) ?? null;
  } catch { return null; }
}

function getGalleryImages(p: ProductPublic): string[] {
  const images: string[] = [];
  if ((p as any).images_urls && Array.isArray((p as any).images_urls)) {
    for (const url of (p as any).images_urls) { if (url) images.push(url); }
  }
  if (images.length === 0 && p.image_url) images.push(p.image_url);
  return images;
}

function getConditionLabel(p: ProductPublic): string | null {
  const etat = (p as any).etat_produit;
  if (!etat) return null;
  const map: Record<string, string> = { neuf: "Neuf", occasion: "Occasion", reconditionne: "Reconditionné" };
  return map[etat] ?? etat;
}

export function ProductPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const enterpriseId = searchParams.get("enterprise") || undefined;
  const navigate = useNavigate();
  const { addItem, cart, updateQuantity } = useCartStore();
  const [selectedOptions, setSelectedOptions] = useState<{ groupIndex: number; choiceIndex: number }[]>([]);
  const [note, setNote] = useState("");
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const { data: product, isLoading, error } = useQuery<ProductPublic | null>({
    queryKey: ["product", productId, enterpriseId],
    queryFn: () => fetchProductByIdSmart(productId!, enterpriseId),
    enabled: !!productId,
    staleTime: 120_000,
    retry: 1,
  });

  // Fetch enterprise for hours/open status
  const { data: enterprise } = useQuery({
    queryKey: ["enterprise", product?.entreprise_id],
    queryFn: () => apiFetch(`/api/enterprises/${product!.entreprise_id}`),
    enabled: !!product?.entreprise_id,
    staleTime: 120_000,
  });

  const ent = enterprise as any;
  const galleryImages = useMemo(() => product ? getGalleryImages(product) : [], [product]);

  const cartLine = useMemo(() => {
    if (!product || !cart) return null;
    const seg = cart.segments.find((s) => s.enterpriseId === product.entreprise_id);
    return seg?.lines.find((l) => l.productId === product?.id) ?? null;
  }, [cart, product]);

  const optionSupplement = useMemo(() => {
    if (!product?.options || !Array.isArray(product.options)) return 0;
    let total = 0;
    for (const s of selectedOptions) {
      const g = product.options[s.groupIndex];
      const c = g?.choix?.[s.choiceIndex];
      if (c && typeof c.prix_sup === "number" && Number.isFinite(c.prix_sup)) total += c.prix_sup;
    }
    return total;
  }, [product, selectedOptions]);

  const basePrice = product ? Number(product.prix_promo ?? product.prix ?? 0) : 0;
  const unitPrice = basePrice + optionSupplement;
  const totalPrice = unitPrice;

  // Enterprise open status
  const isClosed = ent && (ent.ouvert === false || ent.est_ouvert_maintenant === false || ent.accepte_commandes === false);
  const tropTard = ent && ent.peut_commander_maintenant === false;
  const orderable = !isClosed && !tropTard;

  // Check favorite on load
  useMemo(() => {
    if (!product) return;
    const kind: "plat" | "article" = (product as any).kind === "article" ? "article" : "plat";
    setIsFav(isFavoriteProduct(product.id, kind));
  }, [product?.id]);

  const handleToggleFav = async () => {
    if (!product) return;
    const kind: "plat" | "article" = (product as any).kind === "article" ? "article" : "plat";
    const wasFav = isFav;
    setIsFav(!wasFav);
    try {
      const next = await toggleFavoriteProduct(product.id, kind);
      setIsFav(next);
      toast.success(next ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch {
      setIsFav(wasFav);
      toast.error("Erreur lors de la mise à jour des favoris.");
    }
  };

  const onAddToCart = () => {
    if (!product) return;
    if (!orderable) { toast.error(ent?.message_fermeture || "Commerce fermé pour le moment."); return; }
    addItem(
      { enterpriseId: product.entreprise_id, enterpriseNom: product.enterprise_nom || "Commerce", enterpriseType: product.enterprise_type || undefined },
      { productId: product.id, nom: product.nom || "Produit", prixUnitaire: unitPrice, quantite: 1 }
    );
    toast.success("Ajouté au panier", { action: { label: "Voir le panier", onClick: () => navigate("/cart") } });
  };

  const EnterpriseIcon = product?.enterprise_type === "restaurant" ? UtensilsCrossed : Store;
  const condition = product ? getConditionLabel(product) : null;
  const stock = product ? Number((product as any).stock) : null;
  const stockIllimite = product ? (product as any).stock_illimite : false;
  const estDisponible = product ? (product as any).est_disponible !== false : true;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="w-full aspect-[4/3] max-h-[340px] bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="space-y-2"><div className="h-3 bg-gray-200 rounded w-full" /><div className="h-3 bg-gray-200 rounded w-5/6" /><div className="h-3 bg-gray-200 rounded w-2/3" /></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center"><AlertTriangle size={28} className="text-error" /></div>
        <h2 className="text-lg font-extrabold text-txt mb-1">Produit introuvable</h2>
        <p className="text-sm text-txt-muted mb-6">Ce produit n'existe pas ou n'est plus disponible.</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-full text-sm font-bold"><ArrowLeft size={16} /> Retour</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* ── HERO IMAGE ── */}
      <div className="relative">
        <button onClick={() => galleryImages.length > 0 && setGalleryOpen(true)} className="block w-full">
          <div className="w-full aspect-[4/3] max-h-[340px] bg-brand-50 overflow-hidden">
            {galleryImages[selectedGalleryIndex] ? (
              <img src={galleryImages[selectedGalleryIndex]} alt={product.nom || ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand/20"><ImageIcon size={48} /></div>
            )}
          </div>
        </button>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface shadow-md flex items-center justify-center hover:bg-brand-50 transition">
            <ArrowLeft size={20} className="text-txt" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleToggleFav(); }} className="w-10 h-10 rounded-full bg-surface shadow-md flex items-center justify-center hover:bg-brand-50 transition">
            <Heart size={20} className={isFav ? "text-error" : "text-txt"} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
        {galleryImages.length > 1 && (
          <button onClick={() => setGalleryOpen(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/55 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
            <ImageIcon size={14} /> {galleryImages.length} photos
          </button>
        )}
      </div>

      {/* ── THUMBNAILS ── */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar">
          {galleryImages.map((url, i) => (
            <button key={i} onClick={() => setSelectedGalleryIndex(i)} className={`w-[60px] h-[60px] rounded-[10px] overflow-hidden border-2 flex-shrink-0 transition ${i === selectedGalleryIndex ? "border-brand" : "border-transparent"}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Name + Price + Condition */}
        <div>
          <h1 className="text-xl font-extrabold text-txt leading-tight">{product.nom}</h1>
          {product.prix_promo != null ? (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-extrabold text-brand">{formatFcfa(Number(product.prix_promo))}</span>
              <span className="text-sm text-txt-muted line-through">{formatFcfa(Number(product.prix))}</span>
              <span className="bg-error text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">PROMO</span>
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-txt mt-1">{formatFcfa(Number(product.prix))}</p>
          )}
          {condition && <span className="inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-extrabold bg-brand/10 text-brand">{condition}</span>}
        </div>

        {/* Vendor badge */}
        <Link to={`/marketplace/${product.entreprise_id}`} className="flex items-center gap-3 p-3 bg-surface border border-line rounded-xl hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden">
            {product.enterprise_image_url ? <img src={product.enterprise_image_url} alt="" className="w-full h-full object-cover" /> : <EnterpriseIcon size={20} className="text-brand" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-txt truncate">{product.enterprise_nom || "Vendeur"}</p>
            <p className="text-xs text-txt-muted">{product.enterprise_type === "restaurant" ? "Restaurant" : "Boutique"} · Voir la boutique</p>
          </div>
          <ChevronRight size={18} className="text-txt-muted" />
        </Link>

        {/* Enterprise closed */}
        {isClosed && ent && (
          <div className="flex items-center gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
            <Clock size={16} className="text-error flex-shrink-0" />
            <p className="text-xs font-semibold text-error">{ent.message_fermeture || "Commerce fermé pour le moment"}</p>
          </div>
        )}
        {tropTard && ent && (
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl p-3">
            <Clock size={16} className="text-accent-deep flex-shrink-0" />
            <p className="text-xs font-semibold text-accent-deep">{ent.message_commande || "Il est trop tard pour commander"}</p>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div>
            <p className="text-sm font-bold text-txt mb-1">Description</p>
            <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Tags */}
        {Array.isArray((product as any).tags) && (product as any).tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(product as any).tags.slice(0, 6).map((t: string) => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted border border-line text-xs font-semibold text-txt-secondary">
                <Tag size={10} /> {t}
              </span>
            ))}
          </div>
        )}

        {/* Options */}
        {Array.isArray(product.options) && product.options.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-txt">Personnalisation</p>
            {product.options.map((g, gi) => (
              <div key={gi} className="border border-line rounded-xl p-3 space-y-2">
                <p className="text-[13px] font-bold text-txt">{g.nom}{g.requis ? " *" : ""}</p>
                {(g.choix || []).map((c, ci) => {
                  const sel = selectedOptions.some((s) => s.groupIndex === gi && s.choiceIndex === ci);
                  return (
                    <button key={ci} onClick={() => {
                      setSelectedOptions((prev) => {
                        if (sel) return prev.filter((s) => !(s.groupIndex === gi && s.choiceIndex === ci));
                        return [...prev.filter((s) => s.groupIndex !== gi), { groupIndex: gi, choiceIndex: ci }];
                      });
                    }} className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition ${sel ? "border-brand bg-brand-50" : "border-line"}`}>
                      <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border ${sel ? "border-brand bg-brand" : "border-line"}`}>
                        {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="flex-1 text-left text-sm text-txt">{c.label}</span>
                      {typeof c.prix_sup === "number" && c.prix_sup > 0 && (
                        <span className="text-xs font-bold text-txt-muted">+{formatFcfa(c.prix_sup)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Stock */}
        {stock != null && !stockIllimite && (
          <div className={`flex items-center gap-2 rounded-xl p-3 border ${stock > 0 ? "bg-brand-50/50 border-brand-200" : "bg-surface border-line"}`}>
            <div className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-brand" : "bg-error"}`} />
            <span className={`text-xs font-semibold ${stock > 0 ? "text-txt" : "text-txt-muted"}`}>
              {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
            </span>
          </div>
        )}
        {!estDisponible && (
          <div className="flex items-center gap-2 bg-surface border border-line rounded-xl p-3">
            <div className="w-2 h-2 rounded-full bg-error" />
            <span className="text-xs font-semibold text-txt-muted">Produit indisponible</span>
          </div>
        )}

        {/* Note */}
        <div>
          <p className="text-sm font-bold text-txt mb-1">Note pour le vendeur (optionnel)</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. sans piment, appelez à l'arrivée…" rows={3} className="w-full border border-line rounded-xl p-3 text-sm text-txt bg-surface resize-none" />
        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <GalleryViewer images={galleryImages} initialIndex={selectedGalleryIndex} onClose={() => setGalleryOpen(false)} onIndexChange={setSelectedGalleryIndex} />
      )}

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] lg:z-50">
        <div className="bg-white/95 backdrop-blur-sm border-t border-line px-4 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)" }}>
          <div className="max-w-4xl mx-auto">
            {cartLine ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-surface-muted border border-line rounded-xl overflow-hidden">
                  <button onClick={() => { if (cartLine.quantite <= 1) updateQuantity(product.entreprise_id, product.id, 0); else updateQuantity(product.entreprise_id, product.id, cartLine.quantite - 1); }} className="w-11 h-11 flex items-center justify-center hover:bg-brand-50 transition">
                    <Minus size={18} className="text-brand" />
                  </button>
                  <span className="w-8 text-center text-base font-extrabold text-txt">{cartLine.quantite}</span>
                  <button onClick={() => updateQuantity(product.entreprise_id, product.id, cartLine.quantite + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-brand-50 transition">
                    <Plus size={18} className="text-brand" />
                  </button>
                </div>
                <Link to="/cart" className="flex-1 flex items-center justify-center gap-2 bg-brand text-white h-11 rounded-xl font-extrabold text-sm transition active:bg-brand-700">
                  <ShoppingCart size={18} /> Panier · {formatFcfa(cartLine.quantite * unitPrice)}
                </Link>
              </div>
            ) : (
              <button onClick={onAddToCart} disabled={!orderable} className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-extrabold text-sm transition ${orderable ? "bg-brand text-white active:bg-brand-700" : "bg-gray-200 text-txt-muted cursor-not-allowed"}`}>
                <ShoppingCart size={18} strokeWidth={2.4} />
                <span>{orderable ? "Ajouter au panier" : ent?.message_fermeture || "Indisponible"}</span>
                {orderable && <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{formatFcfa(totalPrice)}</span>}
              </button>
            )}
          </div>
        </div>
        <div className="h-2 lg:hidden" />
      </div>
    </div>
  );
}
