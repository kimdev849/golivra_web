import { getApiOrigin } from './config';

export { getApiOrigin };

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  // In dev mode, use relative path (Vite proxy handles CORS)
  // In production, use full origin
  if (import.meta.env.DEV) {
    return apiPath;
  }
  return `${getApiOrigin()}${apiPath}`;
}

// ─── Token management (localStorage on web) ──────────────────────────────────

const TOKEN_KEY = 'golivra_session_token';

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { /* ignore */ }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

// ─── UX copy (matches mobile ux-copy.ts) ─────────────────────────────────────

export const UX_ERRORS: Readonly<Record<string, string>> = {
  network: 'Problème de connexion. Vérifiez votre internet, puis réessayez.',
  generic: 'Une erreur est survenue. Réessayez dans un instant.',
  auth: 'Numéro ou mot de passe incorrect. Vérifiez vos informations, puis réessayez.',
  otp: 'Ce code est invalide ou a expiré. Demandez un nouveau code.',
  session: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  notFound: 'Nous n\'avons pas trouvé ce que vous cherchez.',
  forbidden: 'Vous n\'avez pas la permission de faire cette action.',
  serverOutdated:
    "Cette fonction n'est pas encore disponible. Réessayez dans quelques instants — si le problème persiste, contactez l'assistance.",
};

const BACKEND_MESSAGE_MAP: Record<string, string> = {
  'sous-commande introuvable': 'Commande introuvable.',
  'jeton de session invalide': UX_ERRORS.session,
  'session révoquée': UX_ERRORS.session,
  'en-tête authorization manquant': UX_ERRORS.session,
  'action non autorisée': UX_ERRORS.forbidden,
  'établissement introuvable': 'Commerce introuvable.',
};

export function friendlyErrorMessage(raw: unknown, fallback: string = UX_ERRORS.generic): string {
  const msg = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';
  const trimmed = msg.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();

  if (/network request failed|failed to fetch|unable to resolve host|econnrefused|timeout|connexion impossible/i.test(lower)) {
    return UX_ERRORS.network;
  }
  if (/cannot (get|put|post|patch|delete)\b/i.test(lower)) {
    return UX_ERRORS.serverOutdated;
  }
  if (/session expirée|session révoquée|jeton|token|unauthorized|401/i.test(lower)) {
    return UX_ERRORS.session;
  }
  if (/mot de passe|credentials|identifiant|403 forbidden/i.test(lower) && /incorrect|invalide|refus/i.test(lower)) {
    return UX_ERRORS.auth;
  }
  if (/otp|code.*sms|vérification/i.test(lower) && (/invalide|expir|introuvable|incorrect/i.test(lower))) {
    return UX_ERRORS.otp;
  }

  for (const [needle, replacement] of Object.entries(BACKEND_MESSAGE_MAP)) {
    if (lower.includes(needle)) return replacement;
  }

  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(lower)) {
    return trimmed;
  }

  if (trimmed.length > 180) {
    return trimmed.slice(0, 177) + '…';
  }

  return trimmed;
}

