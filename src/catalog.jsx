import { useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CircleCheck, Search, X } from 'lucide-react';
import { fields, listingTypes } from '../shared/catalog.js';
import { useApi } from './http.js';
import { signInLink } from './auth.jsx';
import { dateLabel, Deadline, EmptyProjects, ErrorNotice, LoadState, fieldName, kindName, listingTypeName, officialUrl, useLoad } from './ui.jsx';

const fieldFilters = [{ id: 'all', label: 'All fields' }, ...fields];

function ProjectOrganizer({ project }) {
  if (!project.profile) return <strong>{project.organization}</strong>;
  return <a className="profile-link" href={`/profiles/${encodeURIComponent(project.profile.slug)}`}>{project.profile.name}</a>;
}

function ProjectCard({ project, heading: Heading }) {
  return (
    <article className="project-card">
      <p className="project-card-type"><strong>{listingTypeName(project.listingType)}</strong><span>{fieldName(project.field)}</span></p>
      <Heading><a href={`/projects/${project.slug}`}>{project.title}</a></Heading>
      <p className="project-byline">By <ProjectOrganizer project={project} /></p>
      <p className="project-summary">{project.summary}</p>
      <dl className="project-facts">
        {project.location && <div><dt>Where</dt><dd>{project.location}</dd></div>}
        {project.schedule && <div><dt>When</dt><dd>{project.schedule}</dd></div>}
        <div><dt>Ways to help</dt><dd>{project.needs.map(({ type }) => kindName(type)).join(', ')}</dd></div>
        {project.endsAt && !project.demo && <div><dt>Listing closes</dt><dd><time dateTime={project.endsAt}>{dateLabel(project.endsAt)}</time></dd></div>}
      </dl>
    </article>
  );
}

export function ProjectCards({ projects, heading = 'h2' }) {
  return <div className="project-cards">{projects.map((project) => <ProjectCard key={project.id} project={project} heading={heading} />)}</div>;
}

