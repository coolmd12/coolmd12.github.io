# Email verification Worker (Resend + KV)

Sends 6-digit signup codes via [Resend](https://resend.com) and issues short-lived signup tokens. Runs on **Cloudflare Workers** free tier so Firebase can stay on Spark (no Blaze).

## Endpoints

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `POST` | `/request-code` | `{ "email": "…" }` | Sends code; stores hash in KV |
| `POST` | `/verify-code` | `{ "email": "…", "code": "123456" }` | `{ "signupToken": "…" }` |
| `POST` | `/consume-token` | `{ "email": "…", "signupToken": "…" }` | One-time consume before Firebase register |
| `OPTIONS` | `*` | — | CORS preflight |

## Setup

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and log in: `npx wrangler login`
2. From this folder:
   ```bash
   npm install
   npx wrangler kv namespace create EMAIL_VERIFY
   ```
   Paste the `id` into `wrangler.toml` under `[[kv_namespaces]]`.
3. Set secrets (never commit these):
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put SIGNUP_TOKEN_SECRET
   npx wrangler secret put FROM_EMAIL
   ```
   - `FROM_EMAIL` must be a Resend-verified sender (e.g. `GoMUN <onboarding@yourdomain.com>`).
   - `SIGNUP_TOKEN_SECRET` = long random string (e.g. `openssl rand -hex 32`).
4. Deploy: `npm run deploy`
5. Put the Worker URL in the app `.env.local`:
   ```
   VITE_EMAIL_VERIFY_URL=https://gomun-email-verify.<your-subdomain>.workers.dev
   ```
   (no trailing slash)

## Local dev

```bash
npm run dev
```

Uses the same KV binding and secrets from `.dev.vars` (copy from `.dev.vars.example`).

## Security notes

- Do **not** put `RESEND_API_KEY` or `SIGNUP_TOKEN_SECRET` in Vite `VITE_*` env or GitHub Pages frontend secrets.
- Codes expire in 10 minutes; signup tokens in 15 minutes and are single-use after `/consume-token`.
- Rate limit: a few requests per email per hour (KV counters).
