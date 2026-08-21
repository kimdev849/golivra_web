import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Horaire {
  jour: string;
  ouverture: string;
  fermeture: string;
  fermee: boolean;
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function defaultHoraires(): Horaire[] {
  return JOURS.map((j) => ({ jour: j, ouverture: "08:00", fermeture: "18:00", fermee: false }));
}

export function VendorHoraires() {
  const queryClient = useQueryClient();
  const { data: horaires = defaultHoraires() } = useQuery<Horaire[]>({
    queryKey: ["vendor-horaires"],
    queryFn: () => apiFetch("/api/enterprises/mine"),
  });

  const [editHoraires, setEditHoraires] = useState<Horaire[]>(horaires);

  const saveMutation = useMutation({
    mutationFn: (data: Horaire[]) => apiFetch("/api/enterprises/mine", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { toast.success("Horaires sauvegardés"); queryClient.invalidateQueries({ queryKey: ["vendor-horaires"] }); },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const toggleFermee = (index: number) => {
    setEditHoraires((prev) => prev.map((h, i) => i === index ? { ...h, fermee: !h.fermee } : h));
  };

  const updateHoraire = (index: number, field: "ouverture" | "fermeture", value: string) => {
    setEditHoraires((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Horaires d'ouverture</h2>
        <button
          onClick={() => saveMutation.mutate(editHoraires)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand/90 transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      <div className="space-y-3">
        {editHoraires.map((h, i) => (
          <div key={h.jour} className={`bg-white rounded-xl border p-4 ${h.fermee ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">{h.jour}</span>
              <button
                onClick={() => toggleFermee(i)}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition ${h.fermee ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
              >
                {h.fermee ? "Fermé" : "Ouvert"}
              </button>
            </div>
            {!h.fermee && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={h.ouverture}
                    onChange={(e) => updateHoraire(i, "ouverture", e.target.value)}
                    className="text-sm border rounded-lg px-2 py-1"
                  />
                </div>
                <span className="text-gray-400">→</span>
                <input
                  type="time"
                  value={h.fermeture}
                  onChange={(e) => updateHoraire(i, "fermeture", e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
