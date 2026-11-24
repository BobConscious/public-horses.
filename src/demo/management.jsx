import { useState } from 'react';
import { ArrowUpRight, Check, ClipboardList, Plus } from 'lucide-react';
import { fields, supportKinds } from '../../shared/catalog.js';
import { Button, Field, StatusChip } from '../components/controls.jsx';
import { demoDate, dateOffset, demoHref, demoOrganizer, places, profiles, projectHref } from './data.js';

function statusOf(project) {
  return project.status === 'fulfilled'
    ? <span className="demo-tag demo-tag-green"><Check size={14} aria-hidden="true" /> Fulfilled</span>
    : <StatusChip status={project.status} />;
}

function RequestEditor({ project, onSave, onCancel }) {
  const [error, setError] = useState('');
  function save(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (['title', 'hours', 'summary', 'completion', 'helpDetail'].some((key) => !form[key].trim())) {
      setError('Complete the title, time, request, result, and response instructions.');
      return;
    }
    const need = { type: form.help, detail: form.helpDetail.trim() };
    const needs = [need, ...(project?.needs.slice(1).filter((item) => item.type !== need.type) ?? [])];
    onSave({
      ...project,
      title: form.title.trim(),
      organizerId: demoOrganizer,
      place: form.place,
      date: new Date(form.day + 'T12:00:00Z').toISOString(),
      hours: form.hours.trim(),
      field: form.field,
      summary: form.summary.trim(),
      completion: form.completion.trim(),
      needs,
    });
  }

  return (
    <form className="demo-editor" onSubmit={save}>
      <h2>{project ? 'Edit request' : 'New opportunity'}</h2>
      <Field label="Title" name="title" required maxLength={96} defaultValue={project?.title ?? 'Pack grocery bags for the next pickup'} />
      <div className="demo-form-columns">
        <Field label="Location" name="place" as="select" defaultValue={project?.place ?? 'york'}>
          {Object.entries(places).map(([id, city]) => <option key={id} value={id}>{city.label}</option>)}
          <option value="online">Online</option>
        </Field>
        <Field label="Date" name="day" type="date" required min={dateOffset().slice(0, 10)}
          defaultValue={(project?.date ?? dateOffset(7)).slice(0, 10)} />
        <Field label="Time and duration" name="hours" required maxLength={120} defaultValue={project?.hours ?? '10 to 11 a.m. ET'} />
        <Field label="Field" name="field" as="select" defaultValue={project?.field ?? 'nourishment'}>
          {fields.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </Field>
      </div>
      <Field label="What do you need?" name="summary" as="textarea" rows={2} required maxLength={200}
        defaultValue={project?.summary ?? 'Help the pantry crew pack grocery bags for the next pickup.'} />
      <Field label="What counts as complete?" name="completion" as="textarea" rows={2} required maxLength={280}
        defaultValue={project?.completion ?? 'Pack and label 20 grocery bags.'} />
      <div className="demo-form-columns">
        <Field label="Way to help" name="help" as="select" defaultValue={project?.needs[0]?.type ?? 'time'}>
          {supportKinds.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </Field>
        <Field label="Response instructions" name="helpDetail" required maxLength={240}
          hint="The demo uses a sample response page for this request."
          defaultValue={project?.needs[0]?.detail ?? 'Join the pantry crew at the check-in table for one hour.'} />
      </div>
      {error && <p className="form-field__error" role="alert">{error}</p>}
      <div className="form-actions">
        <Button type="submit">Save draft</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function Organizer({ projects, updateProject, addProject }) {
  const profile = profiles[demoOrganizer];
  const [editing, setEditing] = useState(null);
  const [finishing, setFinishing] = useState(null);
  const [message, setMessage] = useState('');
  const own = projects.filter(({ organizerId }) => organizerId === demoOrganizer);
  const editable = own.find(({ id }) => id === editing);

  function changeStatus(project, status, text) {
    updateProject(project.id, project.status, (current) => ({ ...current, status }));
    setMessage(text);
  }

  function markFulfilled(event, project) {
    event.preventDefault();
    const result = new FormData(event.currentTarget).get('result').trim();
    if (!result) return;
    updateProject(project.id, 'published', (current) => ({ ...current, status: 'fulfilled', result, fulfilledOn: dateOffset() }));
    setFinishing(null);
    setMessage('The organizer marked the request fulfilled.');
  }

  function save(values) {
    if (editable) updateProject(editable.id, editable.status, (current) => ({ ...current, ...values }));
    else addProject({ ...values, id: crypto.randomUUID(), status: 'draft' });
    setEditing(null);
    setMessage('Draft saved.');
  }

  return (
    <section className="demo-wrap demo-inner-page">
      <div className="demo-page-heading">
        <div><span className="demo-overline">{profile.lead} · {profile.name}</span><h1>Organizer workspace</h1></div>
        {!editing && <Button onClick={() => { setEditing('new'); setMessage(''); }}><Plus size={17} aria-hidden="true" /> New opportunity</Button>}
      </div>
      {message && <p className="demo-note" role="status">{message}</p>}
      {editing && <RequestEditor key={editing} project={editable} onSave={save} onCancel={() => setEditing(null)} />}
      <div className="demo-list">
        {own.map((project) => {
          const canEdit = ['draft', 'changes_requested'].includes(project.status);
          const isPublic = ['published', 'fulfilled', 'closed'].includes(project.status);
          return (
            <article className="demo-list-row" key={project.id}>
              <div>
                {statusOf(project)}
                <h2>{project.title}</h2>
                <p>{project.summary}</p>
                {project.status === 'changes_requested' && <p className="demo-review-note">Casey’s note. {project.reviewNote}</p>}
              </div>
              {finishing === project.id ? <form className="demo-finish-form" onSubmit={(event) => markFulfilled(event, project)}>
                <Field label="What did the crew complete?" name="result" required maxLength={280} as="textarea" rows={2} autoFocus />
                <div className="form-actions">
                  <Button type="submit">Confirm fulfillment</Button>
                  <Button variant="outline" onClick={() => setFinishing(null)}>Cancel</Button>
                </div>
              </form> : <div className="demo-row-actions">
                {canEdit && <Button variant="outline" onClick={() => setEditing(project.id)} disabled={Boolean(editing)}>Edit draft</Button>}
                {canEdit && <Button onClick={() => changeStatus(project, 'submitted', 'Request sent for review.')} disabled={Boolean(editing)}>Send for review</Button>}
                {project.status === 'submitted' && <Button variant="outline" href={demoHref('review')}>Open review queue</Button>}
                {isPublic && <Button variant="outline" href={projectHref(project)}>View opportunity</Button>}
                {project.status === 'published' && <Button onClick={() => setFinishing(project.id)}>Mark fulfilled</Button>}
              </div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReviewCard({ project, decide }) {
  const [feedback, setFeedback] = useState(false);
  const profile = profiles[project.organizerId];
  return (
    <article className="demo-review-card">
      <StatusChip status={project.status} />
      <h2>{project.title}</h2>
      <p className="demo-muted">{profile.name} · {project.location} · {demoDate(project.date)}</p>
      <p>{project.summary}</p>
      <div className="demo-completion"><strong>What counts as complete</strong><p>{project.completion}</p></div>
      <details className="demo-proof">
        <summary>Read the private review source</summary>
        <p>{profile.lead} confirmed the sample request for {profile.name}. The sample response page gives the instructions below.</p>
        <ul>{project.needs.map((need) => <li key={need.type}>{need.detail}</li>)}</ul>
      </details>
      {feedback ? (
        <form className="demo-feedback" onSubmit={(event) => {
          event.preventDefault();
          const note = new FormData(event.currentTarget).get('reviewNote').trim();
          if (note) decide(project, 'changes_requested', note);
        }}>
          <Field label="Reviewer note" as="textarea" rows={2} name="reviewNote" required maxLength={500} autoFocus placeholder="What should the organizer change?" />
          <div className="form-actions">
            <Button type="submit">Send changes</Button>
            <Button variant="outline" onClick={() => setFeedback(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="form-actions">
          <Button onClick={() => decide(project, 'published')}><Check size={17} aria-hidden="true" /> Publish</Button>
          <Button variant="outline" onClick={() => setFeedback(true)}>Request changes</Button>
        </div>
      )}
    </article>
  );
}

export function ReviewQueue({ projects, updateProject }) {
  const [decision, setDecision] = useState(null);
  const queue = projects.filter(({ status }) => status === 'submitted');
  function decide(project, status, reviewNote = '') {
    updateProject(project.id, 'submitted', (current) => ({ ...current, status, reviewNote }));
    setDecision({ status, project });
  }
  return (
    <section className="demo-wrap demo-inner-page">
      <div className="demo-page-heading">
        <div><span className="demo-overline">Review as Casey Lin</span><h1>Review queue</h1></div>
        <span className="demo-tag">{queue.length} {queue.length === 1 ? 'request' : 'requests'} waiting</span>
      </div>
      {decision && (
        <div className="demo-note" role="status">
          {decision.status === 'published' ? 'Opportunity published. ' : 'Feedback sent to the organizer. '}
          {decision.status === 'published' && <a href={projectHref(decision.project)}>View opportunity <ArrowUpRight size={14} aria-hidden="true" /></a>}
        </div>
      )}
      {queue.length ? <div className="demo-review-grid">{queue.map((project) => <ReviewCard key={project.id} project={project} decide={decide} />)}</div> : (
        <div className="demo-empty">
          <ClipboardList aria-hidden="true" />
          <h2>The review queue is clear</h2>
          <Button href={demoHref('organizer')} variant="outline">Go to organizer workspace</Button>
        </div>
      )}
    </section>
  );
}
