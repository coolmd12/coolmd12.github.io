export function SetupPage() {
  return (
    <main className="shell setup-page">
      <header className="page-header">
        <div>
          <h1>Firebase + Google setup</h1>
          <p className="muted">
            GoMUN uses Firebase Auth + Firestore on the free Spark plan. Accounts use{' '}
            <strong>Continue with Google</strong> only (no paid domain / Resend required).
          </p>
        </div>
      </header>

      <ol className="setup-steps">
        <li>
          Create a project at{' '}
          <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
            Firebase Console
          </a>{' '}
          (Spark / free).
        </li>
        <li>
          Enable <strong>Google</strong> under Authentication → Sign-in method. Set a support email
          when prompted.
        </li>
        <li>
          Under Authentication → Settings → Authorized domains, keep <code>localhost</code> and add{' '}
          <code>coolmd12.github.io</code> if missing.
        </li>
        <li>
          Create a Firestore database in production mode, then publish rules from{' '}
          <code>firebase/firestore.rules</code> (includes the user-count <code>stats</code> doc).
        </li>
        <li>
          Register a Web app and copy config values into <code>.env.local</code> using{' '}
          <code>.env.example</code>.
        </li>
        <li>
          Run <code>npm run dev</code>, then <strong>Continue with Google</strong> on signup.
        </li>
        <li>
          Founder user count: log in as <code>dhyanvim@gmail.com</code> →{' '}
          <strong>Founder&apos;s Stats</strong> in the nav (only that account). Or Firebase →
          Authentication → Users for the exact Auth list.
        </li>
      </ol>

      <pre className="code-block">{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}</pre>
    </main>
  );
}