// ─── API Fetch (matches mobile exactly) ──────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 15_000;

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
  jsonBody?: unknown;
  skipIncidentReport?: boolean;
  timeoutMs?: number;
};

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, jsonBody, headers: initHeaders, body, skipIncidentReport, timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const headers = new Headers(initHeaders);
  const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Timeout via AbortController
  let controller: AbortController | null = null;
  let abortTimer: ReturnType<typeof setTimeout> | null = null;
  if (timeoutMs > 0) {
    controller = new AbortController();
    abortTimer = setTimeout(() => controller?.abort(), timeoutMs);
    (rest as { signal?: AbortSignal }).signal = controller.signal;
  }

  headers.set('X-Request-Id', requestId);
  headers.set('X-Client-Source', 'web');
  headers.set('X-App-Version', '1.0.0-web');
  headers.set('X-Platform', 'web');

  let finalBody = body;
  if (jsonBody !== undefined) {
    headers.set('content-type', 'application/json');
    finalBody = JSON.stringify(jsonBody);
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const url = apiUrl(path);
  const method = (rest.method || 'GET').toUpperCase();

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers, body: finalBody });
    if (abortTimer) clearTimeout(abortTimer);
  } catch (cause) {
    if (abortTimer) clearTimeout(abortTimer);
    const aborted =
      typeof cause === 'object' && cause !== null &&
      ((cause as Error).name === 'AbortError' || /abort/i.test((cause as Error).message ?? ''));
    const message = aborted ? 'Connexion lente. Réessayez.' : friendlyErrorMessage(cause, UX_ERRORS.network);
    throw new Error(message);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? friendlyErrorMessage(String((parsed as { message: unknown }).message))
        : trimmedErrorMessage(text, res.status);

    const code =
      typeof parsed === 'object' && parsed !== null && 'code' in parsed
        ? String((parsed as { code: unknown }).code)
        : undefined;

    const err = new Error(message) as Error & { requestId?: string; code?: string };
    err.requestId = requestId;
    err.code = code;
    throw err;
  }

  return parsed as T;
}

function trimmedErrorMessage(text: string, status: number): string {
  const trimmed = text.trim();
  if (/cannot (get|put|post|patch|delete)\b/i.test(trimmed)) return UX_ERRORS.serverOutdated;
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return UX_ERRORS.generic;
  if (status === 401) return UX_ERRORS.session;
  if (status === 403) return UX_ERRORS.forbidden;
  return friendlyErrorMessage(trimmed || UX_ERRORS.generic);
}

// ─── Auth-specific API calls (matches mobile auth.ts) ────────────────────────

export type AuthUser = {
  id: string;
  nom: string;
  prenom?: string;
  telephone: string;
  imageUrl?: string | null;
  photo_url?: string | null;
  roleId: string | number;
  role?: string | null;
};

export type AuthSession = {
  token: string;
  expireLe: string;
  user: AuthUser;
};

export async function loginAccount(payload: {
  telephone: string;
  motDePasse: string;
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/auth/login', {
    method: 'POST',
    jsonBody: payload,
  });
}

export async function registerAccount(payload: {
  nom: string;
  telephone: string;
  motDePasse: string;
  otpCode: string;
  role: 'client' | 'restaurateur' | 'commercant';
  imageUrl?: string | null;
  pays_id?: string | null;
  ville_id?: string | null;
}): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/auth/register', {
    method: 'POST',
    jsonBody: payload,
  });
}

export type RegisterVendorPayload = {
  nom: string;
  telephone: string;
  motDePasse: string;
  otpCode: string;
  role: 'restaurateur' | 'commercant';
  imageUrl?: string | null;
  pays_id?: string | null;
  ville_id?: string | null;
  enterprise: {
    type: 'restaurant' | 'boutique';
    nom: string;
    telephone: string;
    categorieId: string;
    description?: string | null;
    adresse?: string;
    imageUrl?: string | null;
  };
};

export type RegisterVendorResult = AuthSession & {
  enterprise: Record<string, unknown>;
};

export async function registerVendorAccount(payload: RegisterVendorPayload): Promise<RegisterVendorResult> {
  return apiFetch<RegisterVendorResult>('/api/auth/register-vendor', {
    method: 'POST',
    jsonBody: payload,
  });
}

export async function requestOtp(telephone: string, purpose: 'register' | 'reset_password' = 'register'): Promise<{ message: string; testMode?: boolean; otpCode?: string }> {
  const body = purpose === 'reset_password' ? { telephone, purpose } : { telephone };
  return apiFetch('/api/otp/request', {
    method: 'POST',
    jsonBody: body,
  });
}

export async function logoutRemote(token: string): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
    token,
    jsonBody: {},
  });
}

export async function resetPassword(payload: {
  telephone: string;
  otpCode: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    jsonBody: payload,
  });
}
