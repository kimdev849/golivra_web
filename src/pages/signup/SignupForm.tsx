import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, ChevronDown, Eye, EyeOff, Lock, MapPin,
  MessageCircle, Smartphone, Store, Tag, User, UtensilsCrossed, X,
} from "lucide-react";
import {
  requestOtp,
  friendlyErrorMessage,
  registerAccount,
  registerVendorAccount,
} from "../../lib/api";
import { useAuthStore } from "../../store";
import { fetchPays, fetchVillesByPays, type Pays, type Ville } from "../../lib/location";
import { fetchEnterpriseCategories, type EnterpriseCategory } from "../../lib/enterprise";
import { toast } from "sonner";

type SignupVariant = "default" | "restaurant" | "boutique";

// ─── Phone helpers ───────────────────────────────────────────────────────────

function formatPhoneDisplay(value: string): string {
  const raw = value.replace(/\D/g, "");
  // Strip leading zeros when +242 prefix detected
  if (raw.startsWith("2420")) {
    const n = raw.slice(4, 13);
    if (n.length <= 2) return `+242 ${n}`;
    if (n.length <= 5) return `+242 ${n.slice(0, 2)} ${n.slice(2)}`;
    if (n.length <= 7) return `+242 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
    return `+242 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
  }
  if (raw.startsWith("242")) {
    const n = raw.slice(3, 12);
    if (n.length <= 2) return `+242 ${n}`;
    if (n.length <= 5) return `+242 ${n.slice(0, 2)} ${n.slice(2)}`;
    if (n.length <= 7) return `+242 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
    return `+242 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
  }
  if (raw.length <= 3) return `+${raw}`;
  return `+${raw.slice(0, 3)} ${raw.slice(3)}`;
}

function toE164(value: string): string | null {
  const c = value.replace(/\D/g, "");
  // +242 followed by 9 digits
  if (c.startsWith("242") && c.length >= 12) return `+${c.slice(0, 12)}`;
  if (c.startsWith("242")) {
    const n = c.slice(3);
    if (n.length >= 8) return `+242${n}`;
  }
  // Local format: starts with 0 + 9 digits
  if (c.startsWith("0") && c.length >= 10) {
    return `+242${c.slice(1, 10)}`;
  }
  // Already has +
  if (value.startsWith("+") && c.length >= 9) return `+${c}`;
  // Just digits
  if (c.length >= 9) return `+${c}`;
  return null;
}

// ─── Validation (matches mobile form-validation.ts) ──────────────────────────

const FORBIDDEN_RE = /[<>{}[\]^#\\|~`!@$%&*+=;'?]/g;
function sanitize(v: string): string { return v.replace(FORBIDDEN_RE, '').trim(); }

type VR = { ok: true } | { ok: false; m: string };
function vName(v: string): VR {
  const t = v.trim();
  if (!t) return { ok: false, m: 'Écrivez votre prénom et votre nom.' };
  if (t.length < 2) return { ok: false, m: 'Votre nom est trop court.' };
  if (t.length > 80) return { ok: false, m: 'Votre nom est trop long (max 80 caractères).' };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: 'Le nom contient des caractères non autorisés.' };
  return { ok: true };
}
function vPhone(v: string): VR {
  const t = v.trim();
  if (!t) return { ok: false, m: 'Écrivez votre numéro de téléphone.' };
  if (t.length > 20) return { ok: false, m: 'Le numéro est trop long.' };
  if (!/\d/.test(t)) return { ok: false, m: 'Votre numéro doit contenir des chiffres.' };
  const digits = t.replace(/\s/g, '');
  if (digits.length < 9) return { ok: false, m: 'Le numéro est trop court.' };
  return { ok: true };
}
function vPassword(v: string): VR {
  if (!v) return { ok: false, m: 'Choisissez un mot de passe.' };
  if (v.length < 8) return { ok: false, m: 'Votre mot de passe doit contenir au moins 8 caractères.' };
  if (v.length > 128) return { ok: false, m: 'Le mot de passe est trop long.' };
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v)) return { ok: false, m: 'Votre mot de passe doit contenir au moins 1 lettre et 1 chiffre.' };
  return { ok: true };
}
function vCommerce(v: string): VR {
  const t = v.trim();
  if (!t) return { ok: false, m: 'Donnez un nom à votre commerce.' };
  if (t.length < 2) return { ok: false, m: 'Le nom est trop court.' };
  if (t.length > 100) return { ok: false, m: 'Le nom est trop long (max 100 caractères).' };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: 'Le nom contient des caractères non autorisés.' };
  return { ok: true };
}
function vAddress(v: string): VR {
  const t = v.trim();
  if (t.length > 200) return { ok: false, m: "L'adresse est trop longue (max 200 caractères)." };
  if (t && FORBIDDEN_RE.test(t)) return { ok: false, m: "L'adresse contient des caractères non autorisés." };
  return { ok: true };
}
function vOtp(v: string): VR {
  if (!/^\d{6}$/.test(v.trim())) return { ok: false, m: 'Le code SMS doit contenir 6 chiffres.' };
  return { ok: true };
}

