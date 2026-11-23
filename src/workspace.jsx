import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, FilePenLine, Plus, ShieldCheck } from 'lucide-react';
import { fields, listingTypes, profileKinds, supportKinds } from '../shared/catalog.js';
import { useApi } from './http.js';
import { signInLink } from './auth.jsx';
import { Deadline, ErrorNotice, LoadState, fieldName, kindName, officialUrl, useLoad } from './ui.jsx';
import { ProfileEditor, ProfileList } from './profile-editor.jsx';
import { ListingImageEditor, ReviewListingImage, useListingImage, usePrivateListingImage } from './listing-image-editor.jsx';

const statusLabels = {
  draft: 'Draft',
  submitted: 'Under review',
  changes_requested: 'Needs changes',
  published: 'Published',
  closed: 'Closed',
};

const editable = new Set(['draft', 'changes_requested']);
const listingLabel = (type) => listingTypes.find(({ id }) => id === type)?.label ?? 'Project';

function SignedOut({ path, title, children }) {
  return (
    <section className="page-panel container">
      <h1>{title}</h1>
      <p>{children}</p>
      <a href={signInLink(path)} className="button button-primary">Sign in <ArrowRight size={17} aria-hidden="true" /></a>
    </section>
  );
}

function ProjectEditor({ project, profiles, preferredProfile, onSaved, onCancel }) {
  const api = useApi();
  const image = useListingImage(project?.image);
  const [needs, setNeeds] = useState(() => project?.needs ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);
  const heading = useRef(null);
  const profileId = project?.profile?.id ?? preferredProfile ?? (profiles.length === 1 ? profiles[0].id : '');

  useEffect(() => { heading.current?.focus(); }, []);

  function setNeed(type, input, value) {
    setNeeds((current) => current.map((need) => need.type === type ? { ...need, [input]: value } : need));
  }

  function toggleNeed(type, checked) {
    setNeeds((current) => checked ? [...current, { type, detail: '', url: '' }] : current.filter((need) => need.type !== type));
  }

  async function save(event) {
    event.preventDefault();
    if (submitting.current || image.reading) return;
    if (!needs.length) {
      setError('Choose at least one way someone can help.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), needs, image: image.imagePayload(), ...(project && { version: project.version }) };
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await api(project ? `/mine/projects/${encodeURIComponent(project.id)}` : '/projects', { method: project ? 'PATCH' : 'POST', body });
      onSaved(result.project);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }

  return (
    <section className="workspace-panel" aria-labelledby="editor-heading">
      <h2 ref={heading} tabIndex={-1} id="editor-heading">{project ? 'Edit draft' : 'New project'}</h2>
      {project?.reviewNote && <p className="notice">Reviewer note. {project.reviewNote}</p>}
      <form className="stack-form" onSubmit={save}>
        <label>Project title<input required name="title" maxLength={96} defaultValue={project?.title} /></label>
        <div className="form-columns">
          <label>Organizer profile
            <select required name="profileId" defaultValue={profileId}>
              <option value="" disabled>Choose a profile</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>
                {profile.name} ({profileKinds.find(({ id }) => id === profile.kind)?.label})
              </option>)}
            </select>
          </label>
          <label>Listing type
            <select required name="listingType" defaultValue={project?.listingType ?? 'project'}>
              {listingTypes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </div>
        <div className="form-columns">
          <label>Field
            <select name="field" required defaultValue={project?.field ?? ''}>
              <option value="" disabled>Choose a field</option>
              {fields.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
            </select>
          </label>
          <label>Last day to help<input required type="date" name="endsAt" defaultValue={project?.endsAt} /></label>
        </div>
        <div className="form-columns">
          <label>Location<input required name="location" maxLength={96} defaultValue={project?.location} /></label>
          <label><span>Schedule <span className="optional">Optional</span></span>
            <input name="schedule" maxLength={200} defaultValue={project?.schedule} placeholder="For example, Saturdays at 10 a.m. ET" />
          </label>
        </div>
        <label>Short summary<textarea required name="summary" rows={2} maxLength={200} defaultValue={project?.summary} /></label>
        <label>Project description<textarea required name="story" rows={5} maxLength={4000} defaultValue={project?.story} /></label>
        <ListingImageEditor editor={image} pending={pending} />
        <fieldset className="needs-editor">
          <legend>What do you need?</legend>
          {supportKinds.map(({ id, label }) => {
            const current = needs.find(({ type }) => type === id);
            return (
              <div key={id}>
                <label className="check-field"><input type="checkbox" checked={Boolean(current)} onChange={(event) => toggleNeed(id, event.target.checked)} /> {label}</label>
                {current && (
                  <div className="need-editor-fields">
                    <label>{label} request<textarea required rows={2} maxLength={360} value={current.detail} onChange={(event) => setNeed(id, 'detail', event.target.value)} /></label>
                    <label>Official link for {label.toLowerCase()}<input required type="url" placeholder="https://" value={current.url} onChange={(event) => setNeed(id, 'url', event.target.value)} /></label>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
        <label>Link that confirms the request
          <input name="proofUrl" required type="url" placeholder="https://" defaultValue={project?.proofUrl} />
          <span className="field-hint">Use a page from the organizer. This link stays off the public project page.</span>
        </label>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button type="submit" disabled={pending || image.reading} className="button button-primary">{pending ? 'Saving…' : 'Save draft'}</button>
          <button type="button" disabled={pending} className="button button-plain" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

function WorkspaceProjects() {
  const api = useApi();
  const list = useLoad('/mine/projects');
  const profileList = useLoad('/mine/profiles');
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const profiles = profileList.data?.profiles ?? [];

  function startProject() {
    setEditor(profiles.length ? { type: 'project' } : { type: 'profile', startProject: true });
  }

  function closeEditor() {
    setEditor(null);
  }

  function profileSaved(profile) {
    if (editor.record) list.reload();
    setEditor(editor.startProject ? { type: 'project', preferredProfile: profile.id } : null);
    setMessage('Profile saved.');
    profileList.reload();
  }

  async function change(project, action) {
    if (busy) return;
    setError(null);
    setMessage('');
    setBusy(project.id);
    try {
      await api(`/mine/projects/${encodeURIComponent(project.id)}/${action}`, { method: 'POST', body: { version: project.version } });
      setMessage(action === 'submit' ? 'Project sent for review.' : 'Project closed.');
      list.reload();
    } catch (failure) {
      setError(failure);
      if (failure.status === 409) list.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="workspace-page container">
      <div className="workspace-title"><div><h1>Your projects</h1><p>A reviewer checks each request before it can appear in the directory.</p></div>
        {!editor && <button className="button button-primary" type="button" disabled={Boolean(busy) || !profileList.data} onClick={startProject}><Plus size={19} aria-hidden="true" /> New project</button>}
      </div>
      {message && <p className="notice" role="status">{message}</p>}
      <ErrorNotice error={error} />
      <ProfileList state={profileList} busy={Boolean(editor) || Boolean(busy)}
        onAdd={() => setEditor({ type: 'profile' })}
        onEdit={(profile) => setEditor({ type: 'profile', record: profile })}>
        {editor?.type === 'profile' && <ProfileEditor profile={editor.record} hasPerson={profiles.some(({ kind }) => kind === 'person')}
          startProject={editor.startProject} onSaved={profileSaved} onCancel={closeEditor}
          onReload={() => { closeEditor(); profileList.reload(); }} />}
      </ProfileList>
      {editor?.type === 'project' && profileList.data && <ProjectEditor key={editor.record?.id ?? 'new'} project={editor.record}
        profiles={profiles} preferredProfile={editor.preferredProfile}
        onSaved={() => { closeEditor(); setMessage('Draft saved.'); list.reload(); }} onCancel={closeEditor} />}
      {!list.data ? <LoadState state={list} /> : list.data.projects.length ? (
        <div className="record-list">
          {list.data.projects.map((project) => (
            <article className="record-card" key={project.id}>
              <span className="record-status" data-status={project.status}>{statusLabels[project.status] ?? project.status}</span>
              <h2>{project.title}</h2>
              <p>{project.profile?.name ?? project.organization} · {listingLabel(project.listingType)} · {fieldName(project.field)}</p>
              {project.schedule && <p>{project.schedule}</p>}
              {project.reviewNote && <p className="record-note">Reviewer note. {project.reviewNote}</p>}
              <div className="form-actions">
                {editable.has(project.status) && (
                  <>
                    <button type="button" className="button button-outline" disabled={Boolean(busy) || Boolean(editor) || !profileList.data}
                      onClick={() => setEditor({ type: 'project', record: project })}>Edit draft</button>
                    <button type="button" className="button button-primary" disabled={Boolean(busy) || Boolean(editor)} onClick={() => change(project, 'submit')}>Submit for review</button>
                  </>
                )}
                {project.status === 'published' && (
                  <>
                    <a className="button button-outline" href={`/projects/${project.slug}`}>View project <ArrowUpRight size={16} aria-hidden="true" /></a>
                    <button type="button" className="button button-plain" disabled={Boolean(busy) || Boolean(editor)} onClick={() => change(project, 'close')}>Close project</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : !editor && <div className="empty-state"><FilePenLine size={30} strokeWidth={1.6} aria-hidden="true" /><h2>No projects yet</h2></div>}
    </div>
  );
}

export function Workspace({ user, sessionReady }) {
  if (!sessionReady) return <p className="loading container" role="status">Checking your session…</p>;
  if (!user) return <SignedOut path="/workspace" title="Start a project">Sign in to draft a request for funding, supplies, time, or skills.</SignedOut>;
  return <WorkspaceProjects />;
}

function ReviewCard({ project, onDecision }) {
  const api = useApi();
  const preview = usePrivateListingImage(project.image);
  const canPublish = !project.image || Boolean(preview.data?.dataUrl);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const saving = useRef(false);
  const proof = officialUrl(project.proofUrl);
  const { profile } = project;
  const website = officialUrl(profile?.websiteUrl);

  async function decide(event) {
    event.preventDefault();
    if (saving.current) return;
    const decision = event.nativeEvent.submitter?.value;
    if (!decision || (decision === 'publish' && !canPublish)) return;
    if (decision === 'changes_requested' && !note.trim()) {
      setError('Write what the organizer should change.');
      return;
    }
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      await api(`/review/${encodeURIComponent(project.id)}`, { method: 'POST', body: { decision, note, version: project.version } });
      onDecision(decision);
    } catch (failure) {
      setError(failure);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <article className="record-card review-card">
      <span className="record-status" data-status="submitted">Under review</span>
      <h2>{project.title}</h2>
      <p>{listingLabel(project.listingType)} · {project.location} · {fieldName(project.field)}</p>
      <Deadline date={project.endsAt} />
      {project.schedule && <p>{project.schedule}</p>}
      <section className="review-profile" aria-label="Submitted organizer profile">
        <h3>Submitted profile</h3>
        <p><strong>{profile?.name ?? project.organization}</strong>
          {profile && ` · ${profileKinds.find(({ id }) => id === profile.kind)?.label}`}
          {profile?.location && ` · ${profile.location}`}
        </p>
        {profile?.bio && <p className="review-story">{profile.bio}</p>}
        {website && <a className="back-link" href={website} target="_blank" rel="noopener noreferrer">
          {new URL(website).hostname} <ArrowUpRight size={15} aria-hidden="true" />
        </a>}
      </section>
      <p>{project.summary}</p>
      <p className="review-story">{project.story}</p>
      {project.image && <ReviewListingImage image={project.image} preview={preview} />}
      <ul className="review-needs">
        {project.needs.map((need) => {
          const url = officialUrl(need.url);
          return <li key={need.type}><strong>{kindName(need.type)}</strong><p>{need.detail}</p>{url && <a href={url} target="_blank" rel="noopener noreferrer">Check support link <ArrowUpRight size={14} aria-hidden="true" /></a>}</li>;
        })}
      </ul>
      {proof && <a className="back-link" href={proof} target="_blank" rel="noopener noreferrer">Check proof link <ArrowUpRight size={15} aria-hidden="true" /></a>}
      <form className="stack-form" onSubmit={decide}>
        <label>Reviewer note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={500} /></label>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button type="submit" value="changes_requested" className="button button-outline" disabled={pending}>Request changes</button>
          <button type="submit" value="publish" className="button button-primary" disabled={pending || !canPublish}>Publish project</button>
        </div>
      </form>
    </article>
  );
}

function ReviewQueue() {
  const list = useLoad('/review');
  const [message, setMessage] = useState('');
  return (
    <div className="workspace-page container">
      <div className="workspace-title"><div><h1>Review projects</h1><p>Before you publish, confirm who made the request and where people can help.</p></div></div>
      {message && <p className="notice" role="status">{message}</p>}
      {!list.data ? <LoadState state={list} /> : list.data.projects.length ? (
        <div className="record-list">
          {list.data.projects.map((project) => <ReviewCard key={`${project.id}/${project.version}`} project={project}
            onDecision={(decision) => { setMessage(decision === 'publish' ? 'Project published.' : 'Change request saved.'); list.reload(); }} />)}
        </div>
      ) : <div className="empty-state"><ShieldCheck size={30} strokeWidth={1.6} aria-hidden="true" /><h2>No projects to review</h2></div>}
    </div>
  );
}

export function Review({ user, sessionReady }) {
  if (!sessionReady) return <p className="loading container" role="status">Checking your session…</p>;
  if (!user) return <SignedOut path="/review" title="Review projects">Sign in with a reviewer account to see submitted projects.</SignedOut>;
  if (!user.reviewer) return <div className="page-panel container"><h1>Review projects</h1><p>This page is available to reviewers.</p><a href="/workspace" className="button button-outline">Your projects</a></div>;
  return <ReviewQueue />;
}
