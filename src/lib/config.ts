const DEFAULT_API_ORIGIN = 'https://golivra-api.onrender.com';

export function getApiOrigin(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let origin = (envUrl || DEFAULT_API_ORIGIN).trim().replace(/\/+$/, '');
  if (origin.toLowerCase().endsWith('/api')) {
    origin = origin.slice(0, -4);
  }
  return origin;
}
