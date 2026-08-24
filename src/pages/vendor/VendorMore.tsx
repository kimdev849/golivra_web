import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, Bell, Building2, ChevronRight, Clock, CreditCard,
  HelpCircle, MapPin, Package, Settings, Truck, User, Wallet,
} from "lucide-react";
import { useVendorCtx } from "./VendorLayout";
import { useAuthStore } from "../../store";

function MenuRow({ icon, title, subtitle, to, danger }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  to: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-muted/60 transition ${danger ? "active:bg-red-50" : "active:bg-brand/5"}`}
    >
      <div className={`w-[42px] h-[42px] rounded-[14px] flex items-center justify-center border border-line ${danger ? "bg-red-50" : "bg-brand/10"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold ${danger ? "text-red-500" : "text-txt"}`}>{title}</p>
        <p className="text-xs text-txt-muted leading-tight mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-txt-muted flex-shrink-0" />
    </Link>
  );
}

export function VendorMore() {
  const navigate = useNavigate();
  const { shop } = useVendorCtx();
  const logout = useAuthStore((s) => s.logout);
  const isOnline = shop?.enLigne === true;
  const commerceType = shop?.type === "restaurant" ? "restaurant" : "boutique";

  const handleLogout = () => {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <h1 className="text-xl font-extrabold text-txt">PLUS</h1>

      {/* ── Shop hero ── */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-line">
        {shop?.avatar ? (
          <img src={shop.avatar} alt={shop.nom} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-line" />
        ) : (
          <div className="w-[60px] h-[60px] rounded-full bg-brand/10 border-2 border-line flex items-center justify-center">
            <Building2 size={24} className="text-brand/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[19px] font-extrabold text-txt">{shop?.nom || "Mon commerce"}</p>
          <p className="text-[13px] text-txt-muted mt-0.5">{shop?.type === "restaurant" ? "Restaurant" : "Boutique"}</p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold border ${isOnline ? "bg-green-50 border-green-200 text-brand" : "bg-gray-50 border-gray-200 text-txt-muted"}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-brand animate-pulse" : "bg-gray-400"}`} />
          {isOnline ? "En ligne" : "Hors ligne"}
        </span>
      </div>

      {/* ── Raccourcis ── */}
      <section>
        <p className="text-[11px] font-extrabold text-txt-muted uppercase tracking-wider mb-2.5 ml-1">Raccourcis</p>
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <MenuRow
            icon={<BarChart3 size={20} className="text-brand" />}
            title="Statistiques"
            subtitle="Revenus et performances"
            to="/vendor/statistics"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Wallet size={20} className="text-brand" />}
            title="Portefeuille"
            subtitle="Solde et transactions"
            to="/vendor/wallet"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Package size={20} className="text-brand" />}
            title="Catalogue"
            subtitle="Voir mes produits"
            to="/vendor/catalog"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Truck size={20} className="text-brand" />}
            title="Livraisons en cours"
            subtitle="Suivi livreur"
            to="/vendor/deliveries"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Bell size={20} className="text-brand" />}
            title="Notifications"
            subtitle="Activité boutique"
            to="/vendor/notifications"
          />
        </div>
      </section>

      {/* ── Commerce ── */}
      <section>
        <p className="text-[11px] font-extrabold text-txt-muted uppercase tracking-wider mb-2.5 ml-1">
          {commerceType === "restaurant" ? "Restaurant" : "Boutique"}
        </p>
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <MenuRow
            icon={<Building2 size={20} className="text-brand" />}
            title={commerceType === "restaurant" ? "Informations restaurant" : "Informations boutique"}
            subtitle="Nom, description, contact"
            to="/vendor/shop-info"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<MapPin size={20} className="text-brand" />}
            title="Adresses"
            subtitle="Arrondissement et adresse détaillée"
            to="/vendor/shop-addresses"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<CreditCard size={20} className="text-brand" />}
            title="Moyens de paiement"
            subtitle="Modalités de paiement clients"
            to="/vendor/shop-payments"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Clock size={20} className="text-brand" />}
            title="Horaires d'ouverture"
            subtitle="Jours et heures de commande"
            to="/vendor/horaires"
          />
        </div>
      </section>

      {/* ── Compte ── */}
      <section>
        <p className="text-[11px] font-extrabold text-txt-muted uppercase tracking-wider mb-2.5 ml-1">Compte de connexion</p>
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <MenuRow
            icon={<User size={20} className="text-brand" />}
            title="Connexion & sécurité"
            subtitle="Mot de passe et suppression du compte"
            to="/account-settings"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<Settings size={20} className="text-brand" />}
            title="Réglages"
            subtitle="Thème, taille du texte, notifications"
            to="/settings"
          />
          <div className="ml-[72px] h-px bg-line" />
          <MenuRow
            icon={<HelpCircle size={20} className="text-brand" />}
            title="Centre d'aide"
            subtitle="FAQ et support"
            to="/vendor/help-center"
          />
        </div>
      </section>

      {/* ── Logout ── */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 text-center text-sm font-bold text-red-500 bg-white border border-line rounded-xl hover:bg-red-50 transition active:scale-[0.98]"
      >
        Se déconnecter
      </button>
    </div>
  );
}
