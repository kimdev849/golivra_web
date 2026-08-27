import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken } from "../lib/api";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";
import { useAuthStore } from "../store";
import {
  Bell, ChevronLeft, ChevronRight, CreditCard, Info, KeyRound, Mail,
  Moon, Smartphone, Sun, Type, Zap,
} from "lucide-react";
import { useState, useEffect } from "react";

type ThemeOption = { id: string; label: string; icon: typeof Sun };

const THEME_OPTIONS: ThemeOption[] = [
  { id: "light", label: "Clair", icon: Sun },
  { id: "dark", label: "Sombre", icon: Moon },
  { id: "system", label: "Système", icon: Smartphone },
];

const TEXT_SCALE_OPTIONS = [
  { key: "small", label: "A", size: 14 },
  { key: "medium", label: "A", size: 16 },
  { key: "large", label: "A", size: 18 },
];

/** Apply theme to <html> immediately */
function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
  safeSetItem("golivra_theme", theme);
}

/** Apply text scale to <html> immediately */
function applyTextScale(scale: string) {
  const sizes: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
  document.documentElement.style.fontSize = sizes[scale] || "16px";
  safeSetItem("golivra_text_scale", scale);
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = getSessionToken();

  const [theme, setTheme] = useState<string>(() => safeGetItem("golivra_theme") || "light");
  const [textScale, setTextScale] = useState<string>(() => safeGetItem("golivra_text_scale") || "medium");
  const [darkModeShortcut, setDarkModeShortcut] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load notification preferences
  useEffect(() => {
    if (!token) return;
    apiFetch("/api/preferences", { token })
      .then((prefs: any) => {
        setNotifPush(prefs?.notif_push_enabled ?? true);
        setNotifEmail(prefs?.notif_email_enabled ?? true);
      })
      .catch(() => {});
  }, [token]);

  const saveTheme = (t: string) => {
    setTheme(t);
    applyTheme(t);
  };

  const saveTextScale = (s: string) => {
    setTextScale(s);
    applyTextScale(s);
  };

  const patchNotif = async (patch: { notif_push_enabled?: boolean; notif_email_enabled?: boolean }) => {
    if (!token) return;
    setSaving(true);
    try {
      const prefs = await apiFetch<any>("/api/preferences", { method: "PATCH", token, jsonBody: patch });
      if (prefs) {
        setNotifPush(prefs.notif_push_enabled ?? true);
        setNotifEmail(prefs.notif_email_enabled ?? true);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6" style={{ background: "var(--bg)", color: "var(--txt)" }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full border flex items-center justify-center transition" style={{ background: "var(--brand-50)", borderColor: "var(--border)" }}>
          <ChevronLeft size={26} style={{ color: "var(--brand-deep)" }} />
        </button>
        <h1 className="flex-1 text-lg font-extrabold text-center" style={{ color: "var(--txt)" }}>Réglages</h1>
        <div className="w-11" />
      </div>

      {saving && <p className="text-xs mb-3" style={{ color: "var(--txt-muted)" }}>Enregistrement…</p>}

      {/* ── Apparence ── */}
      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1" style={{ color: "var(--brand-deep)" }}>Apparence</p>
      <div className="rounded-2xl overflow-hidden mb-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {THEME_OPTIONS.map((opt, idx) => {
          const active = theme === opt.id;
          const Icon = opt.icon;
          return (
            <div key={opt.id}>
              <button
                onClick={() => saveTheme(opt.id)}
                className="w-full flex items-center gap-3 px-3.5 py-3.5 transition"
                style={{ background: active ? "var(--brand-50)" : "transparent" }}
              >
                <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: active ? "var(--brand-50)" : "var(--surface-muted)" }}>
                  <Icon size={20} style={{ color: active ? "var(--brand)" : "var(--txt-muted)" }} />
                </div>
                <span className="flex-1 text-left text-sm font-semibold" style={{ color: active ? "var(--brand)" : "var(--txt)" }}>{opt.label}</span>
                {active && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--brand)" }} />}
              </button>
              {idx < THEME_OPTIONS.length - 1 && <div className="ml-[66px] h-px" style={{ background: "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      {/* ── Taille du texte ── */}
      <div className="rounded-2xl overflow-hidden mb-3 p-3.5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Type size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Taille du texte</p>
            <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Affichez les textes plus petits ou plus grands</p>
          </div>
        </div>
        <div className="flex rounded-xl p-0.5 gap-1" style={{ background: "var(--surface-muted)" }}>
          {TEXT_SCALE_OPTIONS.map((opt) => {
            const active = textScale === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => saveTextScale(opt.key)}
                className="flex-1 py-2.5 rounded-[10px] text-center font-semibold transition"
                style={{
                  background: active ? "var(--brand)" : "transparent",
                  color: active ? "#FFFFFF" : "var(--txt-secondary)",
                  fontSize: opt.size,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dark mode shortcut ── */}
      <div className="flex items-center gap-2.5 px-1 py-2 mb-4">
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Raccourci mode sombre</p>
          <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Forcer le mode sombre</p>
        </div>
        <button
          onClick={() => {
            const next = !darkModeShortcut;
            setDarkModeShortcut(next);
            if (next) { saveTheme("dark"); } else { saveTheme("light"); }
          }}
          className="w-12 h-7 rounded-full transition-colors"
          style={{ background: darkModeShortcut ? "var(--brand)" : "var(--border-strong)" }}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: darkModeShortcut ? "translateX(24px)" : "translateX(4px)" }} />
        </button>
      </div>

      {/* ── Notifications (connecté uniquement) ── */}
      {token && <>
      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1" style={{ color: "var(--brand-deep)" }}>Notifications</p>
      <div className="rounded-2xl overflow-hidden mb-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => navigate("/notifications")} className="w-full flex items-center gap-3 px-3.5 py-3.5 transition hover:opacity-80">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Bell size={20} style={{ color: "var(--brand)" }} />
          </div>
          <span className="flex-1 text-left text-sm font-semibold" style={{ color: "var(--txt)" }}>Mes notifications</span>
          <ChevronRight size={18} style={{ color: "var(--txt-muted)" }} />
        </button>
        <div className="ml-[66px] h-px" style={{ background: "var(--border)" }} />

        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Bell size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Alertes in-app</p>
            <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Notifications push</p>
          </div>
          <button
            onClick={() => { const v = !notifPush; setNotifPush(v); patchNotif({ notif_push_enabled: v }); }}
            className="w-12 h-7 rounded-full transition-colors"
            style={{ background: notifPush ? "var(--brand)" : "var(--border-strong)" }}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: notifPush ? "translateX(24px)" : "translateX(4px)" }} />
          </button>
        </div>
        <div className="ml-[66px] h-px" style={{ background: "var(--border)" }} />

        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Mail size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>E-mail</p>
            <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Notifications par e-mail</p>
          </div>
          <button
            onClick={() => { const v = !notifEmail; setNotifEmail(v); patchNotif({ notif_email_enabled: v }); }}
            className="w-12 h-7 rounded-full transition-colors"
            style={{ background: notifEmail ? "var(--brand)" : "var(--border-strong)" }}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: notifEmail ? "translateX(24px)" : "translateX(4px)" }} />
          </button>
        </div>
      </div>

      </>}

      {/* ── Sécurité (connecté uniquement) ── */}
      {token && <>
      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1" style={{ color: "var(--brand-deep)" }}>Sécurité</p>
      <div className="rounded-2xl overflow-hidden mb-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Zap size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Verrouillage biométrique</p>
            <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Déverrouillage par empreinte</p>
          </div>
          <div className="w-12 h-7 rounded-full" style={{ background: "var(--border-strong)" }}>
            <div className="w-5 h-5 rounded-full bg-white shadow translate-x-1" />
          </div>
        </div>
      </div>
      </>}

      {/* ── Compte (connecté uniquement) ── */}
      {token && <>
      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1" style={{ color: "var(--brand-deep)" }}>Compte</p>
      <div className="rounded-2xl overflow-hidden mb-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Link to="/account-settings" className="flex items-center gap-3 px-3.5 py-3.5 transition hover:opacity-80">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <KeyRound size={20} style={{ color: "var(--brand)" }} />
          </div>
          <span className="flex-1 text-left text-sm font-semibold" style={{ color: "var(--txt)" }}>Connexion & sécurité</span>
          <ChevronRight size={18} style={{ color: "var(--txt-muted)" }} />
        </Link>
        <div className="ml-[66px] h-px" style={{ background: "var(--border)" }} />
        <Link to="/payment-methods" className="flex items-center gap-3 px-3.5 py-3.5 transition hover:opacity-80">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <CreditCard size={20} style={{ color: "var(--brand)" }} />
          </div>
          <span className="flex-1 text-left text-sm font-semibold" style={{ color: "var(--txt)" }}>Paiements</span>
          <ChevronRight size={18} style={{ color: "var(--txt-muted)" }} />
        </Link>
      </div>

      </>}

      {/* ── À propos ── */}
      <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2 ml-1" style={{ color: "var(--brand-deep)" }}>À propos</p>
      <div className="rounded-2xl overflow-hidden mb-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Link to="/help-center" className="flex items-center gap-3 px-3.5 py-3.5 transition hover:opacity-80">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Info size={20} style={{ color: "var(--brand)" }} />
          </div>
          <span className="flex-1 text-left text-sm font-semibold" style={{ color: "var(--txt)" }}>Centre d'aide</span>
          <ChevronRight size={18} style={{ color: "var(--txt-muted)" }} />
        </Link>
        <div className="ml-[66px] h-px" style={{ background: "var(--border)" }} />
        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <div className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: "var(--brand-50)" }}>
            <Info size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>Version GoLivra</p>
            <p className="text-xs" style={{ color: "var(--txt-muted)" }}>1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
