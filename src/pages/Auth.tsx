import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Moon, Smartphone, Sun, UserPlus } from "lucide-react";
import { useAuthStore, homePathForRole } from "../store";
import { apiFetch, setSessionToken } from "../lib/api";
import { toast } from "sonner";

function applyTheme(t: string) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else if (t === "light") root.classList.remove("dark");
  else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("golivra_theme", t);
}

export function AuthPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("+242 ");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
  const passwordRef = useRef<HTMLInputElement>(null);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const canSubmit = phone.replace(/\s/g, "").length >= 9 && password.length >= 6 && !loading;

  const handleLogin = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await apiFetch<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ telephone: phone.replace(/\s/g, ""), motDePasse: password }),
        headers: { "Content-Type": "application/json" },
      });
      if (result?.token) {
        setSessionToken(result.token);
        setSession({ token: result.token, expireLe: result.expireLe || new Date(Date.now() + 86400000).toISOString(), user: result.user });
        navigate(homePathForRole(result.user?.role), { replace: true });
      } else {
        setError("Numéro ou mot de passe incorrect.");
      }
    } catch (e: any) {
      setError(e?.message || "Numéro ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Gradient backdrop (like mobile AuthBackdrop) ── */}
      <div className="absolute inset-x-0 top-0 h-72 pointer-events-none" style={{ background: "linear-gradient(180deg, var(--brand-50) 0%, var(--bg) 100%)" }} />

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => applyTheme(isDark ? "light" : "dark")}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center border transition"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {isDark ? <Sun size={20} style={{ color: "var(--brand)" }} /> : <Moon size={20} style={{ color: "var(--brand)" }} />}
      </button>

      <div className="flex-1 flex items-start justify-center px-5 pt-16 pb-24 relative z-[1]">
        <div className="w-full max-w-[420px]">
          {/* ── Logo ── */}
          <div className="flex flex-col items-center mb-8">
            <img src="/assets/images/logo.png" alt="GoLivra" className="h-16 w-auto mb-4" />
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--txt)" }}>Bon retour</h1>
            <p className="text-sm mt-1 text-center" style={{ color: "var(--txt-secondary)" }}>
              Vos favoris, vos commandes,<br />livrés en un clin d'œil.
            </p>
          </div>

          {/* ── Form card ── */}
          <div className="rounded-2xl p-6 border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl text-sm font-semibold" style={{ background: "var(--error-soft)", color: "var(--error)" }}>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-lg leading-none">&times;</button>
              </div>
            )}

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Numéro de téléphone</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border transition" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.phone ? "var(--error)" : "var(--border)" }}>
                <Smartphone size={18} style={{ color: "var(--brand)" }} />
                <input
                  type="tel"
                  placeholder="+242 06 XXX XX XX"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--txt)" }}
                />
              </div>
              {fieldErrors.phone && <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.phone}</p>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--txt-secondary)" }}>Mot de passe</label>
              <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl border transition" style={{ background: "var(--surface-muted)", borderColor: fieldErrors.password ? "var(--error)" : "var(--border)" }}>
                <Lock size={18} style={{ color: "var(--brand)" }} />
                <input
                  ref={passwordRef}
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  className="flex-1 bg-transparent text-sm"
                  style={{ color: "var(--txt)" }}
                />
                <button onClick={() => setPasswordVisible((v) => !v)} className="p-1">
                  {passwordVisible ? <EyeOff size={18} style={{ color: "var(--txt-muted)" }} /> : <Eye size={18} style={{ color: "var(--txt-muted)" }} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--error)" }}>{fieldErrors.password}</p>}
            </div>

            {/* Forgot password */}
            <Link to="/forgot-password" className="block text-sm font-semibold mb-5 transition hover:underline" style={{ color: "var(--brand)" }}>
              Mot de passe oublié ?
            </Link>

            {/* Submit button */}
            <button
              onClick={handleLogin}
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)", color: "#FFFFFF" }}
            >
              {loading ? (
                <span>Connexion…</span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--txt-muted)" }}>ou</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {/* Signup button (accent gradient like mobile) */}
            <Link
              to="/signup"
              className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:shadow-md"
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)", color: "#1A1A1A" }}
            >
              <UserPlus size={18} />
              Créer un compte gratuit
            </Link>
          </div>

          {/* Beta badge */}
          <div className="flex items-center justify-center gap-1.5 mt-5 opacity-70">
            <KeyRound size={12} style={{ color: "var(--brand)" }} />
            <span className="text-[12px] font-semibold" style={{ color: "var(--txt-muted)" }}>GoLivra · Version bêta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
