import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpDown, ArrowUpRight, Bookmark, CircleCheck, List, MapPin } from 'lucide-react';
import { fields } from '../shared/catalog.js';
import { useApi } from './http.js';
import { signInLink } from './auth.jsx';
import { Button, Field, Notice } from './components/controls.jsx';
import { FeaturedOpportunities, filterListings, initialListingFilters, ListingFilters, ProjectCards, ProjectOrganizer, ShortlistToggle, SwipeOpportunities } from './components/listings.jsx';
import { ShortlistDialog, useShortlist } from './shortlist.jsx';
import { Deadline, EmptyProjects, ErrorNotice, LoadState, fieldName, kindName, listingTypeName, officialUrl, useLoad } from './ui.jsx';

const ProjectMap = lazy(() => import('./components/project-map.jsx'));
const directoryViews = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'swipe', label: 'Swipe', Icon: ArrowUpDown },
  { id: 'map', label: 'Map', Icon: MapPin },
];
const swipeLimit = 5;

class MapBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <>
        <p className="notice" role="status">The map could not load. Browse the matching projects below.</p>
        <ProjectCards projects={this.props.projects} cardActions={this.props.cardActions} />
      </>
    );
  }
}

function MapResults({ projects, cardActions }) {
  const pinned = projects.filter(({ mapLocation }) => mapLocation);
  const unpinned = projects.filter(({ mapLocation }) => !mapLocation);
  return (
    <>
      {pinned.length > 0 ? (
        <MapBoundary projects={pinned} cardActions={cardActions}>
          <Suspense fallback={<p className="loading" role="status">Loading map…</p>}>
            <ProjectMap projects={pinned} />
          </Suspense>
        </MapBoundary>
      ) : <p className="notice">No matching listings have a map pin.</p>}
      {unpinned.length > 0 && (
        <section className="unmapped-listings" aria-labelledby="unmapped-heading">
          <h2 id="unmapped-heading">Listings without pins</h2>
          <ProjectCards projects={unpinned} heading="h3" cardActions={cardActions} />
        </section>
      )}
    </>
  );
}

