import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, getSessionToken } from "../lib/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Bike, CheckCircle2, ChefHat, Clock, MapPin, Package,
  PhoneCall, ShoppingBag, Star, AlertTriangle, Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function formatHeure(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return null; }
}

function remainingSeconds(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return null;
  return Math.max(0, Math.ceil((at - nowMs) / 1000));
}

function remainingUntil(iso: string | null | undefined, nowMs: number): number | null {
  const s = remainingSeconds(iso, nowMs);
  return s == null ? null : Math.ceil(s / 60);
}

function mmss(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stepperPosition(statut: string): { done: number; active: number } {
  switch (statut) {
    case "livree": return { done: 4, active: -1 };
    case "en_livraison": return { done: 2, active: 2 };
    case "prete": case "collectee": return { done: 2, active: 2 };
    case "en_preparation": case "a_preparer": return { done: 1, active: 1 };
    case "acceptee": case "partiellement_acceptee": return { done: 1, active: 1 };
    case "en_attente": return { done: 0, active: 0 };
    default: return { done: 0, active: 0 };
  }
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente", commande_creee: "Commande créée", acceptee: "Acceptée",
  en_preparation: "En préparation", prete: "Prête", en_livraison: "En livraison",
  livree: "Livrée", annulee: "Annulée", refusee: "Refusée", remboursee: "Remboursée",
};

const STEPS = [
  { key: "commande", label: "Commande", icon: ShoppingBag },
  { key: "preparation", label: "Préparation", icon: ChefHat },
  { key: "route", label: "En route", icon: Bike },
  { key: "livree", label: "Livrée", icon: CheckCircle2 },
];

function PollingInterval(statut: string): number | false {
  switch (statut) {
    case "en_attente": return 5_000;
    case "acceptee": case "partiellement_acceptee": return 5_000;
    case "en_preparation": case "a_preparer": return 10_000;
    case "prete": case "en_livraison": return 8_000;
    case "livree": case "annulee": case "refusee": case "remboursee": return false;
    default: return 15_000;
  }
}

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = getSessionToken();
  const [now, setNow] = useState(Date.now());
  const [payMethod, setPayMethod] = useState<"airtel" | "mtn">("airtel");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiFetch(`/api/orders/${orderId}`, { token: token! }),
    enabled: !!orderId && !!token,
    refetchInterval: (query) => {
      const o = query.state.data as any;
      return o ? PollingInterval(o.statut) : 10_000;
    },
    staleTime: 3_000,
    retry: 2,
  });

  // Live clock for countdowns
  useEffect(() => {
    const o = order as any;
    const active = o?.statut && !["livree", "annulee", "remboursee", "expiree"].includes(o.statut);
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [(order as any)?.statut]);

  const payNow = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/orders/${orderId}/pay`, { method: "POST", token: token!, jsonBody: { provider: payMethod } });
    },
    onSuccess: () => toast.success("Paiement demandé ! Vérifiez votre téléphone."),
    onError: (e: any) => toast.error(e?.message || "Paiement impossible."),
  });

  const cancelOrder = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/orders/${orderId}/cancel`, { method: "POST", token: token! });
    },
    onSuccess: () => toast.success("Commande annulée."),
    onError: () => toast.error("Impossible d'annuler."),
  });

  const o = order as any;
  const isDelivered = o?.statut === "livree";
  const isCancelled = o?.statut === "annulee" || o?.statut === "refusee" || o?.statut === "remboursee";
  const { done: doneSteps, active: activeStep } = stepperPosition(o?.statut ?? "");
  const eta = o?.eta;
  const arriveeLabel = formatHeure(eta?.arriveeEstimeeAt);
  const restantMin = remainingUntil(eta?.arriveeEstimeeAt, now);
  const allArticles = (o?.sousCommandes || []).flatMap((sc: any) => sc.articles || []);
  const refuseeSc = (o?.sousCommandes || []).find((sc: any) => sc.statut === "refusee");

  // Countdowns for active states
  const acceptRemaining = remainingSeconds(o?.acceptation_limite_at, now);
  const payRemaining = remainingSeconds(o?.paiement_limite_at, now);
  const acceptCountdown = acceptRemaining == null ? null : mmss(acceptRemaining);
  const payCountdown = payRemaining == null ? null : mmss(payRemaining);
  const paymentExpired = payRemaining === 0;

  const waitingConfirmation = o?.statut === "en_attente";
  const readyToPay = !o?.paiement_statut && (o?.statut === "acceptee" || o?.statut === "partiellement_acceptee");

  const headerPill = (() => {
    if (isDelivered) return { label: "Livrée", bg: "bg-brand-50", txt: "text-brand" };
    if (isCancelled) return { label: "Annulée", bg: "bg-error/10", txt: "text-error" };
    if (o?.statut === "en_livraison") return { label: "En route", bg: "bg-brand-50", txt: "text-brand" };
    if (waitingConfirmation) return { label: "En attente", bg: "bg-accent/10", txt: "text-accent-deep" };
    if (readyToPay) return { label: "À payer", bg: "bg-brand-50", txt: "text-brand" };
    return { label: STATUT_LABELS[o?.statut] || "En cours", bg: "bg-surface-muted", txt: "text-txt-secondary" };
  })();

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error || !o) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-error" />
        </div>
        <h2 className="text-lg font-extrabold text-txt mb-1">Commande introuvable</h2>
        <p className="text-sm text-txt-muted mb-6">Cette commande n'existe pas ou n'est plus disponible.</p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-full text-sm font-bold">
          <ArrowLeft size={16} /> Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-brand-50 transition">
          <ArrowLeft size={20} className="text-txt" />
        </button>
        <h1 className="flex-1 text-base font-bold text-txt text-center">
          {isDelivered ? "Détails de commande" : "Suivi de commande"}
        </h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${headerPill.bg} ${headerPill.txt}`}>{headerPill.label}</span>
      </div>

      {/* ── Hero card (live tracking) ── */}
      {!isDelivered && !isCancelled && (
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #0C4F36 0%, #0B6B45 100%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold opacity-90">
                {o?.statut === "en_livraison" ? "En direct" : "Suivi en direct"}
              </span>
            </div>
            {o?.statut === "en_livraison" && restantMin != null && (
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">~{restantMin}</span>
                  <span className="text-xs font-bold opacity-80">min</span>
                </div>
                <span className="text-[11px] opacity-70">Arrivée estimée</span>
              </div>
            )}
          </div>

          <h2 className="text-xl font-extrabold mb-1">
            {o?.statut === "en_livraison" ? "En route vers vous" : waitingConfirmation ? "Commande envoyée" : "Commande confirmée"}
          </h2>
          <p className="text-sm opacity-80">
            {o?.statut === "en_livraison"
              ? arriveeLabel ? `Arrivée vers ${arriveeLabel}` : "Votre livreur est en chemin"
              : waitingConfirmation
                ? `Envoyée au${allArticles.length > 0 ? "x" : ""} commerce${allArticles.length > 0 ? "s" : ""}`
                : eta?.totalMinutes != null ? `Arrivée estimée dans ~${eta.totalMinutes} min` : "Préparation en cours…"}
          </p>

          {/* Acceptance countdown */}
          {waitingConfirmation && acceptCountdown && (
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-yellow-300" />
                <span className="text-xs font-bold text-yellow-200">En attente de confirmation</span>
              </div>
              <p className="text-2xl font-extrabold">{acceptCountdown}</p>
              <p className="text-[11px] opacity-70 mt-1">Pas d'inquiétude, vous ne serez débité qu'après l'acceptation.</p>
            </div>
          )}

          {/* Payment countdown */}
          {readyToPay && payCountdown && (
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-yellow-300" />
                <span className={`text-xs font-bold ${paymentExpired ? "text-red-300" : "text-yellow-200"}`}>
                  {paymentExpired ? "Délai expiré" : `Il vous reste ${payCountdown}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stepper ── */}
      {!isDelivered && !isCancelled && (
        <div className="bg-surface border border-line rounded-2xl p-5">
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const done = idx < doneSteps;
              const active = idx === activeStep;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${done ? "bg-brand text-white" : active ? "bg-brand text-white animate-pulse" : "bg-surface-muted text-txt-muted border border-line"}`}>
                      <Icon size={18} strokeWidth={done || active ? 2.5 : 1.8} />
                    </div>
                    <span className={`text-[10px] font-semibold ${done || active ? "text-brand" : "text-txt-muted"}`}>{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mt-[-18px] rounded ${idx < doneSteps ? "bg-brand" : "bg-line"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment card ── */}
      {readyToPay && (
        <div className="bg-surface border border-brand rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center"><Smartphone size={20} className="text-brand" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-txt">Confirmer le paiement</p>
              <p className="text-xs text-txt-muted">{formatFcfa(o?.total_a_payer || 0)} — demandez sur votre téléphone</p>
            </div>
          </div>
          <div className="flex gap-2">
            {([{ id: "airtel", label: "Airtel Money" }, { id: "mtn", label: "MTN MoMo" }] as const).map((m) => (
              <button key={m.id} onClick={() => setPayMethod(m.id)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${payMethod === m.id ? "bg-brand text-white border-brand" : "bg-surface text-txt border-line"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <button onClick={() => payNow.mutate()} disabled={payNow.isPending || paymentExpired} className="w-full bg-brand text-white py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-50">
            {payNow.isPending ? "Paiement…" : paymentExpired ? "Délai expiré" : "Payer ma commande"}
          </button>
          <button onClick={() => { if (confirm("Annuler cette commande ?")) cancelOrder.mutate(); }} className="w-full text-center text-sm text-error font-semibold py-2">Annuler la commande</button>
        </div>
      )}

      {/* ── Cancelled ── */}
      {isCancelled && (
        <div className="bg-surface border border-error/20 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} className="text-error" />
          </div>
          <h3 className="font-extrabold text-txt mb-1">Commande {o?.statut === "refusee" ? "refusée" : "annulée"}</h3>
          {refuseeSc?.raison_refus && <p className="text-sm text-txt-muted">{refuseeSc.raison_refus}</p>}
          {o?.annulation_motif && <p className="text-sm text-txt-muted">{o.annulation_motif}</p>}
          <Link to="/" className="inline-block mt-4 bg-brand text-white px-6 py-2.5 rounded-xl text-sm font-bold">Retour à l'accueil</Link>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="bg-surface border border-line rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between"><span className="text-sm font-semibold text-txt">Référence</span><span className="text-sm text-txt-muted font-mono">#{(o?.id || "").slice(0, 8)}</span></div>
        {o?.adresse_livraison && <div className="flex items-start gap-2"><MapPin size={16} className="text-brand mt-0.5 flex-shrink-0" /><span className="text-sm text-txt">{o.adresse_livraison}</span></div>}
        {o?.cree_le && <div className="flex items-center justify-between text-sm"><span className="text-txt-muted">Passée le</span><span className="text-txt">{formatDate(o.cree_le)}</span></div>}
        {o?.total != null && <div className="flex items-center justify-between text-sm font-extrabold border-t border-line pt-3"><span className="text-txt">Total</span><span className="text-brand">{formatFcfa(o.total)}</span></div>}
      </div>

      {/* ── Courier ── */}
      {o?.livreur && (
        <div className="bg-surface border border-line rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Bike size={18} className="text-brand" /><span className="text-sm font-bold text-txt">Votre livreur</span></div>
            {o?.statut === "en_livraison" && (
              <span className="flex items-center gap-1 text-xs font-bold text-brand"><span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> En route</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden">
              {o.livreur.image_url ? <img src={o.livreur.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-brand text-xl font-black">{o.livreur.nom?.[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-txt">{o.livreur.nom}</p>
              <div className="flex items-center gap-1"><Star size={12} className="text-accent fill-accent" /><span className="text-xs text-txt-muted">{o.livreur.note_moyenne || "Nouveau"}</span></div>
            </div>
            {o.livreur.telephone && (
              <a href={`tel:${o.livreur.telephone.replace(/[^+\d]/g, "")}`} className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition">
                <PhoneCall size={20} className="text-brand" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Articles ── */}
      {allArticles.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Package size={18} className="text-brand" /><span className="text-sm font-bold text-txt">Articles</span></div>
          <div className="space-y-2">
            {allArticles.map((a: any, idx: number) => (
              <div key={`${a.id}-${idx}`} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-brand w-6 text-center">{a.quantite}×</span>
                  <span className="text-sm text-txt truncate">{a.nom}</span>
                </div>
                <span className="text-sm font-semibold text-txt ml-2">{formatFcfa(a.prix_unitaire * a.quantite)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {o?.timeline?.livraisons?.[0]?.timeline?.length ? (
        <div className="bg-surface border border-line rounded-2xl p-4">
          <h3 className="text-sm font-bold text-txt mb-3">Historique</h3>
          <div className="space-y-3">
            {o.timeline.livraisons[0].timeline.map((step: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-brand" : "bg-gray-300"}`} />
                  {idx < o.timeline.livraisons[0].timeline.length - 1 && <div className="w-px h-6 bg-line mt-1" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-txt">{step.titre}</p>
                  {step.date && <p className="text-xs text-txt-muted">{formatDate(step.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
