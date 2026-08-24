/** YYYY-MM-DD date helpers for parent portal DOB (Aeries-style, no ID attestation). */

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOfBirth(raw: string): { ok: true; dateOfBirth: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!DOB_RE.test(value)) {
    return { ok: false, error: 'Enter your date of birth as YYYY-MM-DD.' };
  }
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return { ok: false, error: 'That date of birth is not valid.' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { ok: false, error: 'Date of birth cannot be in the future.' };
  }
  if (y < 1900) {
    return { ok: false, error: 'Please enter a realistic date of birth.' };
  }
  return { ok: true, dateOfBirth: value };
}

export function ageFromDateOfBirth(dateOfBirth: string, asOf: Date = new Date()): number | null {
  if (!DOB_RE.test(dateOfBirth)) return null;
  const [y, m, d] = dateOfBirth.split('-').map(Number) as [number, number, number];
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;
  let age = asOf.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    asOf.getMonth() < birth.getMonth() ||
    (asOf.getMonth() === birth.getMonth() && asOf.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Parent accounts must be 18+ based on date of birth. */
export function parseParentDateOfBirth(
  raw: string,
): { ok: true; dateOfBirth: string } | { ok: false; error: string } {
  const parsed = parseDateOfBirth(raw);
  if (parsed.ok === false) return parsed;
  const age = ageFromDateOfBirth(parsed.dateOfBirth);
  if (age === null || age < 18) {
    return { ok: false, error: 'Parent accounts require a date of birth showing you are 18 or older.' };
  }
  if (age > 120) {
    return { ok: false, error: 'Please enter a realistic date of birth.' };
  }
  return parsed;
}

export function hasValidParentDateOfBirth(dateOfBirth: string | undefined): boolean {
  if (!dateOfBirth) return false;
  return parseParentDateOfBirth(dateOfBirth).ok === true;
}

/** Parent portal gate: missing or underage DOB. */
export function needsParentDateOfBirth(profile: {
  roles?: Array<'student' | 'teacher' | 'parent'>;
  role?: 'student' | 'teacher' | 'parent';
  dateOfBirth?: string;
} | null | undefined): boolean {
  if (!profile) return false;
  const roles = profile.roles?.length
    ? profile.roles
    : profile.role
      ? [profile.role]
      : [];
  const parentOnly = roles.length === 1 && roles[0] === 'parent';
  if (!parentOnly) return false;
  return !hasValidParentDateOfBirth(profile.dateOfBirth);
}
