import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, Truck, MapPin, Package, AlertTriangle, Store, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { resolveImageUrl, resolveEnterpriseImage } from "../lib/images";
import { ProductCardImage } from "../components/ProductCardImage";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/** Heure courante en timezone Brazzaville (UTC+1). Les horaires des
 *  commerces sont en heure locale Brazzaville, pas en UTC. */
function nowBrazza(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + 1 * 60_000); // UTC+1
}

function isEnterpriseOpen(ent: any): { ouvert: boolean; message: string } {
  // Priorité aux flags serveur si déjà calculés.
  if (ent.ouvert === false) return { ouvert: false, message: ent.message_fermeture || "Fermé" };
  if (ent.accepte_commandes === false) return { ouvert: false, message: ent.message_fermeture || "Ne prend plus de commandes" };
  if (ent.peut_commander_maintenant === false) return { ouvert: false, message: ent.message_commande || "Trop tard pour commander" };
  // Recalcul local si horaires disponibles (évite le cache figé côté serveur).
  if (ent.horaires && ent.horaires.length > 0) {
    const now = nowBrazza();
    const todayIdx = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const todayPlages = ent.horaires.filter((h: any) => Number(h.jour) === todayIdx);
    const open = todayPlages.some((p: any) => {
      const [sh, sm] = (p.ouverture || '').split(':').map(Number);
      const [eh, em] = (p.fermeture || '').split(':').map(Number);
      if (isNaN(sh) || isNaN(eh)) return false;
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return end > start ? nowMin >= start && nowMin < end : nowMin >= start || nowMin < end;
    });
    if (!open) {
      // Chercher la prochaine ouverture
      for (let off = 0; off <= 7; off++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
        const plages = ent.horaires
          .filter((h: any) => Number(h.jour) === d.getDay())
          .map((p: any) => { const [h, m] = (p.ouverture || '').split(':').map(Number); return h * 60 + m; })
          .filter((m: number) => !isNaN(m))
          .filter((m: number) => off === 0 ? m > nowMin : true)
          .sort((a: number, b: number) => a - b);
        if (plages.length > 0) {
          const h = Math.floor(plages[0] / 60);
          const m = plages[0] % 60;
          const label = off === 0 ? `aujourd'hui à ${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`
            : off === 1 ? `demain à ${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`
            : `${JOURS[d.getDay()]} à ${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
          return { ouvert: false, message: `Fermé · rouvre ${label}` };
        }
      }
      return { ouvert: false, message: "Fermé" };
    }
    return { ouvert: true, message: ent.prochaine_ouverture ? `Réouvre à ${ent.prochaine_ouverture}` : "" };
  }
  // Fallback : flags serveur.
  if (ent.est_ouvert_maintenant === false) return { ouvert: false, message: ent.message_fermeture || "Fermé pour le moment" };
  return { ouvert: true, message: ent.prochaine_ouverture ? `Réouvre à ${ent.prochaine_ouverture}` : "" };
}

export function MarketplacePage() {
  const { enterpriseId } = useParams();
  const navigate = useNavigate();

  const { data: enterprise, isLoading: loadingEnt, error: entError } = useQuery({
    queryKey: ["enterprise", enterpriseId],
    queryFn: () => apiFetch(`/api/enterprises/${enterpriseId}`),
    enabled: !!enterpriseId,
    staleTime: 60_000,
    refetchInterval: 120_000, // recalcul ouvert/fermé toutes les 2 min
    retry: 2,
  });

  const { data: products = [], isLoading: loadingProds } = useQuery({
    queryKey: ["products", enterpriseId],
    queryFn: () => apiFetch(`/api/products/enterprise/${enterpriseId}`),
    enabled: !!enterpriseId,
    staleTime: 60_000,
  });

  const ent = enterprise as any;
  const productList = Array.isArray(products) ? products : [];
  const openStatus = ent ? isEnterpriseOpen(ent) : null;

  // ── Loading skeleton ──
  if (loadingEnt) {
    return (
      <div className="w-full px-4 py-6 space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="w-full h-48 bg-gray-200 rounded-2xl" />
        <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-line rounded-xl overflow-hidden animate-pulse">
              <div className="w-full aspect-square bg-gray-200" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (entError || !ent) {
    return (
      <div className="w-full px-4 text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-error" />
        </div>
        <h2 className="text-lg font-extrabold text-txt mb-1">Commerce introuvable</h2>
        <p className="text-sm text-txt-muted mb-6">
          {entError ? "Ce commerce n'existe pas ou n'est plus disponible." : "Commerce introuvable."}
        </p>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-full text-sm font-bold hover:bg-brand-700 transition">
          <ArrowLeft size={16} /> Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-5 max-w-[1100px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-txt-muted hover:text-txt transition">
        <ArrowLeft size={16} /> <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Cover */}
      <div className="w-full h-48 bg-brand-50 rounded-2xl overflow-hidden">
        {resolveEnterpriseImage(ent) ? (
          <img src={resolveEnterpriseImage(ent)!} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand/20 text-6xl font-bold">
            {(ent.nom || "?")[0]}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-txt">{ent.nom}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <span className="text-xs font-bold text-txt-muted bg-gray-100 px-2 py-0.5 rounded-full capitalize flex items-center gap-1">
                {ent.type === "restaurant" ? <UtensilsCrossed size={10} /> : <ShoppingBag size={10} />}
                {ent.type}
              </span>
              {ent.categorie_nom && <span className="text-xs text-txt-muted">{ent.categorie_nom}</span>}
              {ent.note_moyenne != null && ent.note_moyenne > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-accent-600">
                  <Star size={11} className="fill-accent-500 text-accent-500" /> {Number(ent.note_moyenne).toFixed(1)}
                  {ent.nb_avis && <span className="text-txt-muted">({ent.nb_avis})</span>}
                </span>
              )}
            </div>
          </div>
          {/* Open/Closed badge */}
          {openStatus && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex-shrink-0 ${openStatus.ouvert ? "bg-brand/10 text-brand" : "bg-error/10 text-error"}`}>
              {openStatus.ouvert ? "Ouvert" : "Fermé"}
            </div>
          )}
        </div>

        {/* Open message (when closed) */}
        {openStatus && !openStatus.ouvert && openStatus.message && (
          <p className="text-xs text-error/80 italic">{openStatus.message}</p>
        )}

        {ent.description && <p className="text-sm text-txt-secondary leading-relaxed">{ent.description}</p>}

        {ent.adresse && (
          <div className="flex items-center gap-2 text-xs text-txt-muted">
            <MapPin size={14} className="text-brand flex-shrink-0" /> {ent.adresse}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-txt-muted">
          <span className="flex items-center gap-1"><Truck size={14} className="text-brand" /> Livraison selon zone</span>
          {ent.delai_preparation_min != null && (
            <span className="flex items-center gap-1"><Clock size={14} className="text-brand" /> ~{ent.delai_preparation_min} min</span>
          )}
        </div>
      </div>

      {/* ── Horaires ── */}
      {ent.horaires && ent.horaires.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-4">
          <h3 className="text-sm font-bold text-txt mb-2 flex items-center gap-2">
            <Clock size={16} className="text-brand" /> Horaires d'ouverture
          </h3>
          <div className="space-y-1.5">
            {ent.horaires.map((h: any) => {
              const jour = JOURS[h.jour] || `Jour ${h.jour}`;
              const today = new Date().getDay() === h.jour;
              return (
                <div key={h.jour} className={`flex items-center justify-between text-xs py-1 ${today ? "font-bold text-brand" : "text-txt-muted"}`}>
                  <span>{jour}</span>
                  <span>{h.ouverture && h.fermeture ? `${h.ouverture} – ${h.fermeture}` : "Fermé"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <h2 className="text-xl font-extrabold text-txt mb-4">
          {loadingProds ? (
            <span className="text-txt-muted">Chargement…</span>
          ) : `Produits (${productList.length})`}
        </h2>
        {productList.length === 0 && !loadingProds ? (
          <div className="text-center py-12 text-txt-muted bg-surface border border-line rounded-2xl">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun produit disponible</p>
          </div>
        ) : (
          <div className="w-full min-w-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-3">
            {productList.map((p: any) => (
              <Link
                key={p.id}
                to={`/product/${p.id}?enterprise=${enterpriseId}`}
                className="group bg-surface rounded-xl overflow-hidden border border-line/50 hover:shadow-md hover:border-brand/20 transition-all duration-200"
              >
                <div className="w-full aspect-square bg-brand-50 flex items-center justify-center overflow-hidden relative">
                  <ProductCardImage product={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {p.prix_promo != null && Number(p.prix_promo) < Number(p.prix) && (
                    <span className="absolute top-1.5 left-1.5 bg-error text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      -{Math.round((1 - Number(p.prix_promo) / Number(p.prix)) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-txt truncate leading-tight">{p.nom}</p>
                  <span className="text-xs font-extrabold text-brand mt-1 block">{formatFcfa(Number(p.prix_promo ?? p.prix))}</span>
                  {p.prix_promo != null && Number(p.prix_promo) < Number(p.prix) && (
                    <span className="text-[10px] text-txt-muted line-through">{formatFcfa(Number(p.prix))}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