export function HomePage() {
  const load = useLoad('/projects');
  const [field, setField] = useState('all');
  const [listingType, setListingType] = useState('all');
  const [search, setSearch] = useState('');
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const projects = load.data?.projects ?? [];
  const filtered = field !== 'all' || listingType !== 'all' || terms.length > 0;
  const matches = projects.filter((project) => {
    if (field !== 'all' && project.field !== field) return false;
    if (listingType !== 'all' && (project.listingType ?? 'project') !== listingType) return false;
    const words = [project.title, project.profile?.name ?? project.organization, project.location, project.summary,
      fieldName(project.field), listingTypeName(project.listingType), project.schedule,
      ...project.needs.map(({ type, detail }) => `${kindName(type)} ${detail}`)].join(' ').toLowerCase();
    return terms.every((term) => words.includes(term));
  });

  function resetFilters() {
    setField('all');
    setListingType('all');
    setSearch('');
  }

  return (
    <>
      <section className="garden-entrance" aria-labelledby="home-heading">
        <img className="garden-entrance-art" src="/art/flower-garden.jpg" alt="" width="1200" height="801" fetchPriority="high" />
        <div className="garden-entrance-copy container">
          <h1 id="home-heading">Help a community project</h1>
          <p>Give money, supplies, time, or skills directly to the people doing the work.</p>
          <a className="button button-primary" href="#projects">Browse projects</a>
        </div>
      </section>
      <section id="projects" className="catalog-section container" aria-label="Project directory">
        <div className="catalog-layout">
          <div className="catalog-controls">
            <label className="search-label" htmlFor="project-search">Search projects</label>
            <div className="search-box">
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input id="project-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try pantry" />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} aria-hidden="true" /></button>}
            </div>
            <label className="catalog-type-label">
              Listing type
              <select value={listingType} onChange={(event) => setListingType(event.target.value)}>
                <option value="all">All listings</option>
                {listingTypes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <fieldset className="field-filters">
              <legend>Filter by field</legend>
              <div className="field-options">
                {fieldFilters.map(({ id, label }) => (
                  <button key={id} type="button" aria-pressed={field === id} onClick={() => setField(id)}>{label}</button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="catalog-results">
            {!load.data ? <LoadState state={load} /> : (
              <>
                <p className="result-count" role="status">{matches.length} {matches.length === 1 ? 'listing' : 'listings'}</p>
                {matches.length ? <ProjectCards projects={matches} /> : <EmptyProjects filtered={filtered} onReset={resetFilters} />}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function attemptKeyFor(user, project) {
  return `ph-support:${user.id}:${project.id}`;
}

function readAttempt(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    return value && typeof value.requestId === 'string' ? value : null;
  } catch {
    return null;
  }
}

function saveAttempt(key, value) {
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  } catch {
    // React state retains the request ID for this tab if storage is unavailable.
  }
}

export function clearSupportAttempts(userId) {
  try {
    const prefix = `ph-support:${userId}:`;
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in this browser.
  }
}

function SupportForm({ project, user }) {
  const api = useApi();
  const attemptKey = attemptKeyFor(user, project);
  const [attempt, setAttempt] = useState(() => readAttempt(attemptKey));
  const [type, setType] = useState(attempt?.type ?? project.needs[0]?.type ?? '');
  const [intention, setIntention] = useState(attempt?.intention ?? project.field);
  const [note, setNote] = useState(attempt?.note ?? '');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);

  async function report(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    const payload = attempt ?? { projectId: project.id, type, intention, note, requestId: crypto.randomUUID() };
    setAttempt(payload);
    saveAttempt(attemptKey, payload);
    try {
      await api('/support', { method: 'POST', body: payload });
      setSaved(true);
      saveAttempt(attemptKey, null);
      setAttempt(null);
    } catch (failure) {
      if ([400, 403, 404, 409, 422].includes(failure.status)) {
        saveAttempt(attemptKey, null);
        setAttempt(null);
      }
      if (failure.status === 404) setUnavailable(true);
      if (failure.status === 400 && !project.needs.some((need) => need.type === type)) setType(project.needs[0]?.type ?? '');
      setError(failure);
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }

  if (saved) {
    return (
      <div className="support-saved" role="status">
        <CircleCheck size={32} aria-hidden="true" />
        <h2>Help recorded</h2>
        <p>You earned a seed for your private garden.</p>
        <a className="button button-primary" href="/garden">Open my garden</a>
      </div>
    );
  }

  if (unavailable || !project.open && !attempt) {
    return (
      <div><ErrorNotice error={error ?? 'This project has closed.'} />
        <a className="button button-outline" href="/garden">Open my garden</a>
      </div>
    );
  }

  return (
    <form className="stack-form report-form" onSubmit={report}>
      <fieldset disabled={Boolean(attempt)}>
        <label>How did you help?
          <select value={type} onChange={(event) => setType(event.target.value)} required>
            {project.needs.map(({ type: value }) => <option value={value} key={value}>{kindName(value)}</option>)}
          </select>
        </label>
        <label>Choose a field for this seed
          <select value={intention} onChange={(event) => setIntention(event.target.value)} required>
            {fields.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <label>Private note <span className="optional">Optional</span>
          <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="check-field"><input type="checkbox" defaultChecked={Boolean(attempt)} required /> I already helped this project.</label>
      </fieldset>
      <ErrorNotice error={error} />
      {error?.status === 401 ? <a className="button button-primary" href={signInLink(`/projects/${project.slug}`)}>Sign in to retry</a>
        : <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : attempt ? 'Retry save' : 'Save record'}</button>}
    </form>
  );
}

export function ProjectPage({ slug, user, sessionReady }) {
  const load = useLoad(`/projects/${encodeURIComponent(slug)}`);
  const project = load.data?.project;
  const canRecover = project && user && !project.open && readAttempt(attemptKeyFor(user, project));
  return (
    <div className="detail-page container">
      <a href="/#projects" className="back-link"><ArrowLeft size={17} aria-hidden="true" /> All projects</a>
      {!project ? <LoadState state={load} /> : (
        <>
          <section className="project-intro">
            <h1>{project.title}</h1>
            <div className="detail-bylines">
              <ProjectOrganizer project={project} />
              <span>{project.location}</span>
              <span>{listingTypeName(project.listingType)}</span>
              <span className="field-label">{fieldName(project.field)}</span>
              {!project.demo && <Deadline date={project.endsAt} />}
            </div>
            {project.schedule && <p className="project-schedule">{project.schedule}</p>}
            <p>{project.summary}</p>
            {project.demo && <p className="project-example">Preview listing. Organizer action links are disabled.</p>}
          </section>

          <div className="project-body">
            <div className="project-story">
              <section aria-labelledby="story-heading">
                <h2 id="story-heading">About the project</h2>
                {project.story.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </section>
              <section id="needs" aria-labelledby="needs-heading">
                <h2 id="needs-heading">What they need</h2>
                <ul className="need-list">
                  {project.needs.map((need) => {
                    const url = project.open && !project.demo ? officialUrl(need.url) : null;
                    return (
                      <li key={need.type}>
                        <div><h3>{kindName(need.type)}</h3><p>{need.detail}</p></div>
                        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="button button-outline">Visit organizer <ArrowUpRight size={17} aria-hidden="true" /></a>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
            <aside className="support-panel" aria-labelledby="support-heading">
              <h2 id="support-heading">Record help</h2>
              {project.open || canRecover ? (
                <>
                  <p>Save a record after you help. Each record earns a seed for your garden.</p>
                  {user ? <SupportForm key={`${project.id}/${user.id}`} project={project} user={user} />
                    : sessionReady ? <a className="button button-primary" href={signInLink(`/projects/${project.slug}`)}>Sign in to record help</a> : <p role="status">Checking your session…</p>}
                </>
              ) : <p>This project has closed.</p>}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
