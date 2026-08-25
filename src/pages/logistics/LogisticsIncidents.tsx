import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../store";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  User,
  Truck,
  Package,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Shield,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
type RiskLevel = "NORMAL" | "A_SURVEILLER" | "RETARD" | "INCIDENT" | "CRITIQUE";
type IncidentLevel = "niveau_1" | "niveau_2" | "niveau_3" | null;

interface IncidentDelivery {
  id: string;
  statut: string;
  type_livraison: string;
  created_at: string;
  attribuee_at?: string;
  collectee_at?: string;
  livree_at?: string;
  montant_total?: number;
  note?: string;
  livreur?: {
    id: string;
    nom: string;
    telephone?: string;
    type_vehicule?: string;
    position?: { latitude: number; longitude: number; at?: string } | null;
    derniere_activite_at?: string;
  } | null;
  client?: {
    nom?: string;
    telephone?: string;
  } | null;
  commerce?: {
    id: string;
    type?: string;
    nom?: string;
    telephone?: string;
  } | null;
  adresse_livraison: string;
  adresse_retrait: string;
  delay_minutes: number;
  delay_label: string;
  risk_level: RiskLevel;
  risk_info: { label: string; color: string; emoji: string };
  incident_level: IncidentLevel;
  incident_since?: string;
  incident_reason?: string;
  last_activity_ago?: number | null;
  delay_reason?: string | null;
  delay_reason_detail?: string | null;
  timeline: Array<{
    titre: string;
    date: string;
    date_label: string;
    type: string;
    details?: string;
  }>;
  operator_actions: Array<{
    id: string;
    action: string;
    action_label: string;
    operateur_nom: string;
    details?: string;
    created_at: string;
    created_at_label: string;
  }>;
}

interface IncidentStats {
  total_incidents: number;
  niveau_1: number;
  niveau_2: number;
  niveau_3: number;
  total_active: number;
  risk_breakdown: Record<RiskLevel, number>;
}

