import { lazy, StrictMode, Suspense, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, X } from 'lucide-react';
import { api } from './http.js';
import { AccountPage } from './auth.jsx';
import { HomePage, ProjectPage, clearSupportAttempts } from './catalog.jsx';
import { ProfilePage } from './profiles.jsx';
import { Review, Workspace } from './workspace.jsx';
import { ErrorNotice, LoadState, useLoad } from './ui.jsx';
import './styles.css';
import Garden from './garden.jsx';

function Wordmark() {
  return (
    <a href="/" className="wordmark">
      <img className="wordmark-mark" src="/horse-mark.svg" width="34" height="34" alt="" />
      Public Horses
    </a>
  );
}

async function signOutLocal(user) {
  await api('/session', { method: 'DELETE' });
  clearSupportAttempts(user.id);
  window.location.assign('/');
}

function Header({ path, user, signedIn = Boolean(user), onSignOut = signOutLocal }) {
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await onSignOut(user);
    } catch (failure) {
      setError(failure);
      setSigningOut(false);
    }
  }

  function current(route) {
    return path === route || route === '/' && /^\/(projects|profiles)\//.test(path) ? 'page' : undefined;
  }

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="header-inner container">
        <Wordmark />
        <button type="button" className="mobile-menu" aria-controls="site-navigation" aria-expanded={expanded}
          aria-label={expanded ? 'Close menu' : 'Open menu'} onClick={() => setExpanded(!expanded)}>
          {expanded ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav className="site-navigation" id="site-navigation" data-expanded={expanded} aria-label="Main navigation">
          <div className="nav-pages">
            <a href="/#projects" aria-current={current('/')}>Projects</a>
            <a href="/garden" aria-current={current('/garden')}>My garden</a>
            {user && <a href="/workspace" aria-current={current('/workspace')}>My projects</a>}
            {user?.reviewer && <a href="/review" aria-current={current('/review')}>Review</a>}
          </div>
          <div className="nav-account">
            {signedIn ? <button type="button" className="button button-plain" disabled={signingOut} onClick={signOut}>Sign out</button>
              : <a href="/sign-in" className="button button-plain">Sign in</a>}
            {!user && <a href="/workspace" className="button button-primary">Start a project</a>}
          </div>
        </nav>
      </div>
      {error && <div className="container"><ErrorNotice error={error} /></div>}
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Wordmark />
        <nav aria-label="Footer navigation"><a href="/#projects">Explore projects</a><a href="/garden">My garden</a><a href="/workspace">Start a project</a></nav>
      </div>
    </footer>
  );
}

function NotFound() {
  return <section className="page-panel container"><h1>Page not found</h1><p>Try the project directory.</p><a href="/#projects" className="button button-primary">Explore projects</a></section>;
}

function App({ AuthPage = AccountPage, onSignOut, clerkSessionId }) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const projectPath = /^\/projects\/([a-z0-9-]+)$/.exec(path);
  const profilePath = /^\/profiles\/([a-z0-9-]+)$/.exec(path);
  const isAuthPage = path === '/sign-in' || path === '/sign-up';
  const guestClerkSession = clerkSessionId === null;
  const clerkSignedIn = typeof clerkSessionId === 'string';
  const session = useLoad(guestClerkSession ? null : '/session');
  const sessionMatches = !clerkSignedIn || session.data?.clerkSessionId === clerkSessionId;
  const user = sessionMatches ? session.data?.user ?? null : null;
  const sessionReady = guestClerkSession || Boolean(session.data);
  const memberUnavailable = clerkSignedIn && sessionReady && !user;
  const loadingMember = !sessionReady && (path === '/garden' || isAuthPage && clerkSignedIn);
  let page;
  if (path === '/') page = <HomePage />;
  else if (projectPath) page = <ProjectPage slug={projectPath[1]} user={user} sessionReady={sessionReady} />;
  else if (profilePath) page = <ProfilePage slug={profilePath[1]} />;
  else if (path === '/garden') page = <Garden user={user} />;
  else if (path === '/workspace') page = <Workspace user={user} sessionReady={sessionReady} />;
  else if (path === '/review') page = <Review user={user} sessionReady={sessionReady} />;
  else if (isAuthPage) page = <AuthPage user={user} register={path === '/sign-up'} />;
  else page = <NotFound />;

  return (
    <>
      <Header path={path} user={user} signedIn={clerkSignedIn || Boolean(user)} onSignOut={onSignOut} />
      {session.data?.demo && <p className="demo-notice"><span className="container">Demo preview. Listings and profiles are examples.</span></p>}
      {path === '/garden' && sessionReady && !memberUnavailable ? page : (
        <main id="main" className="site-main">
          {session.error ? <div className="container page-panel"><LoadState state={session} /></div>
             : memberUnavailable ? <div className="container page-panel"><LoadState state={{ ...session, error: 'Your account could not load. Sign out and back in if this continues.' }} /></div>
             : loadingMember ? <p className="loading container" role="status">Checking your session…</p> : page}
        </main>
      )}
      <Footer />
    </>
  );
}

const ClerkApp = lazy(() => import('./clerk.jsx'));

function Root() {
  const config = useLoad('/auth-config');
  if (config.data?.mode === 'local') return <App />;
  if (config.data?.mode === 'clerk' && typeof config.data.publishableKey === 'string' && config.data.publishableKey) {
    return (
      <Suspense fallback={<p className="loading container" role="status">Loading sign-in…</p>}>
        <ClerkApp App={App} publishableKey={config.data.publishableKey} />
      </Suspense>
    );
  }
  const state = config.data ? { ...config, error: 'Authentication is unavailable.' } : config;
  return <main className="container page-panel"><LoadState state={state} /></main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><Root /></StrictMode>);
