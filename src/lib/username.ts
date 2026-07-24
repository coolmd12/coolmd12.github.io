const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._]{1,30}[a-z0-9])?$/;

const RESERVED = new Set([
  'admin',
  'administrator',
  'gomun',
  'support',
  'help',
  'mod',
  'moderator',
  'official',
  'root',
  'system',
  'teacher',
  'student',
  'parent',
  'guardian',
  'null',
  'undefined',
  'me',
  'you',
]);

/** Discord-style: 3–32 chars, lowercase letters/digits/._ ; must start & end alphanumeric. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): { ok: true; username: string } | { ok: false; error: string } {
  const username = normalizeUsername(raw);
  if (username.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters.' };
  }
  if (username.length > 32) {
    return { ok: false, error: 'Username must be at most 32 characters.' };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error:
        'Username can only use a–z, 0–9, underscores, and periods, and must start and end with a letter or number.',
    };
  }
  if (username.includes('..') || username.includes('__')) {
    return { ok: false, error: 'Username cannot contain repeated dots or underscores.' };
  }
  if (RESERVED.has(username)) {
    return { ok: false, error: 'That username is reserved. Try another.' };
  }
  return { ok: true, username };
}

export function validateDisplayName(raw: string): { ok: true; displayName: string } | { ok: false; error: string } {
  const displayName = raw.trim().replace(/\s+/g, ' ');
  if (displayName.length < 2) {
    return { ok: false, error: 'Display name must be at least 2 characters.' };
  }
  if (displayName.length > 80) {
    return { ok: false, error: 'Display name must be at most 80 characters.' };
  }
  return { ok: true, displayName };
}
