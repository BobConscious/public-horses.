import { useRef, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, Leaf, MapPin, Search, ShieldCheck, Sprout, X } from 'lucide-react';
import { fields } from '../shared/catalog.js';
import { useApi } from './http.js';
import { signInLink } from './auth.jsx';
import { Deadline, EmptyProjects, ErrorNotice, FieldIcon, LoadState, ProjectArt, fieldName, kindName, officialUrl, useLoad } from './ui.jsx';

const fieldFilters = [{ id: 'all', label: 'All fields' }, ...fields];

function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <a className="card-photo-link" href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true">
        <ProjectArt project={project} />
      </a>
      <div className="project-card-body">
        <div className="card-meta">
          <span className="field-label"><FieldIcon id={project.field} size={15} /> {fieldName(project.field)}</span>
          <span className="card-location"><MapPin size={14} aria-hidden="true" /> {project.location}</span>
        </div>
        <h3><a href={`/projects/${project.slug}`}>{project.title}</a></h3>
        <p className="card-organizer">{project.organization}</p>
        <p className="card-summary">{project.summary}</p>
        <div className="card-footer">
          <span>{project.needs.map(({ type }) => kindName(type)).join(' · ')}</span>
          <a href={`/projects/${project.slug}`} className="card-action" aria-label={`View project: ${project.title}`}><ArrowUpRight size={19} aria-hidden="true" /></a>
        </div>
      </div>
    </article>
  );
}

export function HomePage() {
  const load = useLoad('/projects');
  const [field, setField] = useState('all');
  const [search, setSearch] = useState('');
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const projects = load.data?.projects ?? [];
  const matches = projects.filter((project) => {
    if (field !== 'all' && project.field !== field) return false;
    const words = [project.title, project.organization, project.location, project.summary, fieldName(project.field),
      ...project.needs.map(({ type, detail }) => `${kindName(type)} ${detail}`)].join(' ').toLowerCase();
    return terms.every((term) => words.includes(term));
  });

  function resetFilters() {
    setField('all');
    setSearch('');
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-id"><Sprout size={16} strokeWidth={1.75} aria-hidden="true" /> Kshetra</span>
          <h1>Good grows<br /> here.</h1>
          <p>Find a project that needs your help. Give directly, then grow a private garden of the good you do.</p>
          <a className="button button-primary" href="#projects">Find a project <ArrowDownRight size={19} aria-hidden="true" /></a>
        </div>
        <div className="hero-art" aria-hidden="true" />
      </section>

      <section id="projects" className="catalog-section container" aria-labelledby="catalog-heading">
        <div className="catalog-head">
          <div><h2 id="catalog-heading">Find a way to help</h2><p>Choose a field to see what people need.</p></div>
          <div className="search-box">
            <Search size={19} strokeWidth={1.8} aria-hidden="true" />
            <input type="search" aria-label="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" />
            {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} aria-hidden="true" /></button>}
          </div>
        </div>
        <div className="field-filters" aria-label="Filter by field">
          {fieldFilters.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={field === id} onClick={() => setField(id)}>
              <FieldIcon id={id} /> {label}
            </button>
          ))}
        </div>
        {!load.data ? <LoadState state={load} /> : (
          <>
            <p className="result-count" role="status">{matches.length} {matches.length === 1 ? 'project' : 'projects'}</p>
            {matches.length ? <div className="project-grid">{matches.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
              : <EmptyProjects filtered={field !== 'all' || terms.length > 0} onReset={resetFilters} />}
          </>
        )}
      </section>

      <section className="home-garden container">
        <div className="home-garden-card">
          <div className="home-garden-symbol"><Sprout size={50} strokeWidth={1.2} aria-hidden="true" /></div>
          <div><h2>Make it a practice.</h2><p>Keep a private record of the ways you help. Plant each act as a seed and watch it grow.</p></div>
          <a className="button button-outline" href="/garden">Visit my garden <ArrowRight size={17} aria-hidden="true" /></a>
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
        <h2>Your seed is ready.</h2>
        <p>Your record is saved in your private garden.</p>
        <a className="button button-primary" href="/garden">Plant my seed <ArrowRight size={17} aria-hidden="true" /></a>
      </div>
    );
  }

  if (unavailable || !project.open && !attempt) {
    return (
      <div><ErrorNotice error={error ?? 'This project has closed.'} />
        <a className="button button-outline" href="/garden">Check my garden <ArrowRight size={17} aria-hidden="true" /></a>
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
        <label>What would you like to cultivate?
          <select value={intention} onChange={(event) => setIntention(event.target.value)} required>
            {fields.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <label>Private reflection <span className="optional">Optional</span>
          <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="check-field"><input type="checkbox" defaultChecked={Boolean(attempt)} required /> I already helped this project.</label>
      </fieldset>
      <ErrorNotice error={error} />
      {error?.status === 401 ? <a className="button button-primary" href={signInLink(`/projects/${project.slug}`)}>Sign in to retry <ArrowRight size={17} aria-hidden="true" /></a>
        : <button className="button button-primary" type="submit" disabled={pending}><Sprout size={18} aria-hidden="true" /> {pending ? 'Saving…' : attempt ? 'Retry save' : 'Save my act'}</button>}
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
            <div className="project-intro-copy">
              <span className="field-label"><FieldIcon id={project.field} /> {fieldName(project.field)}</span>
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              <div className="detail-bylines">
                <span className="detail-meta"><ShieldCheck size={17} aria-hidden="true" /> {project.organization}</span>
                <span className="detail-meta"><MapPin size={17} aria-hidden="true" /> {project.location}</span>
                <Deadline date={project.endsAt} />
              </div>
              {project.demo && <p className="notice">Sample project for demonstration.</p>}
            </div>
            <ProjectArt project={project} className="detail-art" />
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
                        {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="button button-outline">Visit organizer <ArrowUpRight size={17} aria-hidden="true" /></a>
                          : project.demo && <span className="field-label">Demo request</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
            <aside className="support-panel" aria-labelledby="support-heading">
              <Leaf size={27} strokeWidth={1.5} aria-hidden="true" />
              <h2 id="support-heading">I helped</h2>
              {project.open || canRecover ? (
                <>
                  <p>Record what you did and save a seed for your garden.</p>
                  {user ? <SupportForm key={`${project.id}/${user.id}`} project={project} user={user} />
                    : sessionReady ? <a className="button button-primary" href={signInLink(`/projects/${project.slug}`)}>Sign in to record help <ArrowRight size={16} aria-hidden="true" /></a> : <p role="status">Checking your session…</p>}
                </>
              ) : <p>This project has closed.</p>}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
