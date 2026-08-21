import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore } from "../store";
import { Minus, Plus, Trash2, PackageOpen, Truck, MapPin, ChevronDown, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { sanitizeText, validateAddress, validateTextField } from "../lib/validation";
import { fetchPublicPricing, deliveryFeeForQuartier, type PublicPricing } from "../lib/pricing";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

export function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart, itemCount } = useCartStore();
  const { session } = useAuthStore();
  const [address, setAddress] = useState({ quartier: "", ligne1: "", instructions: "" });
  const [errors, setErrors] = useState<{ quartier?: string; ligne1?: string; instructions?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  const { data: pricing } = useQuery<PublicPricing>({
    queryKey: ["pricing-config"],
    queryFn: fetchPublicPricing,
    staleTime: 300_000,
  });

  const pricingConfig = pricing || undefined;
  const zones = pricingConfig?.zones?.zones?.filter((z) => z.is_active) ?? [];
  const arrondissements = pricingConfig?.zones?.arrondissements ?? [];
  const priceByArr = pricingConfig?.zones?.price_by_arrondissement ?? {};

  const zonesWithArrondissements = useMemo(() => {
    return zones.map((z) => ({
      ...z,
      quartiers: arrondissements
        .filter((a) => a.zone_id === z.id)
        .map((a) => ({ name: a.name, price: priceByArr[a.name] ?? z.price_base }))
        .sort((a, b) => a.price - b.price),
    })).sort((a, b) => a.price_base - b.price_base);
  }, [zones, arrondissements, priceByArr]);

  const subtotal = cart?.segments.reduce((acc, seg) => acc + seg.lines.reduce((a, l) => a + l.prixUnitaire * l.quantite, 0), 0) ?? 0;
  const deliveryFee = useMemo(() => {
    if (!cart?.segments) return 0;
    return cart.segments.reduce((acc, seg) => {
      const commerceFee = seg.fraisLivraison;
      const zoneFee = deliveryFeeForQuartier(address.quartier || undefined, pricingConfig);
      const fee = (commerceFee && commerceFee > 0) ? Math.max(commerceFee, zoneFee) : zoneFee;
      return acc + fee;
    }, 0);
  }, [cart, address.quartier, pricingConfig]);
  const grandTotal = subtotal + deliveryFee;
  const hasItems = cart && cart.segments.some((s) => s.lines.length > 0);

  const handleInput = (field: "quartier" | "ligne1" | "instructions", value: string) => {
    const sanitized = sanitizeText(value);
    setAddress((prev) => ({ ...prev, [field]: sanitized }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSelectZone = (quartier: string) => {
    setAddress((prev) => ({ ...prev, quartier }));
    setShowZonePicker(false);
  };

  const submitOrder = async () => {
    if (!cart || !hasItems) return;
    const newErrors: typeof errors = {};
    const quartierV = validateTextField(address.quartier, "Le quartier", 80);
    if (!quartierV.ok) newErrors.quartier = quartierV.m;
    const addrV = validateAddress(address.ligne1);
    if (!addrV.ok) newErrors.ligne1 = addrV.m;
    if (address.instructions.trim()) {
      const v = validateTextField(address.instructions, "Les instructions", 200);
      if (!v.ok) newErrors.instructions = v.m;
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (!session?.token) { toast.error("Connectez-vous pour passer commande."); navigate("/auth"); return; }

    setSubmitting(true);
    try {
      const result = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        token: session.token,
        timeoutMs: 45_000,
        jsonBody: {
          adresseLivraison: `${address.quartier}, ${address.ligne1}`.trim(),
          adresse: { quartier: address.quartier, ligne1: address.ligne1, instructions: address.instructions, ville: "Brazzaville", pays: "Congo" },
          methodePaiement: "airtel_money",
          segments: cart.segments.map((seg) => ({
            entrepriseId: seg.enterpriseId,
            establishmentType: seg.enterpriseType || "restaurant",
            articles: seg.lines.map((l) => ({ itemId: l.productId, quantite: l.quantite })),
          })),
        },
      });
      clearCart();
      toast.success("Commande envoyée !");
      navigate(`/orders/${result.id}`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Commande impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasItems) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <PackageOpen size={40} className="text-brand" />
        </div>
        <h2 className="text-lg font-extrabold text-brand-deep mb-1">Votre panier est vide</h2>
        <p className="text-sm text-txt-muted mb-6">Découvrez les restaurants et boutiques pour commencer vos achats.</p>
        <Link to="/explore" className="inline-block bg-brand text-white px-8 py-3 rounded-full font-extrabold text-sm">Voir les commerces</Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-24 lg:pb-6">
      <div className="lg:grid lg:grid-cols-5 lg:gap-10 lg:items-start">
        {/* ── LEFT: Cart items ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-txt">Votre panier</h1>
            <button onClick={() => { if (confirm("Voulez-vous vraiment vider votre panier ?")) { clearCart(); toast.success("Panier vidé."); } }} className="flex items-center gap-1 text-xs font-semibold text-error hover:text-error/80">
              <Trash2 size={14} /> Vider
            </button>
          </div>

          {cart && cart.segments.length > 1 && (
            <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl p-3">
              <Truck size={22} className="text-brand" />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-deep">{cart.segments.length} livraisons séparées</p>
                <p className="text-xs text-txt-muted">Chaque commerce est préparé et livré indépendamment.</p>
              </div>
            </div>
          )}

          {cart?.segments.map((seg) => (
            <div key={seg.enterpriseId} className="bg-surface border border-line rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-txt">{seg.enterpriseNom}</p>
              {seg.lines.map((line) => (
                <div key={line.productId} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-txt truncate">{line.nom}</p>
                    <p className="text-xs text-txt-muted">{formatFcfa(line.prixUnitaire)} × {line.quantite}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => line.quantite <= 1 ? removeItem(seg.enterpriseId, line.productId) : updateQuantity(seg.enterpriseId, line.productId, line.quantite - 1)} className="w-8 h-8 rounded-lg border border-line flex items-center justify-center hover:bg-brand-50">
                      <Minus size={14} className="text-brand" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{line.quantite}</span>
                    <button onClick={() => updateQuantity(seg.enterpriseId, line.productId, line.quantite + 1)} className="w-8 h-8 rounded-lg border border-line flex items-center justify-center hover:bg-brand-50">
                      <Plus size={14} className="text-brand" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-brand min-w-[80px] text-right">{formatFcfa(line.prixUnitaire * line.quantite)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── RIGHT: Address + Summary ── */}
        <div className="lg:col-span-2 space-y-4 mt-4 lg:mt-0 lg:sticky lg:top-20">
          {/* Address */}
          <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-txt flex items-center gap-2"><MapPin size={16} className="text-brand" /> Adresse de livraison</p>

            <div>
              <label className="text-xs font-semibold text-txt-secondary mb-1 block">Quartier / Zone</label>
              <button type="button" onClick={() => setShowZonePicker(true)} className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-sm bg-surface transition hover:bg-brand-50 ${errors.quartier ? "border-error" : "border-line"}`}>
                <MapPin size={16} className="text-brand flex-shrink-0" />
                <span className={`flex-1 text-left ${address.quartier ? "text-txt" : "text-txt-muted"}`}>
                  {address.quartier || "Sélectionnez votre quartier"}
                </span>
                <ChevronDown size={16} className="text-txt-muted" />
              </button>
              {errors.quartier && <p className="text-xs text-error mt-1">{errors.quartier}</p>}
              {address.quartier && (
                <p className="text-[11px] text-brand font-semibold mt-1">
                  Livraison : {formatFcfa(deliveryFeeForQuartier(address.quartier, pricingConfig))}
                </p>
              )}
            </div>

            <div>
              <input type="text" value={address.ligne1} onChange={(e) => handleInput("ligne1", e.target.value)} maxLength={200} placeholder="Adresse complète (rue, repère)" className={`w-full border rounded-xl px-4 py-3 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 ${errors.ligne1 ? "border-error" : "border-line"}`} />
              {errors.ligne1 && <p className="text-xs text-error mt-1">{errors.ligne1}</p>}
            </div>
            <div>
              <input type="text" value={address.instructions} onChange={(e) => handleInput("instructions", e.target.value)} maxLength={200} placeholder="Instructions pour le livreur (optionnel)" className={`w-full border rounded-xl px-4 py-3 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20 ${errors.instructions ? "border-error" : "border-line"}`} />
              {errors.instructions && <p className="text-xs text-error mt-1">{errors.instructions}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface border border-line rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-txt-muted">Sous-total ({itemCount} articles)</span><span className="font-bold text-txt">{formatFcfa(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-txt-muted">Livraison</span><span className="font-bold text-txt">{formatFcfa(deliveryFee)}</span></div>
            {address.quartier && <p className="text-[11px] text-txt-muted italic">Frais calculés pour {address.quartier}</p>}
            <div className="flex justify-between text-base font-extrabold border-t border-line pt-2"><span className="text-txt">Total</span><span className="text-brand">{formatFcfa(grandTotal)}</span></div>
          </div>

          <button onClick={submitOrder} disabled={submitting} className="w-full bg-brand text-white py-4 rounded-xl font-extrabold text-base disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-brand-700 transition">
            {submitting ? "Commande en cours…" : "Passer la commande"}
          </button>
        </div>
      </div>

      {/* ── Zone Picker Modal ── */}
      {showZonePicker && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowZonePicker(false)}>
          <div className="bg-surface rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-bold text-txt">Choisissez votre quartier</p>
              <button onClick={() => setShowZonePicker(false)} className="p-1"><X className="w-5 h-5 text-txt-muted" /></button>
            </div>

            {zonesWithArrondissements.length > 0 ? (
              <div className="flex-1 overflow-y-auto p-2">
                {zonesWithArrondissements.map((zone) => (
                  <div key={zone.id} className="mb-3">
                    <div className="px-4 py-2">
                      <p className="text-xs font-extrabold text-brand uppercase tracking-wider">{zone.label}</p>
                    </div>
                    {zone.quartiers.map((q) => (
                      <button
                        key={q.name}
                        onClick={() => handleSelectZone(q.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${address.quartier === q.name ? "bg-brand-50 text-brand" : "hover:bg-gray-50"}`}
                      >
                        <span className="text-sm font-semibold text-txt">{q.name}</span>
                        <span className="text-xs font-bold text-brand">{formatFcfa(q.price)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-txt-muted text-center mb-3">Saisissez votre quartier manuellement :</p>
                <input type="text" value={address.quartier} onChange={(e) => setAddress((p) => ({ ...p, quartier: sanitizeText(e.target.value) }))} placeholder="Ex: Bacongo, Poto-Poto…" maxLength={80} className="w-full border border-line rounded-xl px-4 py-3 text-sm bg-surface outline-none focus:ring-2 focus:ring-brand/20" />
                <button onClick={() => setShowZonePicker(false)} className="w-full mt-3 bg-brand text-white py-3 rounded-xl font-bold text-sm">Valider</button>
              </div>
            )}

            <div className="p-3 border-t border-line text-center">
              <p className="text-[11px] text-txt-muted">Les frais de livraison dépendent de votre zone.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
