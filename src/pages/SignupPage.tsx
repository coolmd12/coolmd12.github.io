import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assertEmailAvailableForSignup, EMAIL_ALREADY_IN_USE_MESSAGE } from '../services/auth';
import { isEmailVerifyConfigured, requestEmailCode, verifyEmailCode } from '../services/emailVerification';
import type { UserRole } from '../types';
import { needsProfileSetup } from '../types';
import { validateDisplayName, validateUsername } from '../lib/username';

type Step = 'email' | 'code' | 'details';

const RESEND_COOLDOWN_SEC = 45;

const STEPS: Step[] = ['email', 'code', 'details'];

const STEP_COPY: Record<Step, { title: string; blurb: string }> = {
  email: {
    title: 'What’s your email?',
    blurb: 'We’ll send a short code so only you can finish signup.',
  },
  code: {
    title: 'Check your inbox',
    blurb: 'Type the 6-digit code we just emailed you.',
  },
  details: {
    title: 'Set up your delegate identity',
    blurb:
      'Choose a username, display name, password, and role. Tapping Create account is what actually saves you in Firebase.',
  },
};

export function SignupPage() {
  const { register, user, profile, configured, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailVerifyReady = isEmailVerifyConfigured();
  const copy = STEP_COPY[step];
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  if (!loading && user) {
    return (
      <Navigate to={needsProfileSetup(profile) ? '/welcome' : '/dashboard'} replace />
    );
  }

  async function sendCode() {
    setError('');
    setBusy(true);
    try {
      const normalized = await assertEmailAvailableForSignup(email);
      await requestEmailCode(normalized);
      setEmail(normalized);
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code.');
    } finally {
      setBusy(false);
    }
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    await sendCode();
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Re-gate before leaving the code step — never enter details with a taken email.
      await assertEmailAvailableForSignup(email);
      const result = await verifyEmailCode(email, code);
      setSignupToken(result.signupToken);
      setStep('details');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not verify code.';
      if (msg === EMAIL_ALREADY_IN_USE_MESSAGE) {
        setSignupToken('');
        setCode('');
        setStep('email');
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const userCheck = validateUsername(username);
    if (!userCheck.ok) {
      setError(userCheck.error);
      return;
    }
    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.ok) {
      setError(nameCheck.error);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!signupToken) {
      setError('Verify your email before creating an account.');
      setStep('email');
      return;
    }

    setBusy(true);
    try {
      // Re-gate before Auth create so Create account never runs for a taken email.
      await assertEmailAvailableForSignup(email);
      await register({
        email,
        password,
        username: userCheck.username,
        displayName: nameCheck.displayName,
        role,
        signupToken,
      });
      navigate('/welcome', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      if (msg === EMAIL_ALREADY_IN_USE_MESSAGE || /already exists|already in use/i.test(msg)) {
        // Should be rare (race). Put the user back on step 1 — that is the only place for this error.
        setSignupToken('');
        setCode('');
        setStep('email');
        setError(EMAIL_ALREADY_IN_USE_MESSAGE);
      } else if (/permission|insufficient/i.test(msg)) {
        setError(
          'Firestore security rules need updating (usernames / emails collections). Deploy firebase/firestore.rules, then try again with a fresh code.',
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signup-shell">
      <section className="signup-stage" aria-hidden="true">
        <div className="signup-stage-inner">
          <p className="signup-stage-kicker">GoMUN Delegate Arena</p>
          <h2 className="signup-stage-title">Practice like a diplomat.</h2>
          <p className="signup-stage-copy">
            Private classrooms. Real procedure. Always free.
          </p>
        </div>
      </section>

      <section className="signup-side">
        <div className="signup-card">
          <div className="signup-progress" aria-hidden="true">
            <div
              className="signup-progress-fill"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <p className="signup-step-meta">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <h1>{copy.title}</h1>
          <p className="signup-lede">{copy.blurb}</p>

          {!configured ? (
            <p className="banner warn">
              Firebase is not configured yet. See <Link to="/setup">setup</Link>.
            </p>
          ) : null}

          {configured && !emailVerifyReady ? (
            <p className="banner warn">
              Email verification is not configured. Locally, set <code>VITE_EMAIL_VERIFY_URL</code> in{' '}
              <code>.env.local</code> and restart Vite. On the live site, add that same value as a GitHub
              Actions secret and redeploy.
            </p>
          ) : null}

          {error ? <p className="banner error">{error}</p> : null}

          {step === 'email' ? (
            <form className="signup-form" onSubmit={(e) => void onEmailSubmit(e)}>
              <label>
                <span className="req-mark" aria-hidden="true">*</span> Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: you@gmail.com"
                />
              </label>
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={busy || !configured || !emailVerifyReady}
              >
                {busy ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          ) : null}

          {step === 'code' ? (
            <form className="signup-form" onSubmit={(e) => void onCodeSubmit(e)}>
              <p className="signup-chip">
                Sent to <strong>{email}</strong>
              </p>
              <label>
                <span className="req-mark" aria-hidden="true">*</span> Verification code
                <input
                  className="code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </label>
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Verifying…' : 'Verify & continue'}
              </button>
              <div className="signup-secondary-actions">
                <button
                  className="text-btn"
                  type="button"
                  disabled={busy || cooldown > 0}
                  onClick={() => void sendCode()}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <span className="dot-sep" aria-hidden="true">
                  ·
                </span>
                <button
                  className="text-btn"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setSignupToken('');
                    setError('');
                  }}
                >
                  Change email
                </button>
              </div>
            </form>
          ) : null}

          {step === 'details' ? (
            <form className="signup-form" onSubmit={(e) => void onDetailsSubmit(e)}>
              <p className="signup-chip signup-chip-ok">
                Verified <strong>{email}</strong>
              </p>

              <div className="signup-field-grid">
                <label>
                  <span className="req-mark" aria-hidden="true">*</span> Create a username
                  <input
                    required
                    autoComplete="username"
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="ex: dhyanvi_m"
                  />
                  <span className="field-hint">Unique @handle. Locked after signup.</span>
                </label>

                <label>
                  <span className="req-mark" aria-hidden="true">*</span> Create a display name
                  <input
                    required
                    autoComplete="nickname"
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ex: Dhyanvi Mehta"
                  />
                  <span className="field-hint">Shown in classrooms. Editable later.</span>
                </label>
              </div>

              <label>
                <span className="req-mark" aria-hidden="true">*</span> Create a GoMUN password for
                your account
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <label>
                <span className="req-mark" aria-hidden="true">*</span> Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </label>

              <fieldset className="role-fieldset">
                <legend>
                  <span className="req-mark" aria-hidden="true">*</span> I am a…
                </legend>
                <div className="role-grid">
                  <label className={`role-card ${role === 'student' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                    />
                    <span className="role-card-title">Student / delegate</span>
                    <span className="role-card-desc">Join with an invite code</span>
                  </label>
                  <label className={`role-card ${role === 'teacher' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      checked={role === 'teacher'}
                      onChange={() => setRole('teacher')}
                    />
                    <span className="role-card-title">Teacher / advisor</span>
                    <span className="role-card-desc">Create classrooms & invites</span>
                  </label>
                </div>
              </fieldset>

              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : null}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
