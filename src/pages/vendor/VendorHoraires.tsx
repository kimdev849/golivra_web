import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getSessionToken } from "../../lib/api";
import { useEffect, useState } from "react";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { useVendorCtx } from "./VendorLayout";

interface Horaire {
  jour: number;
  ouverture: string;
  fermeture: string;
}

const JOURS_NUM = [1, 2, 3, 4, 5, 6, 0]; // Lundi=1 … Dimanche=0 (JS Date)
const JOURS_LABEL: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  0: "Dimanche",
};

function defaultHoraires(): Horaire[] {
  return JOURS_NUM.map((j) => ({
    jour: j,
    ouverture: j === 0 ? "" : "09:00",
    fermeture: j === 0 ? "" : "21:00",
  }));
}

export function VendorHoraires() {
  const queryClient = useQueryClient();
  const { shop } = useVendorCtx();
  const enterpriseId = shop?.id;

  const { data: serverHoraires, isLoading } = useQuery<Horaire[]>({
    queryKey: ["vendor-horaires", enterpriseId],
    queryFn: async () => {
      if (!enterpriseId) return defaultHoraires();
      const token = getSessionToken();
      if (!token) return defaultHoraires();
      const res = await apiFetch<{ horaires: Horaire[] }>(`/api/enterprises/${enterpriseId}/horaires`, {
        method: "GET",
        token,
      });
      return Array.isArray(res?.horaires) ? res.horaires : [];
    },
    enabled: !!enterpriseId,
  });

  const [editHoraires, setEditHoraires] = useState<Horaire[]>(defaultHoraires());
  const [initialized, setInitialized] = useState(false);

  // Sync local state from server data when query resolves
  useEffect(() => {
    if (serverHoraires === undefined) return; // still loading
    const saved = serverHoraires;
    if (saved.length > 0) {
      // Merge saved data into defaults (preserves all days)
      const defaults = defaultHoraires();
      const merged = defaults.map((d) => {
        const found = saved.find((s) => s.jour === d.jour);
        return found ? { ...d, ouverture: found.ouverture, fermeture: found.fermeture } : d;
      });
      setEditHoraires(merged);
    } else {
      setEditHoraires(defaultHoraires());
    }
    setInitialized(true);
  }, [serverHoraires]);

  const saveMutation = useMutation({
    mutationFn: async (data: Horaire[]) => {
      if (!enterpriseId) throw new Error("Commerce introuvable.");
      const token = getSessionToken();
      if (!token) throw new Error("Session expirée.");
      // Filter out days with empty hours (closed days)
      const horaires = data.filter((h) => h.ouverture && h.fermeture);
      return apiFetch(`/api/enterprises/${enterpriseId}/horaires`, {
        method: "PUT",
        token,
        jsonBody: { horaires },
      });
    },
    onSuccess: () => { toast.success("Horaires sauvegardés"); queryClient.invalidateQueries({ queryKey: ["vendor-horaires"] }); },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  // Toggle open/closed for a day (clears or sets hours)
  const toggleFermee = (jour: number) => {
    setEditHoraires((prev) =>
      prev.map((h) => {
        if (h.jour !== jour) return h;
        const isClosed = !h.ouverture && !h.fermeture;
        return isClosed ? { ...h, ouverture: "09:00", fermeture: "21:00" } : { ...h, ouverture: "", fermeture: "" };
      })
    );
  };

  const updateHoraire = (jour: number, field: "ouverture" | "fermeture", value: string) => {
    setEditHoraires((prev) => prev.map((h) => (h.jour === jour ? { ...h, [field]: value } : h)));
  };

  const isClosed = (h: Horaire) => !h.ouverture && !h.fermeture;

  if (!enterpriseId) {
    return <p className="text-sm text-gray-500">Aucun commerce trouvé.</p>;
  }

  const todayIdx = new Date().getDay(); // 0=Dim, 1=Lun …

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Horaires d'ouverture</h2>
          <p className="text-xs text-gray-500 mt-0.5">Vos clients ne peuvent commander que pendant ces horaires.</p>
        </div>
        <button
          onClick={() => saveMutation.mutate(editHoraires)}
          disabled={saveMutation.isPending || !initialized}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand/90 transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-[3px] border-t-transparent border-brand rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {editHoraires.map((h) => (
            <div key={h.jour} className={`bg-white rounded-xl border p-4 ${isClosed(h) ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{JOURS_LABEL[h.jour]}</span>
                  {h.jour === todayIdx && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand/10 text-brand">Aujourd'hui</span>
                  )}
                </div>
                <button
                  onClick={() => toggleFermee(h.jour)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition ${isClosed(h) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                >
                  {isClosed(h) ? "Fermé" : "Ouvert"}
                </button>
              </div>
              {!isClosed(h) && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={h.ouverture}
                      onChange={(e) => updateHoraire(h.jour, "ouverture", e.target.value)}
                      className="text-sm border rounded-lg px-2 py-1"
                    />
                  </div>
                  <span className="text-gray-400">→</span>
                  <input
                    type="time"
                    value={h.fermeture}
                    onChange={(e) => updateHoraire(h.jour, "fermeture", e.target.value)}
                    className="text-sm border rounded-lg px-2 py-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
