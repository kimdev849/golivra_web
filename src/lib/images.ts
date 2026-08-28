import { getApiOrigin } from './config';

/**
 * If url is relative (starts with /), prepend the API origin so images
 * hosted on the backend (e.g. /api/images/products/:id) resolve correctly
 * when the web app is on a different origin.
 */
export function resolveUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${getApiOrigin()}${url}`;
  }
  return url;
}

/**
 * Resolve the best available image URL from a product or enterprise object.
 * Handles various backend shapes: image_url, images_urls, logo_url, etc.
 */
export function resolveImageUrl(p: any): string | null {
  // Try images_urls array first (gallery)
  if (Array.isArray(p?.images_urls)) {
    for (const url of p.images_urls) {
      if (typeof url === 'string' && url.trim()) return resolveUrl(url.trim());
    }
  }
  // Try single image_url
  if (typeof p?.image_url === 'string' && p.image_url.trim()) {
    return resolveUrl(p.image_url.trim());
  }
  // Try logo_url (for enterprises)
  if (typeof p?.logo_url === 'string' && p.logo_url.trim()) {
    return resolveUrl(p.logo_url.trim());
  }
  return null;
}

/**
 * Resolve enterprise image (logo or banner).
 */
export function resolveEnterpriseImage(e: any): string | null {
  if (typeof e?.banniere_url === 'string' && e.banniere_url.trim()) {
    return resolveUrl(e.banniere_url.trim());
  }
  return resolveImageUrl(e);
}
