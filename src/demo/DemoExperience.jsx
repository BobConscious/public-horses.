import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, HeartHandshake, List, MapPin, Map as MapIcon, Search, Sprout, X } from 'lucide-react';
import { fields, supportKinds } from '../../shared/catalog.js';
import { Button, Checkbox, Field } from '../components/controls.jsx';
import { filterListings, initialListingFilters } from '../components/listings.jsx';
import Garden from '../garden.jsx';
import { ApiContext } from '../http.js';
import {
  actionLabels, dateOffset, demoDate, demoHref, demoMember, featuredProjectId, loadDemoState, makeSeed, places,
  profiles, projectHref, resetDemoState, saveDemoState, updateGardenSeed, withPublicFacts, yogiCorpsArchive,
} from './data.js';
import { Organizer, ReviewQueue } from './management.jsx';
import './demo.css';

const ProjectMap = lazy(() => import('../components/project-map.jsx'));
const visibleStatuses = new Set(['published', 'fulfilled', 'closed']);
const pages = [
  ['board', 'Service board'],
  ['activity', 'My activity'],
  ['garden', 'My garden'],
  ['organizer', 'Organize'],
  ['review', 'Review'],
];
const boardAnchor = demoHref() + '#opportunities';
const fieldLabel = (value) => fields.find(({ id }) => value === id)?.label ?? value;
const helpLabel = (value) => supportKinds.find(({ id }) => value === id)?.label ?? value;

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  return { view: params.get('view') ?? 'board', id: params.get('id'), hash: window.location.hash };
}

function DemoHeader({ view }) {
  const current = ['opportunity', 'organizer-profile'].includes(view) ? 'board' : view;
  return (
    <header className="demo-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="demo-wrap demo-header-row">
        <a href={demoHref()} className="demo-wordmark">
          <img src="/horse-mark.svg" alt="" width="36" height="36" />
          Public Horses
        </a>
        <nav aria-label="Main navigation" className="demo-navigation">
          {pages.map(([page, label]) => <a href={demoHref(page)} key={page} aria-current={page === current ? 'page' : undefined}>{label}</a>)}
        </nav>
        <Button className="demo-sign-in" href="/sign-in" variant="outline">Sign in</Button>
      </div>
      <div className="demo-banner"><p className="demo-wrap">Sample requests based on YSI Yogi Corps projects. Changes stay in this tab.</p></div>
    </header>
  );
}

function DemoFooter({ onReset }) {
  return (
    <footer className="demo-footer">
      <div className="demo-wrap demo-footer-row">
        <a href={demoHref('about')}>About Public Horses</a>
        <a href={yogiCorpsArchive}>Archived Yogi Corps profiles</a>
        <button className="demo-text-button" onClick={onReset}>Reset demo</button>
      </div>
    </footer>
  );
}

function ProjectTags({ needs }) {
  return <div className="demo-tags">{needs.map(({ type }) => <span className="demo-tag" key={type}>{helpLabel(type)}</span>)}</div>;
}

function ProjectMeta({ project }) {
  return (
    <div className="demo-project-meta">
      <span><MapPin size={16} aria-hidden="true" /> {project.location}</span>
      <span><CalendarDays size={16} aria-hidden="true" /> {demoDate(project.fulfilledOn ?? project.date)}</span>
      {project.hours && project.status !== 'fulfilled' && <span><Clock3 size={16} aria-hidden="true" /> {project.hours}</span>}
    </div>
  );
}

