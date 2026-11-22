import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { profileKinds } from '../shared/catalog.js';
import { useApi } from './http.js';
import { ErrorNotice, LoadState } from './ui.jsx';
import './workspace-profiles.css';

export function ProfileList({ state, busy, onAdd, onEdit, children }) {
  return (
    <section className="workspace-profiles" aria-labelledby="workspace-profiles-heading">
      <div className="workspace-profiles-heading">
        <h2 id="workspace-profiles-heading">Your profiles</h2>
        <button type="button" className="button button-outline" disabled={busy || !state.data} onClick={onAdd}>
          <Plus size={17} aria-hidden="true" /> New profile
        </button>
      </div>
      {children}
      {!state.data ? <LoadState state={state} /> : state.data.profiles.length ? (
        <ul className="workspace-profile-list">
          {state.data.profiles.map((profile) => (
            <li key={profile.id} className="workspace-profile">
              <div>
                <h3>{profile.name}</h3>
                <p>{profileKinds.find(({ id }) => id === profile.kind)?.label}{profile.location && ` · ${profile.location}`}</p>
              </div>
              <button type="button" className="button button-outline" disabled={busy}
                aria-label={`Edit profile for ${profile.name}`} onClick={() => onEdit(profile)}>Edit profile</button>
            </li>
          ))}
        </ul>
      ) : !children && <p>Create a profile for yourself or your organization before starting a project.</p>}
    </section>
  );
}

export function ProfileEditor({ profile, hasPerson, startProject, onSaved, onCancel, onReload }) {
  const api = useApi();
  const heading = useRef(null);
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { heading.current?.focus(); }, []);

  async function save(event) {
    event.preventDefault();
    if (saving.current) return;
    const input = Object.fromEntries(new FormData(event.currentTarget));
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      const { profile: saved } = await api(profile ? `/mine/profiles/${encodeURIComponent(profile.id)}` : '/mine/profiles', {
        method: profile ? 'PATCH' : 'POST',
        body: profile ? { ...input, version: profile.version } : input,
      });
      onSaved(saved);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
      saving.current = false;
    }
  }

  return (
    <section className="workspace-panel profile-editor" aria-labelledby="profile-editor-heading">
      <h3 ref={heading} tabIndex={-1} id="profile-editor-heading">{profile ? 'Edit profile' : 'Create a profile'}</h3>
      <p>{profile ? 'Your edits appear online after a project using them passes review.'
        : 'Your profile appears online after a project using it passes review.'}</p>
      <form className="stack-form" onSubmit={save}>
        <fieldset disabled={pending}>
          {!profile && <label>Profile type
            <select name="kind" required defaultValue={hasPerson ? 'organization' : ''}>
              <option value="" disabled>Choose a type</option>
              {profileKinds.map(({ id, label }) => <option key={id} value={id} disabled={hasPerson && id === 'person'}>{label}</option>)}
            </select>
          </label>}
          <label>Public name<input name="name" maxLength={96} required defaultValue={profile?.name} /></label>
          <div className="form-columns">
            <label><span>Location <span className="optional">Optional</span></span>
              <input name="location" maxLength={96} defaultValue={profile?.location} />
            </label>
            <label><span>Website <span className="optional">Optional</span></span>
              <input name="websiteUrl" type="url" maxLength={1000} placeholder="https://" defaultValue={profile?.websiteUrl} />
            </label>
          </div>
          <label><span>About this profile <span className="optional">Optional</span></span>
            <textarea name="bio" rows={4} maxLength={2000} defaultValue={profile?.bio} />
          </label>
        </fieldset>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button type="submit" disabled={pending} className="button button-primary">
            {pending ? 'Saving…' : startProject ? 'Save profile and continue' : 'Save profile'}
          </button>
          <button type="button" disabled={pending} className="button button-plain" onClick={onCancel}>Cancel</button>
          {error?.status === 409 && <button type="button" className="button button-outline" onClick={onReload}>Discard edits and reload</button>}
        </div>
      </form>
    </section>
  );
}
