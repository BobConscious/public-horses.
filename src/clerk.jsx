import { ClerkFailed, ClerkLoaded, ClerkLoading, ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/react';
import { useMemo } from 'react';
import { resumePath, signInLink } from './auth.jsx';
import { clearSupportAttempts } from './catalog.jsx';
import { ApiContext, api } from './http.js';

const appearance = { variables: { colorPrimary: '#234533' } };

function ClerkAccountPage({ register, user }) {
  const next = resumePath();
  if (user) {
    return (
      <div className="auth-layout container">
        <section className="auth-panel">
          <h1>You’re signed in</h1>
          <a className="button button-primary" href={next}>Continue</a>
        </section>
      </div>
    );
  }
  return (
    <div className="auth-layout clerk-auth container">
      {register
        ? <SignUp routing="hash" forceRedirectUrl={next} signInUrl={signInLink(next)} signInForceRedirectUrl={next} />
        : <SignIn routing="hash" forceRedirectUrl={next} signUpUrl={`/sign-up?next=${encodeURIComponent(next)}`} signUpForceRedirectUrl={next} />}
    </div>
  );
}

function ClerkSession({ App }) {
  const { isLoaded, isSignedIn, sessionId, userId, signOut } = useAuth();
  const client = useMemo(() => (path, options) => api(path, { ...options, clerkSessionId: sessionId }), [sessionId]);
  if (!isLoaded || isSignedIn && !sessionId) return <p className="loading container" role="status">Checking your session…</p>;

  async function signOutClerk(user) {
    await signOut(() => {
      if (user) clearSupportAttempts(user.id);
    }, { redirectUrl: '/' });
  }

  return (
    <ApiContext.Provider value={client}>
      <App key={`${sessionId ?? ''}/${userId ?? ''}`} AuthPage={ClerkAccountPage}
        clerkSessionId={isSignedIn ? sessionId : null} onSignOut={signOutClerk} />
    </ApiContext.Provider>
  );
}

export default function ClerkApp({ App, publishableKey }) {
  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl="/sign-in" signUpUrl="/sign-up"
      allowedRedirectOrigins={[window.location.origin]} appearance={appearance} telemetry={{ disabled: true }}>
      <ClerkLoading><p className="loading container" role="status">Loading sign-in…</p></ClerkLoading>
      <ClerkLoaded><ClerkSession App={App} /></ClerkLoaded>
      <ClerkFailed>
        <main className="container page-panel">
          <p className="notice notice-error" role="alert">Sign-in could not load.</p>
          <button type="button" className="button button-outline" onClick={() => window.location.reload()}>Try again</button>
        </main>
      </ClerkFailed>
    </ClerkProvider>
  );
}
