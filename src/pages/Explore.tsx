import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";
import { Search, Star, X, UtensilsCrossed, ShoppingBag, Store, MapPin, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { resolveEnterpriseImage } from "../lib/images";

type FilterType = "all" | "restaurant" | "boutique";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

type SortType = "popular" | "rated" | "recent";

export function ExplorePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("popular");

  const { data: enterprises = [], isLoading } = useQuery({
    queryKey: ["explore-enterprises", type, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      if (search.trim()) params.set("q", search.trim());
      return apiFetch(`/api/enterprises?${params.toString()}`);
    },
    staleTime: 60_000,
    refetchInterval: 120_000, // recalcul ouvert/fermé toutes les 2 min
  });

  const rawList = Array.isArray(enterprises) ? enterprises : [];

  // Sort
  const list = useMemo(() => {
    const copy = [...rawList];
    if (sort === "popular") copy.sort((a: any, b: any) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0) || (b.nb_avis ?? 0) - (a.nb_avis ?? 0));
    if (sort === "rated") copy.sort((a: any, b: any) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0) || (b.nb_avis ?? 0) - (a.nb_avis ?? 0));
    if (sort === "recent") copy.sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    return copy;
  }, [rawList, sort]);

  // Stats
  const restaurantCount = rawList.filter((e: any) => e.type === "restaurant").length;
  const boutiqueCount = rawList.filter((e: any) => e.type === "boutique").length;

  return (
    <div className="space-y-4 page-contained">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-xl font-extrabold text-txt">Explorer</h1>
        <p className="text-sm text-txt-muted mt-0.5">Découvrez les commerces autour de vous</p>
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 bg-surface-muted border border-line rounded-xl px-4 py-3">
        <Search size={17} className="text-txt-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un commerce…"
          className="flex-1 bg-transparent text-sm text-txt placeholder-txt-muted"
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X size={16} className="text-txt-muted" />
          </button>
        )}
      </div>

      {/* ── Type filters ── */}
      <div className="flex flex-wrap gap-2">
        {([
          ["all", "Tous", list.length],
          ["restaurant", "Restaurants", restaurantCount],
          ["boutique", "Boutiques", boutiqueCount],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setType(key)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
              type === key
                ? "bg-brand text-white border-brand"
                : "bg-surface text-txt border-line hover:bg-brand-50"
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1 text-[10px] ${type === key ? "opacity-80" : "text-txt-muted"}`}>
                ({count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sort row ── */}
      <div className="flex flex-wrap gap-2">
        {([
          ["popular", "Plus populaires"],
          ["rated", "Mieux notés"],
          ["recent", "Plus récents"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
              sort === key
                ? "bg-brand text-white border-brand"
                : "bg-surface text-txt border-line hover:bg-brand-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Enterprise list ── */}
      {!isLoading && list.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun commerce trouvé</p>
          <p className="text-sm mt-1">Essayez un autre terme de recherche.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          {list.map((e: any) => (
            <Link
              key={e.id}
              to={`/marketplace/${e.id}`}
              className="group flex gap-3.5 bg-surface border border-line/50 rounded-2xl p-4 hover:shadow-lg hover:border-brand/20 transition-all duration-200"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex-shrink-0 overflow-hidden">
                {resolveEnterpriseImage(e) ? (
                  <img src={resolveEnterpriseImage(e)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : e.type === "restaurant" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed size={24} className="text-brand/30" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={24} className="text-brand/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-txt truncate leading-tight">{e.nom}</p>
                  {(e.est_ouvert_maintenant === false || (e.est_ouvert_maintenant == null && e.ouvert === false)) && (
                    <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-full flex-shrink-0">Fermé</span>
                  )}
                </div>
                <p className="text-xs text-txt-muted truncate mt-0.5">
                  {[e.categorie_nom, e.description].filter(Boolean).join(" · ")}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5">
                  {e.note_moyenne != null && e.note_moyenne > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold">
                      <Star size={12} className="fill-[var(--accent)] text-[var(--accent)]" />
                      <span className="text-txt">{Number(e.note_moyenne).toFixed(1)}</span>
                      {e.nb_avis && <span className="text-txt-muted font-normal">({e.nb_avis})</span>}
                    </span>
                  )}
                  {e.adresse && (
                    <span className="flex items-center gap-0.5 text-[11px] text-txt-muted">
                      <MapPin size={11} className="flex-shrink-0" /> <span className="truncate">{e.adresse.length > 22 ? e.adresse.slice(0, 22) + "…" : e.adresse}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
