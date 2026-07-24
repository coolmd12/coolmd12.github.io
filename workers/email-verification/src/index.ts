export interface Env {
  EMAIL_VERIFY: KVNamespace;
  RESEND_API_KEY: string;
  SIGNUP_TOKEN_SECRET: string;
  FROM_EMAIL: string;
  ALLOWED_ORIGINS?: string;
}

const CODE_TTL_SECONDS = 10 * 60;
const TOKEN_TTL_SECONDS = 15 * 60;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

type JsonBody = Record<string, unknown>;

function json(data: unknown, status = 200, origin: string | null = null): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
  });
  applyCors(headers, origin);
  return new Response(JSON.stringify(data), { status, headers });
}

function applyCors(headers: Headers, origin: string | null) {
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '86400');
}

function resolveOrigin(request: Request, env: Env): string | null {
  const reqOrigin = request.headers.get('Origin');
  const allow = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allow.length) {
    // Dev-friendly: reflect any origin when allowlist unset.
    return reqOrigin || '*';
  }
  if (reqOrigin && allow.includes(reqOrigin)) return reqOrigin;
  return null;
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  return email;
}

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) return null;
  return code;
}

async function readJson(request: Request): Promise<JsonBody | null> {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as JsonBody;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...view].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(digest);
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function randomCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

function b64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(text: string): string | null {
  try {
    const padded = text.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const bin = atob(padded + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function mintSignupToken(env: Env, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${email}|${exp}|${nonce}`;
  const sig = await hmacHex(env.SIGNUP_TOKEN_SECRET, payload);
  const token = `${b64urlEncode(payload)}.${sig}`;
  await env.EMAIL_VERIFY.put(`token:${await sha256Hex(token)}`, email, {
    expirationTtl: TOKEN_TTL_SECONDS,
  });
  return token;
}

async function parseAndCheckToken(
  env: Env,
  email: string,
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'Invalid signup token.' };
  const [payloadB64, sig] = parts;
  const payload = b64urlDecode(payloadB64);
  if (!payload) return { ok: false, error: 'Invalid signup token.' };

  const expected = await hmacHex(env.SIGNUP_TOKEN_SECRET, payload);
  if (!timingSafeEqual(expected, sig)) return { ok: false, error: 'Invalid signup token.' };

  const [tokenEmail, expStr] = payload.split('|');
  const exp = Number(expStr);
  if (tokenEmail !== email) return { ok: false, error: 'Token does not match email.' };
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'Signup token expired. Verify your email again.' };
  }

  const key = `token:${await sha256Hex(token)}`;
  const stored = await env.EMAIL_VERIFY.get(key);
  if (!stored || stored !== email) {
    return { ok: false, error: 'Signup token already used or invalid.' };
  }
  return { ok: true };
}

async function consumeToken(env: Env, email: string, token: string) {
  const check = await parseAndCheckToken(env, email, token);
  if (!check.ok) return check;
  await env.EMAIL_VERIFY.delete(`token:${await sha256Hex(token)}`);
  return { ok: true as const };
}

async function enforceRateLimit(env: Env, email: string): Promise<boolean> {
  const key = `rate:${email}`;
  const raw = await env.EMAIL_VERIFY.get(key);
  const count = raw ? Number(raw) : 0;
  if (count >= RATE_LIMIT_MAX) return false;
  await env.EMAIL_VERIFY.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return true;
}

async function sendResendCode(env: Env, email: string, code: string): Promise<Response> {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: 'Your GoMUN verification code',
      text: `Your GoMUN Delegate Arena verification code is ${code}.\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `<p>Your GoMUN Delegate Arena verification code is:</p><p style="font-size:28px;letter-spacing:4px;font-weight:700">${code}</p><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`,
    }),
  });
}

async function handleRequestCode(request: Request, env: Env, origin: string | null) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  if (!email) return json({ error: 'Enter a valid email address.' }, 400, origin);

  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.SIGNUP_TOKEN_SECRET) {
    return json({ error: 'Email verification is not configured on the server.' }, 503, origin);
  }

  const allowed = await enforceRateLimit(env, email);
  if (!allowed) {
    return json(
      { error: 'Too many code requests for this email. Try again in an hour.' },
      429,
      origin,
    );
  }

  const code = randomCode();
  const hash = await sha256Hex(`${email}:${code}`);
  await env.EMAIL_VERIFY.put(`code:${email}`, hash, { expirationTtl: CODE_TTL_SECONDS });

  const resend = await sendResendCode(env, email, code);
  if (!resend.ok) {
    const detail = await resend.text();
    console.error('Resend error', resend.status, detail);
    return json(
      { error: 'Could not send verification email. Check Resend domain / FROM_EMAIL.' },
      502,
      origin,
    );
  }

  return json({ ok: true }, 200, origin);
}

async function handleVerifyCode(request: Request, env: Env, origin: string | null) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const code = normalizeCode(body?.code);
  if (!email || !code) {
    return json({ error: 'Email and a 6-digit code are required.' }, 400, origin);
  }

  const stored = await env.EMAIL_VERIFY.get(`code:${email}`);
  if (!stored) {
    return json({ error: 'Code expired or not found. Request a new one.' }, 400, origin);
  }

  const hash = await sha256Hex(`${email}:${code}`);
  if (!timingSafeEqual(stored, hash)) {
    return json({ error: 'Incorrect verification code.' }, 400, origin);
  }

  await env.EMAIL_VERIFY.delete(`code:${email}`);
  const signupToken = await mintSignupToken(env, email);
  return json({ signupToken }, 200, origin);
}

async function handleCheckToken(request: Request, env: Env, origin: string | null) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const signupToken = typeof body?.signupToken === 'string' ? body.signupToken.trim() : '';
  if (!email || !signupToken) {
    return json({ error: 'Email and signup token are required.' }, 400, origin);
  }

  const result = await parseAndCheckToken(env, email, signupToken);
  if (!result.ok) return json({ error: result.error }, 400, origin);
  return json({ ok: true }, 200, origin);
}

async function handleConsumeToken(request: Request, env: Env, origin: string | null) {
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const signupToken = typeof body?.signupToken === 'string' ? body.signupToken.trim() : '';
  if (!email || !signupToken) {
    return json({ error: 'Email and signup token are required.' }, 400, origin);
  }

  const result = await consumeToken(env, email, signupToken);
  if (!result.ok) return json({ error: result.error }, 400, origin);
  return json({ ok: true, emailVerifiedAt: Date.now() }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = resolveOrigin(request, env);

    if (request.method === 'OPTIONS') {
      const headers = new Headers();
      applyCors(headers, origin || '*');
      return new Response(null, { status: 204, headers });
    }

    if (origin === null && request.headers.get('Origin')) {
      return json({ error: 'Origin not allowed.' }, 403, null);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405, origin);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path.endsWith('/request-code')) return handleRequestCode(request, env, origin);
      if (path.endsWith('/verify-code')) return handleVerifyCode(request, env, origin);
      if (path.endsWith('/check-token')) return handleCheckToken(request, env, origin);
      if (path.endsWith('/consume-token')) return handleConsumeToken(request, env, origin);
      return json({ error: 'Not found.' }, 404, origin);
    } catch (err) {
      console.error(err);
      return json({ error: 'Unexpected server error.' }, 500, origin);
    }
  },
};
