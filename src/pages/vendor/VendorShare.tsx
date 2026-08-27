import { useState } from "react";
import { Share2, Copy, ExternalLink, CheckCircle2, QrCode } from "lucide-react";
import { useVendorCtx } from "./VendorLayout";

function buildShopUrl(shopId: string): string {
  return `${window.location.origin}/marketplace/${shopId}`;
}

function qrCodeUrl(data: string, size = 280): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10&format=png`;
}

export function VendorShare() {
  const { shop } = useVendorCtx();
  const [copied, setCopied] = useState(false);

  if (!shop) return <p className="text-sm text-gray-500">Aucun commerce trouvé.</p>;

  const shopUrl = buildShopUrl(shop.id);
  const qrUrl = qrCodeUrl(shopUrl);
  const shopName = shop.nom || "Mon commerce";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Partager ${shopName}`,
          text: `Découvrez ${shopName} sur GoLivra ! 🛒`,
          url: shopUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Partager ma boutique</h2>

      {/* Shop info */}
      <div className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-gray-100">
        <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black text-xl">
          {shopName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{shopName}</p>
          <p className="text-xs text-gray-500">{shop.type === "restaurant" ? "Restaurant" : "Boutique"} · GoLivra</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-4">
        <p className="text-sm font-semibold text-gray-600">QR Code</p>
        <p className="text-xs text-gray-400">Scannez pour ouvrir la page de votre boutique</p>
        <div className="mx-auto w-[200px] h-[200px] bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
          <img src={qrUrl} alt="QR Code" className="w-[180px] h-[180px]" />
        </div>
        <p className="text-xs text-gray-400 break-all">{shopUrl}</p>
      </div>

      {/* Share link */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Lien de partage</p>
        <p className="text-sm text-gray-800 break-all font-mono bg-gray-50 rounded-lg p-3">{shopUrl}</p>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={() => void handleShare()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand/90 transition"
        >
          <Share2 size={18} /> Partager
        </button>
        <button
          onClick={() => void handleCopyLink()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
        >
          {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
          {copied ? "Copié !" : "Copier le lien"}
        </button>
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
        >
          <ExternalLink size={18} /> Ouvrir dans le navigateur
        </a>
      </div>

      {/* Tips */}
      <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
        <p className="text-sm font-bold text-brand mb-1.5">💡 Comment partager ?</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Imprimez le QR code et placez-le sur votre devanture</li>
          <li>• Partagez le lien par SMS ou WhatsApp</li>
          <li>• Ajoutez-le à votre compte Instagram / Facebook</li>
        </ul>
      </div>
    </div>
  );
}