export function HomePage() {
  const load = useLoad('/projects');
  const [filters, setFilters] = useState(initialListingFilters);
  const [view, setView] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    return directoryViews.some(({ id }) => id === requested) ? requested : 'list';
  });
  const [city, setCity] = useState(() => new URLSearchParams(window.location.search).get('city') ?? '');
  const directory = useRef(null);
  const shortlistButton = useRef(null);
  const shortlist = useShortlist();
  const [shortlistOpen, setShortlistOpen] = useState(() => new URLSearchParams(window.location.search).get('shortlist') === '1');
  const savedIds = new Set(shortlist.entries.map(({ id }) => id));
  const savedCount = savedIds.size;
  const projects = load.data?.projects ?? [];
  const cities = [...new Map(projects.filter(({ mapLocation }) => mapLocation)
    .map(({ mapLocation }) => [mapLocation.id, mapLocation.label])).entries()]
    .sort((left, right) => left[1].localeCompare(right[1]));
  const selectedCity = cities.some(([id]) => id === city) ? city : '';
  const filtered = Boolean(selectedCity || filters.query.trim() || filters.field !== 'all' || filters.type !== 'all');
  const matches = filterListings(projects, filters).filter(({ mapLocation }) => !selectedCity || mapLocation?.id === selectedCity);
  const swipeProjects = view === 'swipe' ? matches.slice(0, swipeLimit) : [];

  useEffect(() => {
    if (window.location.hash === '#projects') directory.current?.scrollIntoView();
  }, [load.data]);

  function setDirectoryView(nextView, nextCity) {
    setView(nextView);
    setCity(nextCity);
    const url = new URL(window.location.href);
    if (nextView === 'list') url.searchParams.delete('view');
    else url.searchParams.set('view', nextView);
    if (nextCity) url.searchParams.set('city', nextCity);
    else url.searchParams.delete('city');
    url.hash = 'projects';
    window.history.replaceState(window.history.state, '', url);
  }

  function changeView(nextView) {
    if (nextView === view) return;
    setDirectoryView(nextView, selectedCity);
    directory.current?.scrollIntoView();
  }

  function browseAll() {
    changeView('list');
    directory.current?.focus({ preventScroll: true });
  }

  function showShortlist(open) {
    setShortlistOpen(open);
    const url = new URL(window.location.href);
    if (open) {
      url.searchParams.set('shortlist', '1');
      url.hash = 'projects';
    } else {
      url.searchParams.delete('shortlist');
    }
    window.history.replaceState(window.history.state, '', url);
    if (!open) shortlistButton.current?.focus({ preventScroll: true });
  }

  function saveAction(project) {
    const saved = savedIds.has(project.id);
    return <ShortlistToggle project={project} saved={saved}
      onToggle={() => saved ? shortlist.remove(project.id) : shortlist.save(project)} />;
  }

  return (
    <>
      <section className="garden-entrance" aria-labelledby="home-heading">
        <img className="garden-entrance-art" src="/art/flower-garden.jpg" alt="" width="1200" height="801" fetchPriority="high" />
        <div className="garden-entrance-copy container">
          <p className="garden-entrance-identity">The Buddhist volunteer platform</p>
          <h1 id="home-heading">Where service is a practice</h1>
          <p>Find a way to help or post a request for your community. After you serve, plant a seed in your private garden.</p>
          <div className="service-board-actions">
            <Button href="#projects">Find a way to serve</Button>
            <Button variant="outline" href="/workspace">Post a service opportunity</Button>
          </div>
        </div>
      </section>
      <FeaturedOpportunities projects={projects} />
      <section id="projects" ref={directory} className="catalog-section container" aria-label="Service opportunities" tabIndex={-1}>
        {load.data && <div className="catalog-toolbar">
          <div className="catalog-view" role="group" aria-label="Directory view">
            {directoryViews.map(({ id, label, Icon }) => (
              <Button key={id} variant="plain" aria-pressed={view === id} aria-controls="catalog-results"
                onClick={() => changeView(id)}>
                <Icon size={16} aria-hidden="true" /> {label}
              </Button>
            ))}
          </div>
          <p className="result-count" role="status">{matches.length} {matches.length === 1 ? 'listing' : 'listings'}</p>
          <Button ref={shortlistButton} variant="outline" className="catalog-shortlist" aria-haspopup="dialog"
            aria-label={savedCount ? `Shortlist, ${savedCount} saved` : 'Shortlist'} onClick={() => showShortlist(true)}>
            <Bookmark size={17} aria-hidden="true" /> Shortlist
            {savedCount > 0 && <span className="shortlist-count">{savedCount}</span>}
          </Button>
        </div>}
        <div className="catalog-layout">
          <ListingFilters filters={filters} onChange={setFilters} compact={view === 'swipe'}>
            {cities.length > 0 && <div className="catalog-city">
              <Field as="select" label="City" value={selectedCity}
                onChange={(event) => setDirectoryView(view, event.target.value)}>
                <option value="">All cities</option>
                {cities.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </Field>
            </div>}
          </ListingFilters>
          <div id="catalog-results" className="catalog-results">
            {!load.data ? <LoadState state={load} /> : matches.length === 0 ? (
              <EmptyProjects filtered={filtered} onReset={() => {
                setFilters(initialListingFilters);
                setDirectoryView(view, '');
              }} />
            ) : view === 'map' ? <MapResults projects={matches} cardActions={saveAction} /> : view === 'swipe' ? (
              <SwipeOpportunities key={swipeProjects.map(({ id }) => id).join(',')} projects={swipeProjects} savedIds={savedIds}
                onSave={shortlist.save} onRemove={shortlist.remove}
                onBrowseAll={matches.length > swipeLimit ? browseAll : undefined} />
            ) : <ProjectCards projects={matches} cardActions={saveAction} />}
          </div>
        </div>
      </section>
      {shortlistOpen && <ShortlistDialog entries={shortlist.entries} stored={shortlist.stored} load={load}
        onRemove={shortlist.remove} onClose={() => showShortlist(false)} />}
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
        <Button href="/garden">Open my garden</Button>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div><ErrorNotice error={error ?? 'This service request is unavailable.'} />
        <Button href="/garden" variant="outline">Open my garden</Button>
      </div>
    );
  }

  return (
    <form className="stack-form report-form" onSubmit={report}>
      <fieldset disabled={Boolean(attempt)}>
        <label>How did you serve?
          <select value={type} onChange={(event) => setType(event.target.value)} required>
            {project.needs.map(({ type: value }) => <option value={value} key={value}>{kindName(value)}</option>)}
          </select>
        </label>
        <label>What do you want to cultivate?
          <select value={intention} onChange={(event) => setIntention(event.target.value)} required>
            {fields.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <Field label="What did you do?" optional hint="Only you can see this note." as="textarea"
          rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        <label className="check-field"><input type="checkbox" defaultChecked={Boolean(attempt)} required /> I already helped with this request.</label>
      </fieldset>
      <ErrorNotice error={error} />
      {error?.status === 401 ? <Button href={signInLink(`/projects/${project.slug}`)}>Sign in to retry</Button>
        : <Button type="submit" disabled={pending}>{pending ? 'Saving…' : attempt ? 'Retry save' : 'Save record'}</Button>}
    </form>
  );
}