// ── Risk level styling ─────────────────────────────────────────────────────
const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string; badge: string; emoji: string }> = {
  NORMAL:       { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-800", emoji: '🟢' },
  A_SURVEILLER: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-800", emoji: '🟡' },
  RETARD:       { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", emoji: '🟠' },
  INCIDENT:     { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-800", emoji: '🔴' },
  CRITIQUE:     { bg: "bg-red-100", text: "text-red-900", border: "border-red-300", badge: "bg-red-200 text-red-900", emoji: '🔴🔴' },
};

const INCIDENT_LEVEL_STYLES: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  niveau_1: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Retard léger", emoji: "🟡" },
  niveau_2: { bg: "bg-orange-100", text: "text-orange-800", label: "Retard significatif", emoji: "🟠" },
  niveau_3: { bg: "bg-red-100", text: "text-red-800", label: "Incident", emoji: "🔴" },
};

// ── Main Component ─────────────────────────────────────────────────────────
export function LogisticsIncidents() {
  const { session } = useAuthStore();
  const token = session?.token;
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<IncidentDelivery | null>(null);
  const [filter, setFilter] = useState<"all" | "niveau_1" | "niveau_2" | "niveau_3">("all");

  // Fetch incidents
  const { data: incidents = [], isLoading, refetch } = useQuery<IncidentDelivery[]>({
    queryKey: ["logistics-incidents"],
    queryFn: () => apiFetch("/api/logistics/incidents", { token }),
    refetchInterval: 15_000,
    enabled: !!token,
  });

  // Fetch stats
  const { data: stats } = useQuery<IncidentStats>({
    queryKey: ["logistics-incidents-stats"],
    queryFn: () => apiFetch("/api/logistics/incidents/stats", { token }),
    refetchInterval: 15_000,
    enabled: !!token,
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: ({ deliveryId, raison }: { deliveryId: string; raison: string }) =>
      apiFetch(`/api/logistics/incidents/${deliveryId}/resolve`, {
        method: "PATCH",
        token,
        jsonBody: { raison },
      }),
    onSuccess: () => {
      toast.success("Incident résolu");
      queryClient.invalidateQueries({ queryKey: ["logistics-incidents"] });
      setSelectedIncident(null);
    },
    onError: () => toast.error("Erreur lors de la résolution"),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ deliveryId, raison }: { deliveryId: string; raison: string }) =>
      apiFetch(`/api/logistics/incidents/${deliveryId}/cancel`, {
        method: "PATCH",
        token,
        jsonBody: { raison },
      }),
    onSuccess: () => {
      toast.success("Livraison annulée");
      queryClient.invalidateQueries({ queryKey: ["logistics-incidents"] });
      setSelectedIncident(null);
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  // Escalate mutation
  const escalateMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      apiFetch(`/api/logistics/incidents/${deliveryId}/escalate`, {
        method: "PATCH",
        token,
      }),
    onSuccess: () => {
      toast.success("Incident escaladé");
      queryClient.invalidateQueries({ queryKey: ["logistics-incidents"] });
    },
    onError: () => toast.error("Erreur lors de l'escalade"),
  });

  // Add note mutation
  const noteMutation = useMutation({
    mutationFn: ({ deliveryId, note }: { deliveryId: string; note: string }) =>
      apiFetch(`/api/logistics/incidents/${deliveryId}/note`, {
        method: "POST",
        token,
        jsonBody: { note },
      }),
    onSuccess: () => {
      toast.success("Note ajoutée");
      queryClient.invalidateQueries({ queryKey: ["logistics-incidents"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const filtered = filter === "all" ? incidents : incidents.filter((i) => i.incident_level === filter);

  if (selectedIncident) {
    return (
      <IncidentDetail
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onResolve={(raison) => resolveMutation.mutate({ deliveryId: selectedIncident.id, raison })}
        onCancel={(raison) => cancelMutation.mutate({ deliveryId: selectedIncident.id, raison })}
        onEscalate={() => escalateMutation.mutate(selectedIncident.id)}
        onAddNote={(note) => noteMutation.mutate({ deliveryId: selectedIncident.id, note })}
        isPending={resolveMutation.isPending || cancelMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">🚨 Centre d'Incidents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Détection → Qualification → Intervention → Résolution
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total incidents"
            value={stats.total_incidents}
            color="text-red-600"
            bgColor="bg-red-50"
            icon={<AlertTriangle size={18} />}
          />
          <StatCard
            label="🟡 Retard léger"
            value={stats.niveau_1}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            icon={<Clock size={18} />}
          />
          <StatCard
            label="🟠 Significatif"
            value={stats.niveau_2}
            color="text-orange-600"
            bgColor="bg-orange-50"
            icon={<TrendingUp size={18} />}
          />
          <StatCard
            label="🔴 Incident"
            value={stats.niveau_3}
            color="text-red-700"
            bgColor="bg-red-100"
            icon={<Shield size={18} />}
          />
          <StatCard
            label="Courses actives"
            value={stats.total_active}
            color="text-blue-600"
            bgColor="bg-blue-50"
            icon={<Truck size={18} />}
          />
        </div>
      )}

      {/* Risk breakdown bar */}
      {stats && stats.total_active > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 mb-2">RÉPARTITION DES RISQUES</p>
          <div className="flex h-3 rounded-full overflow-hidden">
            {(["NORMAL", "A_SURVEILLER", "RETARD", "INCIDENT", "CRITIQUE"] as RiskLevel[]).map((level) => {
              const count = stats.risk_breakdown[level] || 0;
              if (count === 0) return null;
              const pct = (count / stats.total_active) * 100;
              const colors: Record<RiskLevel, string> = {
                NORMAL: "bg-green-500",
                A_SURVEILLER: "bg-yellow-500",
                RETARD: "bg-orange-500",
                INCIDENT: "bg-red-500",
                CRITIQUE: "bg-red-900",
              };
              return (
                <div
                  key={level}
                  className={`${colors[level]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${level}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {(["NORMAL", "A_SURVEILLER", "RETARD", "INCIDENT", "CRITIQUE"] as RiskLevel[]).map((level) => {
              const count = stats.risk_breakdown[level] || 0;
              if (count === 0) return null;
              const style = RISK_STYLES[level];
              return (
                <span key={level} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.emoji || ""} {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {[
          { key: "all" as const, label: "Tous", count: incidents.length },
          { key: "niveau_1" as const, label: "🟡 Léger", count: incidents.filter((i) => i.incident_level === "niveau_1").length },
          { key: "niveau_2" as const, label: "🟠 Significatif", count: incidents.filter((i) => i.incident_level === "niveau_2").length },
          { key: "niveau_3" as const, label: "🔴 Incident", count: incidents.filter((i) => i.incident_level === "niveau_3").length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition border ${
              filter === f.key
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Incident List */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="text-sm font-bold text-gray-700">Aucun incident actif</p>
          <p className="text-xs text-gray-400 mt-1">Toutes les livraisons sont dans les temps.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} onClick={() => setSelectedIncident(inc)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Incident Card ──────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick }: { incident: IncidentDelivery; onClick: () => void }) {
  const riskStyle = RISK_STYLES[incident.risk_level] || RISK_STYLES.NORMAL;
  const levelStyle = incident.incident_level ? INCIDENT_LEVEL_STYLES[incident.incident_level] : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition hover:shadow-md ${riskStyle.border} ${riskStyle.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-extrabold text-gray-900">
              #{incident.id.slice(0, 8)}
            </span>
            {levelStyle && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
                {levelStyle.emoji} {levelStyle.label}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskStyle.badge}`}>
              {incident.risk_info.emoji} {incident.risk_info.label}
            </span>
          </div>

          {/* Info rows */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {incident.livreur && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Truck size={12} className="text-gray-400" />
                <span className="font-semibold">{incident.livreur.nom}</span>
              </div>
            )}
            {incident.commerce?.nom && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Package size={12} className="text-gray-400" />
                <span className="truncate">{incident.commerce.nom}</span>
              </div>
            )}
            {incident.client?.nom && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <User size={12} className="text-gray-400" />
                <span className="truncate">{incident.client.nom}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin size={12} className="text-gray-400" />
              <span className="truncate">{incident.adresse_livraison || "—"}</span>
            </div>
          </div>

          {/* Delay and activity */}
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
              <Clock size={12} />
              +{incident.delay_label}
            </span>
            {incident.last_activity_ago != null && (
              <span className="text-[10px] text-gray-500">
                Dernière activité : il y a {incident.last_activity_ago} min
              </span>
            )}
            {incident.delay_reason && (
              <span className="text-[10px] bg-white/60 px-2 py-0.5 rounded-full text-gray-600">
                Motif : {incident.delay_reason}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ── Incident Detail ────────────────────────────────────────────────────────
function IncidentDetail({
  incident,
  onBack,
  onResolve,
  onCancel,
  onEscalate,
  onAddNote,
  isPending,
}: {
  incident: IncidentDelivery;
  onBack: () => void;
  onResolve: (raison: string) => void;
  onCancel: (raison: string) => void;
  onEscalate: () => void;
  onAddNote: (note: string) => void;
  isPending: boolean;
}) {
  const riskStyle = RISK_STYLES[incident.risk_level] || RISK_STYLES.NORMAL;
  const levelStyle = incident.incident_level ? INCIDENT_LEVEL_STYLES[incident.incident_level] : null;

  return (
    <div className="space-y-4 max-w-2xl animate-in fade-in duration-200">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Retour aux incidents
      </button>

      {/* Incident Header */}
      <div className={`rounded-xl border p-4 ${riskStyle.border} ${riskStyle.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              🚨 INCIDENT #{incident.id.slice(0, 8)}
            </h2>
            {incident.created_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                Créée le {new Date(incident.created_at).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
          {levelStyle && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
              {levelStyle.emoji} {levelStyle.label}
            </span>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <p className="text-xs font-bold text-gray-500">Retard</p>
            <p className="text-lg font-extrabold text-red-600">+{incident.delay_label}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <p className="text-xs font-bold text-gray-500">Statut</p>
            <p className="text-sm font-bold text-gray-900">{incident.statut}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <p className="text-xs font-bold text-gray-500">Risque</p>
            <p className={`text-sm font-bold ${riskStyle.text}`}>{incident.risk_info.emoji} {incident.risk_info.label}</p>
          </div>
        </div>
      </div>

      {/* Livreur Info */}
      {incident.livreur && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-blue-600" />
            LIVREUR
          </h3>
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-900">{incident.livreur.nom}</p>
            {incident.livreur.type_vehicule && (
              <p className="text-xs text-gray-500">Véhicule : {incident.livreur.type_vehicule}</p>
            )}
            {incident.last_activity_ago != null && (
              <p className="text-xs text-gray-500">
                Dernière activité : il y a {incident.last_activity_ago} min
              </p>
            )}
            {incident.livreur.telephone && (
              <a
                href={`tel:${incident.livreur.telephone}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition"
              >
                <Phone size={14} /> {incident.livreur.telephone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Client Info */}
      {incident.client?.nom && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <User size={16} className="text-purple-600" />
            CLIENT
          </h3>
          <p className="text-sm font-bold text-gray-900">{incident.client.nom}</p>
          {incident.client.telephone && (
            <a
              href={`tel:${incident.client.telephone}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-100 transition mt-2"
            >
              <Phone size={14} /> {incident.client.telephone}
            </a>
          )}
        </div>
      )}

      {/* Commerce Info */}
      {incident.commerce?.nom && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={16} className="text-orange-600" />
            COMMERCE
          </h3>
          <p className="text-sm font-bold text-gray-900">{incident.commerce.nom}</p>
          {incident.commerce.telephone && (
            <a
              href={`tel:${incident.commerce.telephone}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition mt-2"
            >
              <Phone size={14} /> {incident.commerce.telephone}
            </a>
          )}
        </div>
      )}

      {/* Adresses */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {incident.adresse_retrait && (
          <div>
            <p className="text-xs font-bold text-gray-500">📍 Adresse de retrait</p>
            <p className="text-sm text-gray-900">{incident.adresse_retrait}</p>
          </div>
        )}
        {incident.adresse_livraison && (
          <div>
            <p className="text-xs font-bold text-gray-500">📍 Adresse de livraison</p>
            <p className="text-sm text-gray-900">{incident.adresse_livraison}</p>
          </div>
        )}
        {incident.note && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-500">Note client</p>
            <p className="text-sm text-gray-700">{incident.note}</p>
          </div>
        )}
      </div>

      {/* Motif signalé */}
      {incident.delay_reason && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-2">
            📋 Motif signalé par le livreur
          </h3>
          <p className="text-sm text-gray-700 font-semibold">{incident.delay_reason}</p>
        </div>
      )}

      {/* Timeline */}
      {incident.timeline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3">📅 Timeline</h3>
          <div className="space-y-0">
            {incident.timeline.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      event.type === "alerte"
                        ? "bg-red-500"
                        : event.type === "annulation"
                          ? "bg-gray-400"
                          : event.type === "fait"
                            ? "bg-green-500"
                            : "bg-blue-500"
                    }`}
                  />
                  {idx < incident.timeline.length - 1 && (
                    <div className="w-0.5 h-full min-h-[20px] bg-gray-200" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-gray-900">{event.titre}</p>
                  <p className="text-xs text-gray-500">{event.date_label}</p>
                  {event.details && (
                    <p className="text-xs text-gray-600 mt-0.5">{event.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operator Actions History */}
      {incident.operator_actions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3">📝 Actions opérateur</h3>
          <div className="space-y-2">
            {incident.operator_actions.map((action) => (
              <div key={action.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 flex-shrink-0">{action.created_at_label}</span>
                <span className="font-semibold text-gray-700">{action.action_label}</span>
                {action.details && <span className="text-gray-500">— {action.details}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-extrabold text-gray-900 mb-3">⚡ Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {incident.livreur?.telephone && (
            <a
              href={`tel:${incident.livreur.telephone}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
            >
              <Phone size={16} /> Contacter livreur
            </a>
          )}
          {incident.client?.telephone && (
            <a
              href={`tel:${incident.client.telephone}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition"
            >
              <Phone size={16} /> Contacter client
            </a>
          )}
          {incident.commerce?.telephone && (
            <a
              href={`tel:${incident.commerce.telephone}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition"
            >
              <Phone size={16} /> Contacter commerce
            </a>
          )}
          <button
            onClick={() => onEscalate()}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition disabled:opacity-50"
          >
            <TrendingUp size={16} /> Escalader
          </button>
          <button
            onClick={() => {
              const raison = prompt("Raison de la résolution ?");
              if (raison) onResolve(raison);
            }}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
          >
            <CheckCircle size={16} /> Résoudre
          </button>
          <button
            onClick={() => {
              const note = prompt("Note à ajouter ?");
              if (note) onAddNote(note);
            }}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition disabled:opacity-50"
          >
            <MessageSquare size={16} /> Ajouter note
          </button>
          <button
            onClick={() => {
              const raison = prompt("Raison de l'annulation ?");
              if (raison) onCancel(raison);
            }}
            disabled={isPending}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            <XCircle size={16} /> Annuler la livraison
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  bgColor,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 p-3 ${bgColor}`}>
      <div className={`${color} mb-1`}>{icon}</div>
      <p className={`text-lg font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-gray-500">{label}</p>
    </div>
  );
}


