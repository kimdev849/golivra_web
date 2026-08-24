import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Trash2, Pencil, ChevronDown, X, Search, ChevronLeft, Navigation } from "lucide-react";
import { apiFetch, getSessionToken } from "../lib/api";
import type { Address } from "../lib/types";
import { toast } from "sonner";
import { sanitizeText } from "../lib/validation";
import { fetchPublicPricing, type PublicPricing } from "../lib/pricing";

type FormState = {
  libelle: string;
  ligne1: string;
  ligne2: string;
  quartier: string;
  point_reperes: string;
  instructions: string;
  ville: string;
  pays: string;
};

const emptyForm: FormState = {
  libelle: "",
  ligne1: "",
  ligne2: "",
  quartier: "",
  point_reperes: "",
  instructions: "",
  ville: "Brazzaville",
  pays: "Congo",
};

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [showQuartierPicker, setShowQuartierPicker] = useState(false);
  const [quartierSearch, setQuartierSearch] = useState("");

  // ── Fetch pricing for zone list ──
  const { data: pricing } = useQuery<PublicPricing>({
    queryKey: ["pricing-config"],
    queryFn: fetchPublicPricing,
    staleTime: 300_000,
  });

  // ── Build quartier list from zones ──
  const quartiers = useMemo(() => {
    if (!pricing?.zones) return [];
    const zones = pricing.zones.zones.filter((z) => z.is_active);
    const arrs = pricing.zones.arrondissements;
    const priceMap = pricing.zones.price_by_arrondissement;
    const result: { name: string; zone: string; price: number }[] = [];
    for (const arr of arrs) {
      const zone = zones.find((z) => z.id === arr.zone_id);
      result.push({
        name: arr.name,
        zone: zone?.label || zone?.name || "",
        price: priceMap[arr.name] ?? zone?.price_base ?? pricing.frais_livraison_base_fcfa,
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [pricing]);

  const filteredQuartiers = quartiers.filter((q) =>
    !quartierSearch ||
    q.name.toLowerCase().includes(quartierSearch.toLowerCase()) ||
    q.zone.toLowerCase().includes(quartierSearch.toLowerCase())
  );

  const load = () => {
    const token = getSessionToken();
    if (!token) return;
    apiFetch<Address[]>("/api/addresses", { token })
      .then((data) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setShowForm(true);
  };

  const startEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      libelle: a.libelle ?? "",
      ligne1: a.ligne1 ?? "",
      ligne2: a.ligne2 ?? "",
      quartier: a.quartier ?? "",
      point_reperes: a.point_reperes ?? "",
      instructions: a.instructions ?? "",
      ville: a.ville ?? "Brazzaville",
      pays: a.pays ?? "Congo",
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleInput = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.ligne1.trim()) {
      e.ligne1 = "Indiquez votre adresse.";
    } else if (form.ligne1.trim().length < 2) {
      e.ligne1 = "L'adresse est trop courte.";
    }
    if (!form.quartier.trim()) {
      e.quartier = "Sélectionnez un quartier.";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const token = getSessionToken();
    if (!token) return;
    setSaving(true);
    try {
      const body = {
        libelle: form.libelle.trim() || null,
        ligne1: form.ligne1.trim(),
        ligne2: form.ligne2.trim() || null,
        quartier: form.quartier.trim() || null,
        point_reperes: form.point_reperes.trim() || null,
        instructions: form.instructions.trim() || null,
        ville: form.ville.trim() || null,
        pays: form.pays.trim() || null,
      };

      if (editingId) {
        await apiFetch(`/api/addresses/${editingId}`, {
          method: "PUT",
          token,
          jsonBody: body,
        });
        toast.success("Adresse modifiée");
      } else {
        await apiFetch("/api/addresses", {
          method: "POST",
          token,
          jsonBody: body,
        });
        toast.success("Adresse ajoutée");
      }
      closeForm();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette adresse ?")) return;
    const token = getSessionToken();
    if (!token) return;
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "DELETE", token });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Adresse supprimée");
    } catch {
      toast.error("Erreur");
    }
  };

  const isDark = document.documentElement.classList.contains("dark");

  const bg = isDark ? "#1a2420" : "#ffffff";
  const bgMuted = isDark ? "#151f1b" : "#f8faf9";
  const border = isDark ? "#2a3d33" : "#e8ede9";
  const textPrimary = isDark ? "#eaf2ed" : "#1a2a1f";
  const textSecondary = isDark ? "#9bb5a5" : "#6b7c70";
  const textMuted = isDark ? "#6b8a78" : "#9ca8a0";

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? "#0f1a14" : "#f5f7f6" }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}
      >
        <h1 className="flex-1 text-lg font-bold" style={{ color: textPrimary }}>Mes adresses</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{ backgroundColor: "#3aa86f" }}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* ── Loading ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: bgMuted }} />
            ))}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          /* ── Empty state ── */
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: textMuted }} />
            <p className="font-semibold" style={{ color: textPrimary }}>Aucune adresse</p>
            <p className="text-sm mt-1" style={{ color: textSecondary }}>Ajoutez une adresse pour vos livraisons.</p>
          </div>
        ) : (
          <>
            {/* ── Address cards ── */}
            <div className="space-y-3 mb-4">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isDark ? "#1e3a2a" : "#e8f5ee" }}>
                    <MapPin className="w-5 h-5" style={{ color: "#3aa86f" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {a.libelle && <p className="text-sm font-semibold" style={{ color: textPrimary }}>{a.libelle}</p>}
                      {a.ville && <p className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isDark ? "#1e3a2a" : "#e8f5ee", color: "#3aa86f" }}>{a.ville}</p>}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{a.ligne1}</p>
                    {a.ligne2 && <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{a.ligne2}</p>}
                    {a.quartier && <p className="text-xs mt-0.5" style={{ color: textMuted }}>{a.quartier}</p>}
                    {a.point_reperes && (
                      <div className="flex items-center gap-1 mt-1">
                        <Navigation className="w-3 h-3" style={{ color: textMuted }} />
                        <p className="text-xs" style={{ color: textMuted }}>{a.point_reperes}</p>
                      </div>
                    )}
                    {a.instructions && (
                      <p className="text-xs mt-1 italic" style={{ color: textMuted }}>📝 {a.instructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(a)}
                      className="p-2 rounded-xl transition hover:opacity-80"
                      style={{ backgroundColor: isDark ? "#1e3a2a" : "#e8f5ee" }}
                    >
                      <Pencil className="w-4 h-4" style={{ color: "#3aa86f" }} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-xl transition hover:opacity-80"
                      style={{ backgroundColor: isDark ? "#2a1a1a" : "#fef0f0" }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "#e05555" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Create / Edit form ── */}
            {showForm && (
              <div className="rounded-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base" style={{ color: textPrimary }}>
                    {editingId ? "Modifier l'adresse" : "Nouvelle adresse"}
                  </h3>
                  <button onClick={closeForm} className="p-1.5 rounded-xl" style={{ backgroundColor: bgMuted }}>
                    <X className="w-4 h-4" style={{ color: textSecondary }} />
                  </button>
                </div>

                {/* ── Libelle ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Nom (optionnel)</label>
                  <input
                    value={form.libelle}
                    onChange={(e) => handleInput("libelle", e.target.value)}
                    maxLength={50}
                    placeholder="Maison, Travail…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                    style={{
                      backgroundColor: bgMuted,
                      border: `1px solid ${errors.libelle ? "#e05555" : border}`,
                      color: textPrimary,
                    }}
                  />
                  {errors.libelle && <p className="text-xs text-red-500 mt-1">{errors.libelle}</p>}
                </div>

                {/* ── Quartier picker ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Quartier / Zone *</label>
                  <button
                    type="button"
                    onClick={() => setShowQuartierPicker(true)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left"
                    style={{
                      backgroundColor: bgMuted,
                      border: `1px solid ${errors.quartier ? "#e05555" : border}`,
                      color: form.quartier ? textPrimary : textMuted,
                    }}
                  >
                    <MapPin size={16} className="flex-shrink-0" style={{ color: "#3aa86f" }} />
                    <span className="flex-1">{form.quartier || "Sélectionnez votre quartier"}</span>
                    <ChevronDown size={16} style={{ color: textMuted }} />
                  </button>
                  {errors.quartier && <p className="text-xs text-red-500 mt-1">{errors.quartier}</p>}
                </div>

                {/* ── Adresse ligne1 ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Adresse *</label>
                  <input
                    value={form.ligne1}
                    onChange={(e) => handleInput("ligne1", e.target.value)}
                    maxLength={200}
                    placeholder="Avenue de la Paix, immeuble bleu"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                    style={{
                      backgroundColor: bgMuted,
                      border: `1px solid ${errors.ligne1 ? "#e05555" : border}`,
                      color: textPrimary,
                    }}
                  />
                  {errors.ligne1 && <p className="text-xs text-red-500 mt-1">{errors.ligne1}</p>}
                </div>

                {/* ── Adresse ligne2 (détails) ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Complément d'adresse</label>
                  <input
                    value={form.ligne2}
                    onChange={(e) => handleInput("ligne2", e.target.value)}
                    maxLength={200}
                    placeholder="Appartement 3B, bâtiment C, étage 2…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                    style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                  />
                </div>

                {/* ── Point de repère ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Point de repère</label>
                  <input
                    value={form.point_reperes}
                    onChange={(e) => handleInput("point_reperes", e.target.value)}
                    maxLength={200}
                    placeholder="Face à la pharmacie, à côté du carrefour…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                    style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                  />
                </div>

                {/* ── Instructions livraison ── */}
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Instructions de livraison</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => handleInput("instructions", e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Sonner au portail, laisser chez le gardien…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#3aa86f]/30"
                    style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Ville</label>
                    <input
                      value={form.ville}
                      onChange={(e) => handleInput("ville", e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                      style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold mb-1 block" style={{ color: textSecondary }}>Pays</label>
                    <input
                      value={form.pays}
                      onChange={(e) => handleInput("pays", e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                      style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                    />
                  </div>
                </div>

                {/* ── Save button ── */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: "#3aa86f" }}
                >
                  {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Enregistrer l'adresse"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-full text-center text-sm font-semibold"
                  style={{ color: textMuted }}
                >
                  Annuler
                </button>
              </div>
            )}

            {/* ── Add button (when form is closed) ── */}
            {!showForm && addresses.length > 0 && (
              <button
                onClick={startCreate}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition border-2 border-dashed"
                style={{ borderColor: "#3aa86f", color: "#3aa86f" }}
              >
                + Ajouter une adresse
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Quartier Picker Modal ── */}
      {showQuartierPicker && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowQuartierPicker(false)}>
          <div
            className="w-full max-w-md max-h-[70vh] flex flex-col rounded-t-3xl lg:rounded-3xl"
            style={{ backgroundColor: bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="font-bold" style={{ color: textPrimary }}>Choisissez votre quartier</p>
              <button onClick={() => setShowQuartierPicker(false)} className="p-1.5 rounded-xl" style={{ backgroundColor: bgMuted }}>
                <X className="w-4 h-4" style={{ color: textSecondary }} />
              </button>
            </div>

            {quartiers.length > 0 ? (
              <>
                <div className="p-3">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: bgMuted }}>
                    <Search size={16} style={{ color: textMuted }} />
                    <input
                      type="text"
                      value={quartierSearch}
                      onChange={(e) => setQuartierSearch(e.target.value)}
                      placeholder="Rechercher un quartier…"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: textPrimary }}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {filteredQuartiers.map((q) => (
                    <button
                      key={q.name}
                      onClick={() => {
                        setForm((p) => ({ ...p, quartier: q.name }));
                        setShowQuartierPicker(false);
                        setQuartierSearch("");
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition"
                      style={{
                        backgroundColor: form.quartier === q.name ? (isDark ? "#1e3a2a" : "#e8f5ee") : "transparent",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>{q.name}</p>
                        {q.zone && <p className="text-[11px]" style={{ color: textMuted }}>{q.zone}</p>}
                      </div>
                      {form.quartier === q.name && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#3aa86f" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredQuartiers.length === 0 && (
                    <p className="text-center text-sm py-6" style={{ color: textMuted }}>Aucun quartier trouvé</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-center mb-3" style={{ color: textSecondary }}>Saisissez votre quartier manuellement :</p>
                <input
                  type="text"
                  value={form.quartier}
                  onChange={(e) => setForm((p) => ({ ...p, quartier: e.target.value }))}
                  placeholder="Ex: Bacongo, Poto-Poto…"
                  maxLength={80}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3aa86f]/30"
                  style={{ backgroundColor: bgMuted, border: `1px solid ${border}`, color: textPrimary }}
                />
                <button
                  onClick={() => setShowQuartierPicker(false)}
                  className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: "#3aa86f" }}
                >
                  Valider
                </button>
              </div>
            )}

            <div className="p-3 text-center" style={{ borderTop: `1px solid ${border}` }}>
              <p className="text-[11px]" style={{ color: textMuted }}>Les frais de livraison dépendent de votre zone.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
