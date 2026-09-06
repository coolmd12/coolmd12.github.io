/** Remember last in-app page so Profile can return there after Save. */

const LAST_PATH_KEY = 'gomun:lastPath';

const SKIP_PATHS = new Set([
  '/profile',
  '/login',
  '/signup',
  '/choose-username',
  '/welcome',
  '/setup',
]);

export function rememberLastAppPath(pathname: string, search = ''): void {
  if (!pathname || SKIP_PATHS.has(pathname)) return;
  try {
    sessionStorage.setItem(LAST_PATH_KEY, `${pathname}${search}`);
  } catch {
    /* private mode / quota */
  }
}

export function getLastAppPath(): string | null {
  try {
    const raw = sessionStorage.getItem(LAST_PATH_KEY);
    if (!raw || !raw.startsWith('/')) return null;
    const pathOnly = raw.split('?')[0] || raw;
    if (SKIP_PATHS.has(pathOnly)) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Prefer router location.state.from, then session memory, then fallback. */
export function resolveReturnPath(
  fromState: unknown,
  fallback: string,
): string {
  const from =
    typeof fromState === 'object' &&
    fromState !== null &&
    'from' in fromState &&
    typeof (fromState as { from: unknown }).from === 'string'
      ? (fromState as { from: string }).from
      : null;
  if (from && from.startsWith('/') && !SKIP_PATHS.has(from.split('?')[0] || from)) {
    return from;
  }
  return getLastAppPath() || fallback;
}
