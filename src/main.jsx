import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Leaf, Menu, Sprout, X } from 'lucide-react';
import { api } from './http.js';
import { AccountPage } from './auth.jsx';
import { HomePage, ProjectPage, clearSupportAttempts } from './catalog.jsx';
import { Review, Workspace } from './workspace.jsx';
import { ErrorNotice, LoadState, useLoad } from './ui.jsx';
import './styles.css';
import Garden from './garden.jsx';

function Wordmark() {
  return <a href="/" className="wordmark"><span className="wordmark-symbol"><Sprout size={23} strokeWidth={1.85} aria-hidden="true" /></span>Public Horses</a>;
}

function Header({ path, user }) {
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await api('/session', { method: 'DELETE' });
      clearSupportAttempts(user.id);
      window.location.assign('/');
    } catch (failure) {
      setError(failure);
      setSigningOut(false);
    }
  }

  function current(route) {
    return path === route || route === '/' && path.startsWith('/projects/') ? 'page' : undefined;
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
            <a href="/#projects" aria-current={current('/')}>Explore</a>
            <a href="/garden" aria-current={current('/garden')}>My garden</a>
            {user && <a href="/workspace" aria-current={current('/workspace')}>My projects</a>}
            {user?.reviewer && <a href="/review" aria-current={current('/review')}>Review</a>}
          </div>
          <div className="nav-account">
            {user ? <button type="button" className="button button-plain" disabled={signingOut} onClick={signOut}>Sign out</button>
              : <a href="/sign-in" className="button button-plain">Sign in</a>}
            <a href="/workspace" className="button button-primary">Start a project <ArrowUpRight size={16} aria-hidden="true" /></a>
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

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const projectPath = /^\/projects\/([a-z0-9-]+)$/.exec(path);
  const session = useLoad('/session');
  const user = session.data?.user ?? null;
  const sessionReady = Boolean(session.data);
  let page;
  if (path === '/') page = <HomePage />;
  else if (projectPath) page = <ProjectPage slug={projectPath[1]} user={user} sessionReady={sessionReady} />;
  else if (path === '/garden') page = <Garden user={user} />;
  else if (path === '/workspace') page = <Workspace user={user} sessionReady={sessionReady} />;
  else if (path === '/review') page = <Review user={user} sessionReady={sessionReady} />;
  else if (path === '/sign-in' || path === '/sign-up') page = <AccountPage user={user} register={path === '/sign-up'} />;
  else page = <NotFound />;

  return (
    <>
      <Header path={path} user={user} />
      {session.data?.demo && <div className="demo-notice"><Leaf size={14} aria-hidden="true" /> Demo workspace. The sample projects are fictional.</div>}
      {path === '/garden' && sessionReady ? page : (
        <main id="main" className="site-main">
          {session.error ? <div className="container page-panel"><LoadState state={session} /></div>
             : path === '/garden' ? <p className="loading container" role="status">Checking your session…</p> : page}
        </main>
      )}
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
