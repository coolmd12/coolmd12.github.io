export function SetupPage() {
  return (
    <main className="shell setup-page">
      <header className="page-header">
        <div>
          <h1>Firebase setup</h1>
          <p className="muted">
            GoMUN uses Firebase Auth + Firestore on the free Spark plan for secure logins
            and private classrooms.
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
        <li>Enable <strong>Email/Password</strong> under Authentication → Sign-in method.</li>
        <li>Create a Firestore database in production mode, then deploy rules from <code>firebase/firestore.rules</code>.</li>
        <li>
          Register a Web app and copy config values into <code>.env.local</code> using{' '}
          <code>.env.example</code>.
        </li>
        <li>
          Run <code>npm run dev</code> and create a teacher account, then a classroom invite
          code for students.
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