export function ProjectPage({ slug, user, sessionReady }) {
  const load = useLoad(`/projects/${encodeURIComponent(slug)}`);
  const project = load.data?.project;
  const shortlist = useShortlist();
  const saved = shortlist.entries.some(({ id }) => id === project?.id);
  const fromShortlist = new URLSearchParams(window.location.search).get('from') === 'shortlist';
  return (
    <div className="detail-page container">
      <a href={fromShortlist ? '/?shortlist=1#projects' : '/#projects'} className="back-link">
        <ArrowLeft size={17} aria-hidden="true" /> {fromShortlist ? 'Back to shortlist' : 'Service board'}
      </a>
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
            {project.open && <div className="project-card-actions">
              <ShortlistToggle project={project} saved={saved}
                onToggle={() => saved ? shortlist.remove(project.id) : shortlist.save(project)} />
              {!fromShortlist && shortlist.entries.length > 0 && <Button variant="plain" href="/?shortlist=1#projects">
                View shortlist
              </Button>}
            </div>}
            {project.demo && <p className="project-example">Preview listing. Organizer action links are disabled.</p>}
            {!project.open && <Notice>{project.fulfilledAt
              ? 'The organizer marked this request fulfilled.' : 'This request is closed.'}</Notice>}
          </section>

          <div className="project-body">
            <div className="project-story">
              {project.volunteerFit && (
                <section aria-labelledby="project-fit-heading">
                  <h2 id="project-fit-heading">Who might enjoy this?</h2>
                  <p className="project-fit-text">{project.volunteerFit}</p>
                </section>
              )}
              <section id="needs" aria-labelledby="needs-heading">
                <h2 id="needs-heading">What they need</h2>
                {project.completion && <div className="project-completion">
                  <h3>What counts as complete</h3>
                  <p>{project.completion}</p>
                </div>}
                <ul className="need-list">
                  {project.needs.map((need) => {
                    const url = project.open && !project.demo ? officialUrl(need.url) : null;
                    return (
                      <li key={need.type}>
                        <div><h3>{kindName(need.type)}</h3><p>{need.detail}</p></div>
                        {url && <Button href={url} target="_blank" rel="noopener noreferrer">Respond to organizer <ArrowUpRight size={17} aria-hidden="true" /></Button>}
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section aria-labelledby="story-heading">
                <h2 id="story-heading">About the opportunity</h2>
                {project.story.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                {project.mapLocation && <a className="back-link project-map-link"
                  href={`/?view=map&city=${encodeURIComponent(project.mapLocation.id)}#projects`}>
                  <MapPin size={16} aria-hidden="true" /> View {project.mapLocation.label} on the map
                </a>}
                {project.image && <img className="project-detail-image" src={project.image.url} alt={project.image.alt} decoding="async" />}
              </section>
            </div>
            <aside className="support-panel" aria-labelledby="support-heading">
              <h2 id="support-heading">Record past service</h2>
              <p>If you already helped, record what you did. You’ll get a seed in your private garden.</p>
              {user ? <SupportForm key={`${project.id}/${user.id}`} project={project} user={user} />
                : sessionReady ? <Button href={signInLink(`/projects/${project.slug}`)}>Sign in to record service</Button> : <p role="status">Checking your session…</p>}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
