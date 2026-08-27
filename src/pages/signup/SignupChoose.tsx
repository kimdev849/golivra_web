import { Link } from "react-router-dom";
import { ChevronRight, ShoppingBag, Store, User, UtensilsCrossed } from "lucide-react";

const ROLES = [
  {
    href: "/signup/client",
    icon: User,
    title: "Commander sur GoLivra",
    subtitle: "Commandez dans vos restaurants et boutiques préférés.",
    iconBg: "bg-accent-500",
    popular: true,
  },
  {
    href: "/signup/restaurant",
    icon: UtensilsCrossed,
    title: "Inscrire mon restaurant",
    subtitle: "Recevez et gérez vos commandes sur GoLivra.",
    iconBg: "bg-brand-700",
  },
  {
    href: "/signup/boutique",
    icon: Store,
    title: "Inscrire ma boutique",
    subtitle: "Vendez vos produits et gérez vos commandes.",
    iconBg: "bg-brand-700",
  },
];

export function SignupChoosePage() {
  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/auth" className="inline-block mb-4">
            <img src="/assets/images/logo25292922882.png" alt="GoLivra" className="h-14 mx-auto" />
          </Link>
          <h1 className="text-[26px] leading-8 font-black text-txt">Que souhaitez-vous faire ?</h1>
          <p className="text-sm text-txt-secondary mt-2">Choisissez ce qui vous correspond.</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3.5">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                to={r.href}
                className="relative flex items-center gap-4 bg-surface border-2 border-line rounded-[18px] p-4 hover:shadow-lg transition active:scale-[0.99]"
              >
                {r.popular && (
                  <div className="absolute -top-2.5 right-4 bg-accent-400 text-accent-900 text-[11px] font-black tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                    <ShoppingBag size={11} strokeWidth={2.5} />
                    Populaire
                  </div>
                )}
                <div className={`w-[50px] h-[50px] rounded-[14px] ${r.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={24} color="#FFFFFF" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <p className="text-[16.5px] font-black text-txt">{r.title}</p>
                  <p className="text-[12.5px] text-txt-muted leading-tight mt-0.5">{r.subtitle}</p>
                </div>
                <ChevronRight size={22} className="text-txt" strokeWidth={2.5} />
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-9">
          <p className="text-sm font-bold text-txt-muted">Déjà un compte ?</p>
          <Link
            to="/auth"
            className="inline-block mt-3.5 border-2 border-brand text-brand rounded-full px-8 py-3.5 text-base font-extrabold hover:bg-brand-50 transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
