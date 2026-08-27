/**
 * Safe localStorage wrapper.
 * Handles "Access is denied" errors in incognito mode, iframes, or
 * restricted browser contexts. Falls back to in-memory storage.
 */

let memoryFallback: Record<string, string> = {};

function canUseLocalStorage(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = canUseLocalStorage();

export function safeGetItem(key: string): string | null {
  if (hasLocalStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryFallback[key] ?? null;
    }
  }
  return memoryFallback[key] ?? null;
}

export function safeSetItem(key: string, value: string): void {
  if (hasLocalStorage) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      /* fallback to memory */
    }
  }
  memoryFallback[key] = value;
}

export function safeRemoveItem(key: string): void {
  if (hasLocalStorage) {
    try {
      localStorage.removeItem(key);
      return;
    } catch {
      /* fallback to memory */
    }
  }
  delete memoryFallback[key];
}
