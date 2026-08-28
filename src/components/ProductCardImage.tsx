import { useState, useCallback } from 'react';
import { Package } from 'lucide-react';
import { resolveImageUrl } from '../lib/images';

/**
 * Renders a product image with automatic fallback to a placeholder icon.
 * Unlike the previous approach (onError hiding the <img>), this component
 * swaps to a visible placeholder when the image fails to load.
 */
export function ProductCardImage({ product, className }: { product: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const url = resolveImageUrl(product);

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  if (!url || imgError) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`}>
        <Package size={28} className="text-brand/20" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}
