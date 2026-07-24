export function isEmailVerifyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_EMAIL_VERIFY_URL?.trim());
}

function baseUrl(): string {
  const url = (import.meta.env.VITE_EMAIL_VERIFY_URL as string | undefined)?.trim();
  if (!url) {
    throw new Error(
      'Email verification is not configured. Set VITE_EMAIL_VERIFY_URL to your Cloudflare Worker URL.',
    );
  }
  return url.replace(/\/+$/, '');
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: { error?: string } & T;
  try {
    data = (await res.json()) as { error?: string } & T;
  } catch {
    throw new Error('Email verification service returned an invalid response.');
  }

  if (!res.ok) {
    throw new Error(data.error || `Email verification failed (${res.status}).`);
  }
  return data;
}

export async function requestEmailCode(email: string): Promise<void> {
  await postJson<{ ok: boolean }>('/request-code', { email: email.trim().toLowerCase() });
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<{ signupToken: string }> {
  return postJson<{ signupToken: string }>('/verify-code', {
    email: email.trim().toLowerCase(),
    code: code.trim(),
  });
}

export async function checkSignupToken(email: string, signupToken: string): Promise<void> {
  await postJson<{ ok: boolean }>('/check-token', {
    email: email.trim().toLowerCase(),
    signupToken,
  });
}

export async function consumeSignupToken(
  email: string,
  signupToken: string,
): Promise<{ emailVerifiedAt: number }> {
  return postJson<{ ok: boolean; emailVerifiedAt: number }>('/consume-token', {
    email: email.trim().toLowerCase(),
    signupToken,
  });
}