// ─── LocationValue ───────────────────────────────────────────────────────────

type LocationValue = { pays: Pays | null; ville: Ville | null };

// ─── Main Component ──────────────────────────────────────────────────────────

export function SignupForm({ variant, forcedProfile }: { variant: SignupVariant; forcedProfile: "client" | "vendeur" }) {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const commerceKind = variant === "default" ? null : (variant as "restaurant" | "boutique");
  const isVendor = forcedProfile === "vendeur" && commerceKind;

  // ── Form state ──
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+242 ");
  const [password, setPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [location, setLocation] = useState<LocationValue>({ pays: null, ville: null });
  const phoneIndicatif = location.pays?.indicatif || "+242";

  // ── Vendor state ──
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCategoryId, setBusinessCategoryId] = useState<string | null>(null);

  // ── OTP ──
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [testOtpCode, setTestOtpCode] = useState<string | null>(null);

  // ── UI ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // ── Data from API ──
  const [countries, setCountries] = useState<Pays[]>([]);
  const [cities, setCities] = useState<Ville[]>([]);
  const [categories, setCategories] = useState<EnterpriseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const phoneE164 = toE164(phone);

  // ── Load countries on mount ──
  useEffect(() => {
    fetchPays().then(setCountries).catch(() => {});
  }, []);

  // ── Load cities when country changes ──
  useEffect(() => {
    if (!location.pays?.id) { setCities([]); return; }
    fetchVillesByPays(location.pays.id).then(setCities).catch(() => setCities([]));
  }, [location.pays?.id]);

  // ── Load categories when vendor type changes ──
  useEffect(() => {
    if (!isVendor || !commerceKind) { setCategories([]); return; }
    setCategoriesLoading(true);
    fetchEnterpriseCategories(commerceKind)
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, [isVendor, commerceKind]);

  const selectedCategory = categories.find((c) => c.id === businessCategoryId) ?? null;
  const filteredCountries = countries.filter((c) => !countrySearch || c.nom.toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredCities = cities.filter((c) => !citySearch || c.nom.toLowerCase().includes(citySearch.toLowerCase()));

  const fe = (name: string) => fieldErrors[name] ? 'border-error' : 'border-line';

  const validateAll = (): string | null => {
    const next: Record<string, string | null> = {};
    if (forcedProfile === 'client') { const r = vName(fullName); if (!r.ok) { next.fullName = r.m; setFieldErrors(next); return r.m; } }
    const r2 = vPhone(phone); if (!r2.ok) { next.phone = r2.m; setFieldErrors(next); return r2.m; }
    if (!phoneE164) { next.phone = 'Ce numéro ne semble pas complet.'; setFieldErrors(next); return next.phone; }
    const r3 = vPassword(password); if (!r3.ok) { next.password = r3.m; setFieldErrors(next); return r3.m; }
    if (isVendor) {
      const r4 = vCommerce(businessName); if (!r4.ok) { next.businessName = r4.m; setFieldErrors(next); return r4.m; }
      if (!businessCategoryId) { next.businessCategoryId = 'Sélectionnez une catégorie.'; setFieldErrors(next); return 'Sélectionnez une catégorie.'; }
      if (businessAddress.trim()) {
        const r5 = vAddress(businessAddress); if (!r5.ok) { next.businessAddress = r5.m; setFieldErrors(next); return r5.m; }
      }
    }
    setFieldErrors({});
    return null;
  };

  const canSendOtp = !isSubmitting && !otpSent && Boolean(phoneE164) && password.length >= 6 && (forcedProfile === "vendeur" || Boolean(fullName.trim()));
  const canVerifyOtp = !isSubmitting && otpSent && otp.trim().length >= 4;

  const handleSendOtp = async () => {
    setError(null);
    const v = validateAll();
    if (v) return;
    setIsSubmitting(true);
    try {
      const result = await requestOtp(phoneE164!);
      setTestOtpCode(result.testMode && result.otpCode ? result.otpCode : null);
      setOtpSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible d'envoyer le code."); }
    finally { setIsSubmitting(false); }
  };

  const handleVerifyAndRegister = async () => {
    setError(null);
    const r = vOtp(otp);
    if (!r.ok) { setFieldErrors({ otp: r.m }); return; }
    setFieldErrors((p) => ({ ...p, otp: null }));
    const v = validateAll();
    if (v || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const userNom = forcedProfile === "vendeur" ? businessName.trim() : fullName.trim();
      if (isVendor && commerceKind) {
        const result = await registerVendorAccount({
          nom: userNom, telephone: phoneE164!, motDePasse: password, otpCode: otp.trim(),
          role: commerceKind === "restaurant" ? "restaurateur" : "commercant",
          imageUrl: null,
          pays_id: location.pays?.id || null, ville_id: location.ville?.id || null,
          enterprise: {
            type: commerceKind, nom: businessName.trim(), telephone: phoneE164!,
            categorieId: businessCategoryId!, description: null, imageUrl: null,
            ...(commerceKind === "restaurant" || businessAddress.trim() ? { adresse: businessAddress.trim() } : {}),
          },
        });
        if (!result?.token) throw new Error("Compte créé mais session invalide.");
        const { enterprise: _, ...session } = result;
        setSession(session);
        toast.success("Compte créé !");
        navigate("/vendor", { replace: true });
        return;
      }
      const session = await registerAccount({
        nom: userNom, telephone: phoneE164!, motDePasse: password, otpCode: otp.trim(),
        role: "client", imageUrl: null,
        pays_id: location.pays?.id || null, ville_id: location.ville?.id || null,
      });
      if (!session?.token) throw new Error("Compte créé mais session invalide.");
      setSession(session);
      toast.success("Bienvenue à bord !");
      navigate("/", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/déjà enregistré|deja enregistre/i.test(msg)) setError("Ce numéro est déjà inscrit. Connectez-vous.");
      else setError(friendlyErrorMessage(e, "La création du compte a échoué."));
    } finally { setIsSubmitting(false); }
  };

  const headerDesc = variant === "restaurant" ? "Type de compte : Restaurant" : variant === "boutique" ? "Type de compte : Boutique" : "Type de compte : Client";
  const HeaderIcon = isVendor ? (commerceKind === "restaurant" ? UtensilsCrossed : Store) : User;

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/auth")} className="w-11 h-11 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-brand-50 transition">
              <span className="text-brand text-lg font-bold">←</span>
            </button>
            <img src="/assets/images/logo25292922882.png" alt="GoLivra" className="h-12" />
            <div className="w-11" />
          </div>
          <div className="w-14 h-14 rounded-[15px] bg-brand-700 flex items-center justify-center mx-auto mb-3">
            <HeaderIcon size={26} color="#FFFFFF" strokeWidth={2.1} />
          </div>
          <h1 className="text-[26px] leading-8 font-black text-txt">Créer un compte</h1>
          <p className="text-sm text-txt-secondary opacity-80 mt-1">{headerDesc}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className={`h-1.5 w-8 rounded-full ${otpSent ? "bg-brand" : "bg-brand"}`} />
          <div className={`h-1.5 w-8 rounded-full ${otpSent ? "bg-brand" : "bg-line"}`} />
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-3xl border border-line p-5 shadow-lg shadow-brand-900/5 space-y-4">
          {error && (
            <div className="bg-error-soft border border-error/20 rounded-xl p-3 text-sm text-error font-medium">
              <p className="font-bold text-xs mb-0.5">Inscription impossible</p>
              <p>{error}</p>
            </div>
          )}

          {/* ── Vos informations ── */}
          <p className="text-[14.5px] font-extrabold text-txt tracking-wide">Vos informations</p>

          {/* Full name (client) */}
          {forcedProfile === "client" && (
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-txt-secondary">Nom complet</label>
              <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("fullName")}`}>
                <User size={20} className="text-brand" strokeWidth={2.2} />
                <input type="text" value={fullName} onChange={(e) => { const s = sanitize(e.target.value); setFullName(s); if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: null })); }} onBlur={() => { const r = vName(fullName); if (!r.ok) setFieldErrors((p) => ({ ...p, fullName: r.m })); }} placeholder="Ex. : Jean Claude" disabled={otpSent} maxLength={80} className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted disabled:opacity-50" />
              </div>
              <p className="text-xs text-txt-muted">Votre prénom et votre nom.</p>
              {fieldErrors.fullName && <p className="text-xs text-error font-medium">{fieldErrors.fullName}</p>}
            </div>
          )}

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-txt-secondary">Numéro de téléphone</label>
            <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("phone")}`}>
              <Smartphone size={20} className="text-brand" strokeWidth={2.2} />
              <input type="tel" value={phone} onChange={(e) => { setPhone(formatPhoneDisplay(e.target.value)); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: null })); }} onBlur={() => { const r = vPhone(phone); if (!r.ok) setFieldErrors((p) => ({ ...p, phone: r.m })); }} placeholder="+242 06 XXX XX XX" disabled={otpSent} className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted disabled:opacity-50" />
            </div>
            <p className="text-xs text-txt-muted">Un code de vérification sera envoyé par SMS.</p>
            {fieldErrors.phone && <p className="text-xs text-error font-medium">{fieldErrors.phone}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-txt-secondary">Mot de passe</label>
            <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("password")}`}>
              <Lock size={20} className="text-brand" strokeWidth={2.2} />
              <input type={pwVisible ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: null })); }} onBlur={() => { const r = vPassword(password); if (!r.ok) setFieldErrors((p) => ({ ...p, password: r.m })); }} placeholder="Minimum 8 caractères" disabled={otpSent} className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted disabled:opacity-50" />
              <button type="button" onClick={() => setPwVisible(!pwVisible)} disabled={otpSent} className="text-txt-muted hover:text-txt disabled:opacity-50">
                {pwVisible ? <EyeOff size={20} strokeWidth={2.2} /> : <Eye size={20} strokeWidth={2.2} />}
              </button>
            </div>
            <p className="text-xs text-txt-muted">Au moins 8 caractères, avec 1 lettre et 1 chiffre.</p>
            {fieldErrors.password && <p className="text-xs text-error font-medium">{fieldErrors.password}</p>}
          </div>

          {/* ── Localisation ── */}
          <p className="text-[14.5px] font-extrabold text-txt tracking-wide">Localisation</p>

          {/* Country picker */}
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-txt-secondary">Pays</label>
            <button type="button" disabled={otpSent} onClick={() => setShowCountryPicker(true)} className={`w-full flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("country")} ${otpSent ? "opacity-50" : "hover:bg-brand-50 transition cursor-pointer"}`}>
              <MapPin size={20} className="text-brand" strokeWidth={2.2} />
              <span className={`flex-1 text-left text-sm ${location.pays ? "text-txt" : "text-txt-muted"}`}>{location.pays?.nom || "Choisissez votre pays"}</span>
              <ChevronDown size={20} className="text-txt-muted" />
            </button>
          </div>

          {/* City picker */}
          {location.pays && (
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-txt-secondary">Ville</label>
              <button type="button" disabled={otpSent} onClick={() => setShowCityPicker(true)} className={`w-full flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("city")} ${otpSent ? "opacity-50" : "hover:bg-brand-50 transition cursor-pointer"}`}>
                <MapPin size={20} className="text-brand" strokeWidth={2.2} />
                <span className={`flex-1 text-left text-sm ${location.ville ? "text-txt" : "text-txt-muted"}`}>{location.ville?.nom || "Choisissez votre ville"}</span>
                <ChevronDown size={20} className="text-txt-muted" />
              </button>
            </div>
          )}

          {/* ── Votre commerce (vendor) ── */}
          {isVendor && (
            <>
              <p className="text-[14.5px] font-extrabold text-txt tracking-wide">Votre {commerceKind === "restaurant" ? "restaurant" : "boutique"}</p>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-txt-secondary">{commerceKind === "restaurant" ? "Nom du restaurant" : "Nom de la boutique"}</label>
                <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("businessName")}`}>
                  {commerceKind === "restaurant" ? <UtensilsCrossed size={20} className="text-brand" strokeWidth={2.2} /> : <Store size={20} className="text-brand" strokeWidth={2.2} />}
                  <input type="text" value={businessName} onChange={(e) => { const s = sanitize(e.target.value); setBusinessName(s); if (fieldErrors.businessName) setFieldErrors((p) => ({ ...p, businessName: null })); }} onBlur={() => { const r = vCommerce(businessName); if (!r.ok) setFieldErrors((p) => ({ ...p, businessName: r.m })); }} placeholder={commerceKind === "restaurant" ? "Ex. : Le Palmier" : "Ex. : Mode & Co"} disabled={otpSent} maxLength={100} className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted disabled:opacity-50" />
                </div>
                <p className="text-xs text-txt-muted">Un nom clair que vos clients reconnaîtront.</p>
                {fieldErrors.businessName && <p className="text-xs text-error font-medium">{fieldErrors.businessName}</p>}
              </div>

              {/* Category picker */}
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-txt-secondary">{commerceKind === "restaurant" ? "Type de cuisine" : "Catégorie de la boutique"}</label>
                <button type="button" disabled={otpSent || categoriesLoading} onClick={() => setShowCategoryPicker(true)} className={`w-full flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("businessCategoryId")} ${otpSent ? "opacity-50" : "hover:bg-brand-50 transition cursor-pointer"}`}>
                  <Tag size={20} className="text-brand" strokeWidth={2.2} />
                  <span className={`flex-1 text-left text-sm ${selectedCategory ? "text-txt" : "text-txt-muted"}`}>{categoriesLoading ? "Chargement…" : selectedCategory?.nom || "Choisissez une catégorie"}</span>
                  <ChevronDown size={20} className="text-txt-muted" />
                </button>
                {fieldErrors.businessCategoryId && <p className="text-xs text-error font-medium">{fieldErrors.businessCategoryId}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-txt-secondary">{commerceKind === "restaurant" ? "Adresse" : "Adresse (optionnelle)"}</label>
                {fieldErrors.businessAddress && <p className="text-xs text-error font-medium">{fieldErrors.businessAddress}</p>}
                <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("businessAddress")}`}>
                  <MapPin size={20} className="text-brand" strokeWidth={2.2} />
                  <input type="text" value={businessAddress} onChange={(e) => { const s = sanitize(e.target.value); setBusinessAddress(s); if (fieldErrors.businessAddress) setFieldErrors((p) => ({ ...p, businessAddress: null })); }} onBlur={() => { if (businessAddress.trim()) { const r = vAddress(businessAddress); if (!r.ok) setFieldErrors((p) => ({ ...p, businessAddress: r.m })); } }} placeholder={commerceKind === "restaurant" ? "Quartier, rue, point de repère…" : "Laissez vide pour une boutique en ligne"} disabled={otpSent} maxLength={200} className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted disabled:opacity-50" />
                </div>
              </div>
            </>
          )}

          {/* ── OTP ── */}
          {otpSent && (
            <div className="space-y-3">
              <p className="text-[14.5px] font-extrabold text-txt tracking-wide">Vérification</p>
              {testOtpCode && <p className="text-sm font-bold text-brand text-center">Mode test — code OTP : {testOtpCode}</p>}
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-txt-secondary">Code SMS</label>
                <div className={`flex items-center gap-3 border rounded-2xl px-4 py-3 bg-surface ${fe("otp")}`}>
                  <MessageCircle size={20} className="text-brand" strokeWidth={2.2} />
                  <input type="text" inputMode="numeric" value={otp} onChange={(e) => { setOtp(e.target.value); setFieldErrors((p) => ({ ...p, otp: null })); }} placeholder="Ex. : 123456" className="flex-1 bg-transparent text-sm text-txt outline-none placeholder-txt-muted" />
                </div>
                {fieldErrors.otp && <p className="text-xs text-error font-medium">{fieldErrors.otp}</p>}
              </div>
              <button onClick={handleVerifyAndRegister} disabled={!canVerifyOtp} className="w-full bg-brand text-white py-4 rounded-full font-extrabold text-base disabled:opacity-50 hover:bg-brand-700 transition">
                {isSubmitting ? "Création du compte…" : "Valider et créer le compte"}
              </button>
              <button onClick={() => { setOtpSent(false); setOtp(""); setTestOtpCode(null); setError(null); }} className="w-full bg-brand-50 text-brand py-3.5 rounded-full font-extrabold text-base hover:bg-brand-100 transition">
                Modifier les informations
              </button>
            </div>
          )}

          {!otpSent && (
            <button onClick={handleSendOtp} disabled={!canSendOtp} className="w-full bg-brand text-white py-4 rounded-full font-extrabold text-base disabled:opacity-50 hover:bg-brand-700 transition">
              {isSubmitting ? "Envoi en cours…" : "Recevoir le code par SMS"}
            </button>
          )}

          <button onClick={() => navigate("/auth", { replace: true })} className="w-full bg-brand-50 text-brand py-3.5 rounded-full font-extrabold text-base hover:bg-brand-100 transition">
            J'ai déjà un compte
          </button>

          <p className="text-center text-xs text-txt-muted leading-relaxed">Vos informations restent privées et sécurisées.</p>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowCountryPicker(false)}>
          <div className="bg-surface rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-bold text-txt">Choisissez votre pays</p>
              <button onClick={() => setShowCountryPicker(false)} className="p-1"><X className="w-5 h-5 text-txt-muted" /></button>
            </div>
            <div className="p-3"><input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Rechercher…" className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20" /></div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCountries.map((c) => (
                <button key={c.id} onClick={() => { setLocation((p) => ({ pays: c, ville: null })); setShowCountryPicker(false); setCountrySearch(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${location.pays?.id === c.id ? "bg-brand-50 text-brand" : "hover:bg-gray-50"}`}>
                  <span className="text-lg">🏳️</span>
                  <span className="text-sm font-semibold text-txt">{c.nom}</span>
                  {c.indicatif && <span className="text-xs text-txt-muted ml-auto">{c.indicatif}</span>}
                </button>
              ))}
              {filteredCountries.length === 0 && <p className="text-center text-txt-muted text-sm py-6">Aucun pays trouvé</p>}
            </div>
          </div>
        </div>
      )}

      {/* City Picker Modal */}
      {showCityPicker && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowCityPicker(false)}>
          <div className="bg-surface rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-bold text-txt">Choisissez votre ville</p>
              <button onClick={() => setShowCityPicker(false)} className="p-1"><X className="w-5 h-5 text-txt-muted" /></button>
            </div>
            <div className="p-3"><input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Rechercher…" className="w-full border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20" /></div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCities.map((v) => (
                <button key={v.id} onClick={() => { setLocation((p) => ({ ...p, ville: v })); setShowCityPicker(false); setCitySearch(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${location.ville?.id === v.id ? "bg-brand-50 text-brand" : "hover:bg-gray-50"}`}>
                  <span className="text-lg">🏙️</span>
                  <span className="text-sm font-semibold text-txt">{v.nom}</span>
                </button>
              ))}
              {filteredCities.length === 0 && <p className="text-center text-txt-muted text-sm py-6">Aucune ville trouvée</p>}
            </div>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowCategoryPicker(false)}>
          <div className="bg-surface rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-bold text-txt">{commerceKind === "restaurant" ? "Type de cuisine" : "Catégorie"}</p>
              <button onClick={() => setShowCategoryPicker(false)} className="p-1"><X className="w-5 h-5 text-txt-muted" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {categories.map((c) => (
                <button key={c.id} onClick={() => { setBusinessCategoryId(c.id); setFieldErrors((p) => ({ ...p, businessCategoryId: null })); setShowCategoryPicker(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${businessCategoryId === c.id ? "bg-brand-50 text-brand" : "hover:bg-gray-50"}`}>
                  <Tag size={18} className={businessCategoryId === c.id ? "text-brand" : "text-txt-muted"} />
                  <span className="text-sm font-semibold text-txt">{c.nom}</span>
                </button>
              ))}
              {categoriesLoading && <p className="text-center text-txt-muted text-sm py-6">Chargement…</p>}
              {!categoriesLoading && categories.length === 0 && <p className="text-center text-txt-muted text-sm py-6">Aucune catégorie</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
