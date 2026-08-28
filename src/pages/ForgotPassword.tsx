import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, KeyRound, Lock, Smartphone } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useGuardedCallback } from "../lib/use-guarded-callback";

type Step = "phone" | "otp" | "done";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+242 ");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const stepIndex = step === "phone" ? 1 : step === "otp" ? 2 : 3;

  const handleRequestOtp = useGuardedCallback(async () => {
    setError(null);
    setFieldErrors({});
    if (!phone || phone.replace(/\s/g, "").length < 9) {
      setFieldErrors({ phone: "Numéro incomplet." });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/otp/request", {
        method: "POST",
        body: JSON.stringify({ telephone: phone.replace(/\s/g, ""), purpose: "reset_password" }),
        headers: { "Content-Type": "application/json" },
      });
      setStep("otp");
    } catch (e: any) {
      setError(e?.message || "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  });

  const handleReset = useGuardedCallback(async () => {
    setError(null);
    setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!otpCode || otpCode.length < 4) errs.otp = "Code invalide.";
    if (newPassword.length < 6) errs.newPassword = "6 caractères minimum.";
    if (newPassword !== confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ telephone: phone.replace(/\s/g, ""), otpCode: otpCode.trim(), newPassword }),
        headers: { "Content-Type": "application/json" },
      });
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Réinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  });

  const stepLabels = ["Téléphone", "Code", "Terminé"];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Gradient backdrop */}
      <div className="absolute inset-x-0 top-0 h-72 pointer-events-none" style={{ background: "linear-gradient(180deg, var(--brand-50) 0%, var(--bg) 100%)" }} />

      <div className="flex-1 flex items-start justify-center px-5 pt-8 pb-24 relative z-[1]">
        <div className="w-full max-w-[420px]">
          {/* Back button */}
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full border flex items-center justify-center mb-6 transition hover:opacity-80" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <ChevronLeft size={22} style={{ color: "var(--brand)" }} />
          </button>

          {/* Title + subtitle */}
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--txt)" }}>Mot de passe oublié</h1>
          <p className="text-sm mb-6" style={{ color: "var(--txt-muted)" }}>
            {step === "phone"
              ? "Nous enverrons un code de vérification sur\nvotre numéro."
              : step === "otp"
                ? "Saisissez le code reçu et choisissez un\nnouveau mot de passe."
                : "Votre mot de passe a été mis à jour."}
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {stepLabels.map((label, i) => {
              const active = i + 1 === stepIndex;
              const done = i + 1 < stepIndex;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full h-1.5 rounded-full transition-all"
                    style={{ background: done ? "var(--brand)" : active ? "var(--brand)" : "var(--border)" }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: done || active ? "var(--brand)" : "var(--txt-muted)" }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Step: Phone */}
          {step === "phone" && (
            <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl text-sm font-semibold" style={{ background: "var(--error-soft)", color: "var(--error)" }}>
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-lg leading-none">&times;</button>
                </div>
              )}
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Numéro de téléphone</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border mb-2" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.phone ? "var(--error)" : "var(--border)" }}>
                <Smartphone size={18} style={{ color: "var(--brand)" }} />
                <input
                  type="tel"
                  placeholder="+242 06 XXX XX XX"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFieldErrors({}); }}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--txt)" }}
                />
              </div>
              {fieldErrors.phone && <p className="text-[11px] mb-3 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.phone}</p>}
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)", color: "#FFFFFF" }}
              >
                {loading ? "Envoi…" : <>Envoyer le code <ArrowRight size={16} /></>}
              </button>
            </div>
          )}

          {/* Step: OTP + New Password */}
          {step === "otp" && (
            <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl text-sm font-semibold" style={{ background: "var(--error-soft)", color: "var(--error)" }}>
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-lg leading-none">&times;</button>
                </div>
              )}

              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Code de vérification</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border mb-4" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.otp ? "var(--error)" : "var(--border)" }}>
                <KeyRound size={18} style={{ color: "var(--brand)" }} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="XXXX"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setFieldErrors((p) => ({ ...p, otp: undefined })); }}
                  className="flex-1 bg-transparent text-sm tracking-widest"
                  style={{ color: "var(--txt)" }}
                />
              </div>
              {fieldErrors.otp && <p className="text-[11px] mb-3 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.otp}</p>}

              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Nouveau mot de passe</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border mb-4" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.newPassword ? "var(--error)" : "var(--border)" }}>
                <Lock size={18} style={{ color: "var(--brand)" }} />
                <input
                  type="password"
                  placeholder="6 caractères minimum"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((p) => ({ ...p, newPassword: undefined })); }}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--txt)" }}
                />
              </div>
              {fieldErrors.newPassword && <p className="text-[11px] mb-3 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.newPassword}</p>}

              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Confirmer le mot de passe</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border mb-4" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.confirmPassword ? "var(--error)" : "var(--border)" }}>
                <Lock size={18} style={{ color: "var(--brand)" }} />
                <input
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--txt)" }}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="text-[11px] mb-3 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.confirmPassword}</p>}

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)", color: "#FFFFFF" }}
              >
                {loading ? "Réinitialisation…" : <>Réinitialiser <ArrowRight size={16} /></>}
              </button>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="rounded-2xl p-8 border shadow-sm text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}>
                <Check size={30} color="#FFF" strokeWidth={3} />
              </div>
              <h2 className="text-lg font-extrabold mb-2" style={{ color: "var(--txt)" }}>Mot de passe réinitialisé</h2>
              <p className="text-sm mb-6" style={{ color: "var(--txt-muted)" }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <Link
                to="/auth"
                className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)", color: "#FFFFFF" }}
              >
                Se connecter <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
