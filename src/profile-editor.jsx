import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { profileKinds } from '../shared/catalog.js';
import { useApi } from './http.js';
import { ErrorNotice, LoadState } from './ui.jsx';
import { Button, Field } from './components/controls.jsx';
import './workspace-profiles.css';

export function ProfileList({ state, busy, onAdd, onEdit, children }) {
  return (
    <section className="workspace-profiles" aria-labelledby="workspace-profiles-heading">
      <div className="workspace-profiles-heading">
        <h2 id="workspace-profiles-heading">Your profiles</h2>
        <Button variant="outline" disabled={busy || !state.data} onClick={onAdd}>
          <Plus size={17} aria-hidden="true" /> New profile
        </Button>
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
              <Button variant="outline" disabled={busy}
                aria-label={`Edit profile for ${profile.name}`} onClick={() => onEdit(profile)}>Edit profile</Button>
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
          {!profile && (
            <Field label="Profile type" as="select" name="kind" required defaultValue={hasPerson ? 'organization' : ''}>
              <option value="" disabled>Choose a type</option>
              {profileKinds.map(({ id, label }) => <option key={id} value={id} disabled={hasPerson && id === 'person'}>{label}</option>)}
            </Field>
          )}
          <Field label="Public name" name="name" maxLength={96} required defaultValue={profile?.name} />
          <div className="form-columns">
            <Field label="Location" optional name="location" maxLength={96} defaultValue={profile?.location} />
            <Field label="Website" optional name="websiteUrl" type="url" maxLength={1000} placeholder="https://"
              defaultValue={profile?.websiteUrl} />
          </div>
          <Field label="About this profile" optional as="textarea" name="bio" rows={4} maxLength={2000} defaultValue={profile?.bio} />
        </fieldset>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : startProject ? 'Save profile and continue' : 'Save profile'}
          </Button>
          <Button variant="plain" disabled={pending} onClick={onCancel}>Cancel</Button>
          {error?.status === 409 && <Button variant="outline" onClick={onReload}>Discard edits and reload</Button>}
        </div>
      </form>
    </section>
  );
}
