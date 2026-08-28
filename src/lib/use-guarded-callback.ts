import { useRef, useCallback } from 'react';

/**
 * Wraps an async callback to prevent double-execution.
 * After the first call, subsequent calls are ignored for `delay` ms.
 * Works with both sync and async functions.
 */
export function useGuardedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay = 500,
): T {
  const guard = useRef(false);

  return useCallback(
    (...args: any[]) => {
      if (guard.current) return;
      guard.current = true;
      try {
        const result = fn(...args);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).finally(() => {
            setTimeout(() => { guard.current = false; }, delay);
          });
        } else {
          setTimeout(() => { guard.current = false; }, delay);
        }
        return result;
      } catch (e) {
        setTimeout(() => { guard.current = false; }, delay);
        throw e;
      }
    },
    [fn, delay],
  ) as T;
}
