import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";
import { Search, Star, X, UtensilsCrossed, ShoppingBag, Store, MapPin, Clock } from "lucide-react";
import { useState } from "react";

type FilterType = "all" | "restaurant" | "boutique";

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }

export function ExplorePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<FilterType>("all");

  const { data: enterprises = [], isLoading } = useQuery({
    queryKey: ["explore-enterprises", type, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      if (search.trim()) params.set("q", search.trim());
      return apiFetch(`/api/enterprises?${params.toString()}`);
    },
    staleTime: 60_000,
  });

  const list = Array.isArray(enterprises) ? enterprises : [];

  // Stats
  const restaurantCount = list.filter((e: any) => e.type === "restaurant").length;
  const boutiqueCount = list.filter((e: any) => e.type === "boutique").length;

  return (
    <div className="space-y-4">
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
      <div className="flex gap-2">
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

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Enterprise list (larger cards than Home, more detail) ── */}
      {!isLoading && list.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun commerce trouvé</p>
          <p className="text-sm mt-1">Essayez un autre terme de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e: any) => (
            <Link
              key={e.id}
              to={`/marketplace/${e.id}`}
              className="flex gap-3 bg-surface border border-line rounded-2xl p-4 hover:shadow-md transition"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {e.image_url ? (
                  <img src={e.image_url} alt="" className="w-full h-full object-cover" />
                ) : e.type === "restaurant" ? (
                  <UtensilsCrossed size={22} className="text-brand/30" />
                ) : (
                  <ShoppingBag size={22} className="text-brand/30" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-txt truncate">{e.nom}</p>
                  {e.ouvert === false && (
                    <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Fermé</span>
                  )}
                </div>
                <p className="text-xs text-txt-muted truncate">
                  {[e.categorie_nom, e.description].filter(Boolean).join(" · ")}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {e.note_moyenne != null && e.note_moyenne > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-accent-600">
                      <Star size={11} className="fill-accent-500 text-accent-500" />
                      {Number(e.note_moyenne).toFixed(1)}
                      {e.nb_avis && <span className="text-txt-muted font-normal">({e.nb_avis})</span>}
                    </span>
                  )}
                  {e.adresse && (
                    <span className="flex items-center gap-0.5 text-[11px] text-txt-muted">
                      <MapPin size={11} /> {e.adresse.length > 25 ? e.adresse.slice(0, 25) + "…" : e.adresse}
                    </span>
                  )}

                  {e.delai_preparation_min != null && (
                    <span className="flex items-center gap-0.5 text-[11px] text-txt-muted">
                      <Clock size={11} /> ~{e.delai_preparation_min} min
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
