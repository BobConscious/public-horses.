import { useRef, useState } from 'react';
import { ArrowRight, Sprout } from 'lucide-react';
import { api } from './http.js';
import { ErrorNotice } from './ui.jsx';

const allowedResumePath = /^\/(?:garden|workspace|review|projects\/[a-z0-9-]+)?$/;

export function signInLink(path) {
  return `/sign-in?next=${encodeURIComponent(path)}`;
}

export function resumePath(search = window.location.search) {
  const requested = new URLSearchParams(search).get('next');
  return requested && allowedResumePath.test(requested) ? requested : '/';
}

export function AccountPage({ register, user }) {
  const next = resumePath();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await api(register ? '/accounts' : '/session', {
        method: 'POST',
        body: Object.fromEntries(form),
      });
      window.location.assign(next);
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="auth-layout container">
      <section className="auth-panel">
        <span className="auth-mark"><Sprout size={24} aria-hidden="true" /></span>
        <h1>{user ? 'You’re signed in' : register ? 'Join Public Horses' : 'Welcome back'}</h1>
        {user ? (
          <a className="button button-primary" href={next}>Continue <ArrowRight size={17} aria-hidden="true" /></a>
        ) : (
          <>
            <p>{register ? 'Take part in a project or start one of your own.' : 'Sign in to record help or tend your garden.'}</p>
            <form onSubmit={submit} className="stack-form">
              {register && <label>Display name<input name="name" autoComplete="name" maxLength={80} required /></label>}
              <label>Email<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
              <label>Password<input type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 10 : undefined} maxLength={128} required /></label>
              {register && <span className="field-hint">Use at least 10 characters.</span>}
              <ErrorNotice error={error} />
              <button className="button button-primary" disabled={pending}>{pending ? 'Working…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={17} aria-hidden="true" /></button>
            </form>
            <p className="auth-switch">
              {register ? 'Already have an account? ' : 'New here? '}
              <a href={`${register ? '/sign-in' : '/sign-up'}?next=${encodeURIComponent(next)}`}>{register ? 'Sign in' : 'Create an account'}</a>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