function ProjectTile({ project }) {
  const href = projectHref(project);
  const done = project.status === 'fulfilled';
  return (
    <article className="demo-project-card">
      {project.image && <a href={href} className="demo-card-image" tabIndex={-1} aria-hidden="true">
        <img src={project.image} alt="" loading="lazy" width="940" height="627" />
      </a>}
      <div className="demo-card-body">
        <div className="demo-card-kicker">
          <span className="demo-field">{fieldLabel(project.field)}</span>
          {done && <span className="demo-tag demo-tag-green"><Check size={13} aria-hidden="true" /> Fulfilled</span>}
          {project.full && !done && <span className="demo-tag demo-tag-gold">Full</span>}
        </div>
        <h3><a href={href}>{project.title} <ArrowRight size={17} aria-hidden="true" /></a></h3>
        <a className="demo-organizer-link" href={demoHref('organizer-profile', project.organizerId)}>{project.profile.name}</a>
        <p>{done ? project.result : project.summary}</p>
        <ProjectMeta project={project} />
        {!done && <ProjectTags needs={project.needs} />}
      </div>
    </article>
  );
}

function ProjectGrid({ projects }) {
  return <div className="demo-grid">{projects.map((project) => <ProjectTile key={project.id} project={project} />)}</div>;
}

function Board({ projects, options, setOptions }) {
  const { query, field, help, city, status, display } = options;
  const change = (key, value) => setOptions({ ...options, [key]: value });
  const visible = projects.filter((project) => project.status === status);
  const matches = filterListings(visible, { query, field, help, type: 'all' }).filter((project) => city === 'all' || project.place === city);
  const filtered = query.trim() || field !== 'all' || help !== 'all' || city !== 'all';
  const featured = projects.find(({ id, status }) => id === featuredProjectId && status === 'published');
  const unpinned = matches.filter(({ mapLocation }) => !mapLocation);
  return (
    <div className="demo-wrap">
      <section className="demo-welcome" aria-labelledby="welcome-title">
        <div className="demo-welcome-copy">
          <h1 id="welcome-title">Find your next<br /> way to <em>serve.</em></h1>
          <p>Give time, share a skill, or meet a need in your community.</p>
          <div className="form-actions">
            <Button href={boardAnchor}>Find an opportunity <ArrowRight size={17} aria-hidden="true" /></Button>
            <Button href={demoHref('garden')} variant="outline">Explore my garden</Button>
          </div>
        </div>
        <figure className="demo-hero-image">
          <img src="/brand/botanical-swamp-magnolia.webp" alt="Mary Vaux Walcott’s study of swamp magnolia" fetchPriority="high" />
          {featured && <figcaption><a href={projectHref(featured)}>
            <span><strong>{featured.title}</strong><small>{featured.profile.name}</small></span><ArrowRight size={18} aria-hidden="true" />
          </a></figcaption>}
        </figure>
      </section>
      <section className="demo-directory" id="opportunities" tabIndex={-1} aria-labelledby="opportunities-title">
        <div className="demo-page-heading demo-directory-heading">
          <div><h2 id="opportunities-title">Service opportunities</h2><p role="status">{matches.length} {matches.length === 1 ? 'opportunity' : 'opportunities'}</p></div>
          <div className="demo-segment" role="group" aria-label="Opportunity status">
            <button aria-pressed={status === 'published'} onClick={() => change('status', 'published')}>Open</button>
            <button aria-pressed={status === 'fulfilled'} onClick={() => change('status', 'fulfilled')}>Completed</button>
          </div>
        </div>
        <div className="demo-filters">
          <div className="demo-search">
            <Search size={18} aria-hidden="true" />
            <Field label="Search opportunities" type="search" placeholder="Try chair yoga or captions" value={query} onChange={(event) => change('query', event.target.value)} />
          </div>
          <Field label="Location" as="select" value={city} onChange={(event) => change('city', event.target.value)}>
            <option value="all">All locations</option>
            {Object.entries(places).map(([key, place]) => <option key={key} value={key}>{place.label}</option>)}
            <option value="online">Online</option>
          </Field>
          <Field label="Ways to help" as="select" value={help} onChange={(event) => change('help', event.target.value)}>
            <option value="all">All ways to help</option>
            {supportKinds.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </Field>
          <Field label="Field" as="select" value={field} onChange={(event) => change('field', event.target.value)}>
            <option value="all">All fields</option>
            {fields.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </Field>
          <div className="demo-segment demo-view-tabs" role="group" aria-label="Directory view">
            <button aria-pressed={display === 'list'} onClick={() => change('display', 'list')}><List size={16} aria-hidden="true" /> List</button>
            <button aria-pressed={display === 'map'} onClick={() => change('display', 'map')}><MapIcon size={16} aria-hidden="true" /> Map</button>
          </div>
        </div>
        {filtered && <button className="demo-text-button demo-clear" onClick={() => setOptions({ ...options, query: '', field: 'all', help: 'all', city: 'all' })}>Clear filters</button>}
        {matches.length === 0 ? <div className="demo-empty"><Search aria-hidden="true" /><h3>No matching opportunities</h3><p>Try a different location or way to help.</p></div>
          : display === 'map' ? (
            <div className="demo-map-pane">
              {unpinned.length !== matches.length &&
                <Suspense fallback={<p role="status">Loading the map…</p>}><ProjectMap projects={matches} getProjectHref={projectHref} /></Suspense>}
              {unpinned.length > 0 && <section className="demo-online"><h3>Requests without a map pin</h3><ProjectGrid projects={unpinned} /></section>}
            </div>
          ) : <ProjectGrid projects={matches} />}
      </section>
    </div>
  );
}

function OrganizerBadge({ profile }) {
  return <span className={'demo-avatar demo-avatar-' + profile.color} aria-hidden="true">{profile.mark}</span>;
}

function Opportunity({ project, responses, seeds, openAction }) {
  const profile = project.profile;
  const done = project.status === 'fulfilled';
  const open = project.status === 'published';
  const recorded = seeds.some(({ projectId }) => projectId === project.id);
  return (
    <section className="demo-wrap demo-inner-page">
      <a href={boardAnchor} className="demo-back"><ArrowLeft size={17} aria-hidden="true" /> Service board</a>
      <div className="demo-detail-title">
        <div>
          <div className="demo-card-kicker"><span className="demo-field">{fieldLabel(project.field)}</span>
            {done && <span className="demo-tag demo-tag-green"><Check size={14} aria-hidden="true" /> Fulfilled</span>}
            {project.full && open && <span className="demo-tag demo-tag-gold">Full</span>}</div>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          <ProjectMeta project={project} />
        </div>
        {project.image && <img src={project.image} alt="" width="940" height="627" />}
      </div>
      <div className="demo-detail-grid">
        <section className="demo-detail-main">
          {done && <div className="demo-result"><Check size={22} aria-hidden="true" /><div><strong>Sample result from the organizer</strong><p>{project.result}</p></div></div>}
          {!open && !done && <p className="demo-note">The organizer closed this request.</p>}
          <h2>{open ? 'How you can help' : 'The request'}</h2>
          <div className="demo-completion"><strong>What counts as complete</strong><p>{project.completion}</p></div>
          {open && project.needs.map((need) => {
            const sent = responses.some(({ projectId, type }) => projectId === project.id && type === need.type);
            return (
              <article className="demo-need" key={need.type}>
                <div><h3>{helpLabel(need.type)}</h3><p>{need.detail}</p></div>
                {sent ? <Button href={demoHref('activity')} variant="outline">View response</Button>
                  : project.full && need.type === 'time' ? <a href={boardAnchor} className="demo-inline-link">Find another opportunity</a>
                    : <Button onClick={() => openAction('response', project.id, need.type)}>{actionLabels[need.type]}</Button>}
              </article>
            );
          })}
          {!open && <Button href={boardAnchor} variant="outline">Find another opportunity</Button>}
        </section>
        <aside className="demo-sidebar">
          <div className="demo-aside-card">
            <OrganizerBadge profile={profile} />
            <h2>{profile.name}</h2>
            <p>{profile.about}</p>
            <a className="demo-inline-link" href={demoHref('organizer-profile', project.organizerId)}>Organizer profile</a>
          </div>
          <div className="demo-aside-card demo-past-service">
            <Sprout size={24} aria-hidden="true" />
            <h2>Record past service</h2>
            <p>{recorded ? 'This act is in your private garden.' : 'If you already helped, save what you did and choose an intention.'}</p>
            {recorded ? <Button href={demoHref('garden') + '#service-journal'} variant="outline">Open service journal</Button>
              : <Button variant="outline" onClick={() => openAction('record', project.id, project.needs[0].type)}>Record service</Button>}
          </div>
        </aside>
      </div>
    </section>
  );
}

function OrganizerProfile({ id, projects }) {
  const profile = profiles[id];
  if (!profile) return null;
  const own = projects.filter(({ organizerId }) => organizerId === id);
  const active = own.filter(({ status }) => status === 'published');
  const complete = own.filter(({ status }) => status === 'fulfilled');
  return (
    <section className="demo-wrap demo-inner-page">
      <a href={boardAnchor} className="demo-back"><ArrowLeft size={17} aria-hidden="true" /> Service board</a>
      <div className="demo-profile-header">
        <OrganizerBadge profile={profile} />
        <div><h1>{profile.name}</h1><p>{profile.about}</p><p className="demo-muted">{profile.lead} · {profile.location ?? places[profile.place]?.label}</p>
          <a className="demo-inline-link" href={yogiCorpsArchive}>Archived Yogi Corps profile</a>
        </div>
      </div>
      <h2 className="demo-subheading">Open requests</h2>
      {active.length ? <ProjectGrid projects={active} /> : <p className="demo-muted">This organizer has no open requests.</p>}
      {complete.length > 0 && <div className="demo-online"><h2 className="demo-subheading">Completed requests</h2><ProjectGrid projects={complete} /></div>}
    </section>
  );
}

function Activity({ projects, responses, seeds, openAction, removeResponse }) {
  return (
    <section className="demo-wrap demo-inner-page">
      <div className="demo-page-heading"><div><span className="demo-overline">{demoMember.name}</span><h1>My activity</h1></div>
        <Button href={boardAnchor} variant="outline">Find an opportunity</Button></div>
      {responses.length ? <div className="demo-list">{responses.map((response) => {
        const project = projects.find(({ id }) => id === response.projectId);
        if (!project) return null;
        const recorded = seeds.some(({ projectId }) => projectId === project.id);
        return (
          <article className="demo-list-row" key={response.projectId + response.type}>
            <div>
              <span className={'demo-tag' + (recorded ? ' demo-tag-green' : '')}>{recorded ? 'Service recorded' : 'Response saved'}</span>
              <h2><a href={projectHref(project)}>{project.title}</a></h2>
              <p>{helpLabel(response.type)}{response.amount ? ' · $' + response.amount + ' sample gift' : ''} · {project.profile.name}</p>
            </div>
            <div className="demo-row-actions">
              {recorded ? <Button variant="outline" href={demoHref('garden') + '#service-journal'}>Open service journal</Button>
                : <Button onClick={() => openAction('record', project.id, response.type)}>Record service</Button>}
              <Button variant="plain" onClick={() => removeResponse(response)}>Remove response</Button>
            </div>
          </article>
        );
      })}</div> : <div className="demo-empty"><HeartHandshake aria-hidden="true" /><h2>No responses yet</h2><p>Find an opportunity and try its response.</p></div>}
    </section>
  );
}

function About() {
  return (
    <section className="demo-wrap demo-inner-page demo-about">
      <div>
        <h1>Why Public Horses</h1>
        <p>A village pooled its resources to care for a horse that anyone could use. The story gives us a model for lifelong service.</p>
        <p>Find a specific way to help or post a need. After you serve, the private garden gives you a place to reflect on what you notice over time.</p>
        <Button href={boardAnchor}>Find an opportunity</Button>
      </div>
      <img src="/art/about-horse-meadow-840.webp" alt="An illustration of two horses in a meadow" />
    </section>
  );
}

function DemoDialog({ title, onClose, children }) {
  const panel = useRef(null);
  useEffect(() => {
    const dialog = panel.current;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={panel} className="demo-dialog" aria-labelledby="demo-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button type="button" className="demo-dialog-close" aria-label="Close dialog" onClick={onClose}><X size={21} /></button>
      <h2 id="demo-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}

function ServiceAction({ action, project, onSave, onClose }) {
  const [saved, setSaved] = useState(false);
  const record = action.kind === 'record';
  const title = record ? 'Record past service' : actionLabels[action.type];
  const next = record ? demoHref('garden') + '#service-journal' : demoHref('activity');
  const need = project.needs.find(({ type }) => type === action.type);
  return (
    <DemoDialog title={saved ? (record ? 'Service recorded' : 'Response saved') : title} onClose={onClose}>
      {saved ? (
        <div className="demo-dialog-result" role="status">
          <Check size={32} aria-hidden="true" />
          <p>{record ? 'You earned a seed for your private garden.' : 'Your response is in My activity.'}</p>
          <Button href={next}>{record ? 'Open service journal' : 'Open my activity'}</Button>
        </div>
      ) : (
        <form className="demo-action-form" onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          onSave(action, project, values);
          setSaved(true);
        }}>
          <strong>{project.title}</strong>
          {record ? <>
            <Field label="What do you want to cultivate?" name="intention" as="select" defaultValue={project.field}>
              {fields.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </Field>
            <Field label="What did you do?" as="textarea" rows={3} name="note" maxLength={500} optional
              placeholder="I worked with the crew and helped finish the task." />
            <Checkbox label="I completed this act in the demo." name="completed" required />
          </> : <>
            <p>{need?.detail}</p>
            <p className="demo-muted">Try a response to {project.profile.name}. It stays in this tab.</p>
            {action.type === 'funding' && <Field label="Sample amount" name="amount" as="select" defaultValue="25">
              <option value="10">$10</option><option value="25">$25</option><option value="40">$40</option>
            </Field>}
          </>}
          <div className="form-actions">
            <Button type="submit">{record ? 'Save record' : 'Save demo response'}</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}
    </DemoDialog>
  );
}

export default function DemoExperience() {
  const [route, setRoute] = useState(readRoute);
  const [data, setData] = useState(loadDemoState);
  const [options, setOptions] = useState({ ...initialListingFilters, city: 'all', status: 'published', display: 'list' });
  const [action, setAction] = useState(null);
  const navigated = useRef(false);
  const state = useRef(data);
  const projects = useMemo(() => data.projects.map(withPublicFacts), [data.projects]);
  const publicProjects = projects.filter(({ status }) => visibleStatuses.has(status));

  const write = useCallback((update) => {
    const next = update(state.current);
    state.current = next;
    saveDemoState(next);
    setData(next);
  }, []);

  const gardenApi = useCallback(async (path, { method = 'GET', body = {} } = {}) => {
    if (path === '/garden' && method === 'GET') return { seeds: state.current.seeds };
    const entry = /^\/garden\/([^/]+)\/(plant|water|harvest|reflection)$/.exec(path);
    if (!entry) throw new Error('This garden action is unavailable.');
    const [, encodedId, verb] = entry;
    const seed = updateGardenSeed(state.current.seeds, decodeURIComponent(encodedId), verb, body);
    write((current) => ({ ...current, seeds: current.seeds.map((item) => item.id === seed.id ? seed : item) }));
    return { seed };
  }, [write]);

  useEffect(() => {
    document.title = 'Public Horses | Interactive demo';
    const handleBack = () => { navigated.current = true; setAction(null); setRoute(readRoute()); };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);

  useEffect(() => {
    if (route.hash === '#opportunities' && route.view === 'board') {
      const directory = document.getElementById('opportunities');
      directory?.focus({ preventScroll: true });
      directory?.scrollIntoView();
    } else if (!route.hash) {
      if (navigated.current) document.getElementById('main')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [route]);

  function navigate(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || !link.getAttribute('href').startsWith('/experience')) return;
    const href = link.getAttribute('href');
    if (new URL(href, window.location.href).pathname !== '/experience') return;
    event.preventDefault();
    if (href !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState(null, '', href);
    navigated.current = true;
    setAction(null);
    setRoute(readRoute());
  }

  function updateProject(id, expectedStatus, update) {
    write((current) => ({
      ...current, projects: current.projects.map((project) => project.id === id && project.status === expectedStatus ? update(project) : project),
    }));
  }

  function openAction(kind, projectId, type) {
    setAction({ kind, projectId, type });
  }

  function saveAction(entry, project, values) {
    if (entry.kind === 'record') {
      write((current) => current.seeds.some(({ projectId }) => projectId === project.id) ? current : {
        ...current, seeds: [makeSeed(project, { type: entry.type, intention: values.intention, note: values.note.trim() }), ...current.seeds],
      });
    } else {
      write((current) => current.responses.some(({ projectId, type }) => projectId === project.id && type === entry.type) ? current : {
        ...current, responses: [{ projectId: project.id, type: entry.type, amount: values.amount, date: dateOffset() }, ...current.responses],
      });
    }
  }

  const project = publicProjects.find(({ id }) => id === route.id);
  const selected = publicProjects.find(({ id }) => id === action?.projectId);
  let page;
  switch (route.view) {
    case 'board':
      page = <Board projects={publicProjects} options={options} setOptions={setOptions} />;
      break;
    case 'opportunity':
      if (project) page = <Opportunity project={project} responses={data.responses} seeds={data.seeds} openAction={openAction} />;
      break;
    case 'organizer-profile':
      if (Object.hasOwn(profiles, route.id)) page = <OrganizerProfile id={route.id} projects={publicProjects} />;
      break;
    case 'activity':
      page = <Activity projects={publicProjects} responses={data.responses} seeds={data.seeds} openAction={openAction}
        removeResponse={(response) => write((current) => ({ ...current, responses: current.responses.filter((item) => item !== response) }))} />;
      break;
    case 'organizer':
      page = <Organizer projects={projects} updateProject={updateProject}
        addProject={(project) => write((current) => ({ ...current, projects: [project, ...current.projects] }))} />;
      break;
    case 'review':
      page = <ReviewQueue projects={projects} updateProject={updateProject} />;
      break;
    case 'about':
      page = <About />;
      break;
  }
  return (
    <div className="lived-demo" onClick={navigate}>
      <DemoHeader view={route.view} />
      {route.view === 'garden' ? <ApiContext.Provider value={gardenApi}><Garden user={demoMember} boardHref={boardAnchor} /></ApiContext.Provider>
        : <main id="main" className="demo-main" tabIndex={-1}>{page ?? <section className="demo-wrap demo-inner-page"><h1>Request unavailable</h1><Button href={boardAnchor}>Return to the board</Button></section>}</main>}
      <DemoFooter onReset={() => setAction({ kind: 'reset' })} />
      {selected && <ServiceAction action={action} project={selected} onSave={saveAction} onClose={() => setAction(null)} />}
      {action?.kind === 'reset' && <DemoDialog title="Reset the demo?" onClose={() => setAction(null)}>
        <p>Restore the sample projects and garden in this tab.</p>
        <div className="form-actions">
          <Button onClick={() => { write(resetDemoState); window.location.assign(demoHref()); }}>Reset demo</Button>
          <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
        </div>
      </DemoDialog>}
    </div>
  );
}
