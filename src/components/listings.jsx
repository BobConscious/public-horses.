import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, Sprout, X } from 'lucide-react';
import { fields, listingTypes } from '../../shared/catalog.js';
import { dateLabel, fieldName, kindName, listingTypeName } from '../ui.jsx';
import { Button } from './controls.jsx';
import './listings.css';

const fieldOptions = [{ id: 'all', label: 'All fields' }, ...fields];
export const initialListingFilters = Object.freeze({ query: '', type: 'all', field: 'all' });

export function filterListings(projects, { query, type, field }) {
  const terms = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  return projects.filter((project) => {
    if (field !== 'all' && project.field !== field) return false;
    if (type !== 'all' && (project.listingType ?? 'project') !== type) return false;
    if (!terms.length) return true;
    const words = [
      project.title, project.profile?.name ?? project.organization, project.location,
      project.summary, project.volunteerFit, fieldName(project.field), listingTypeName(project.listingType),
      project.schedule, project.mapLocation?.label,
      ...project.needs.map(({ type: kind, detail }) => `${kindName(kind)} ${detail}`),
    ].join(' ').toLowerCase();
    return terms.every((term) => words.includes(term));
  });
}

export function ListingFilters({ filters, onChange, children, compact = false }) {
  const searchId = useId();
  const moreId = useId();
  const searchInput = useRef(null);
  const [expanded, setExpanded] = useState(false);

  function clearSearch() {
    searchInput.current?.focus();
    onChange({ ...filters, query: '' });
  }

  return (
    <div className={compact ? 'catalog-controls catalog-controls-compact' : 'catalog-controls'}>
      <label className="search-label" htmlFor={searchId}>Search projects</label>
      <div className="search-box">
        <Search size={17} strokeWidth={1.8} aria-hidden="true" />
        <input ref={searchInput} id={searchId} type="search" value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Try a task or city" />
        {filters.query && <button type="button" aria-label="Clear search" onClick={clearSearch}><X size={16} aria-hidden="true" /></button>}
      </div>
      {compact && <Button variant="outline" className="catalog-more-filters" aria-controls={moreId}
        aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        Filters {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </Button>}
      <div id={moreId} className="catalog-filter-fields" data-expanded={expanded}>
        <label className="catalog-type-label">
          Listing type
          <select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value })}>
            <option value="all">All listings</option>
            {listingTypes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        {children}
        <fieldset className="field-filters">
          <legend>Filter by field</legend>
          <div className="field-options">
            {fieldOptions.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={filters.field === id}
                onClick={() => onChange({ ...filters, field: id })}>{label}</button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export function ProjectOrganizer({ project, links = true }) {
  if (!links || !project.profile) return <strong>{project.profile?.name ?? project.organization}</strong>;
  return <a className="profile-link" href={`/profiles/${encodeURIComponent(project.profile.slug)}`}>{project.profile.name}</a>;
}

export function ProjectCard({ project, heading: Heading = 'h2', links = true, compact = false, helpAction = false, actions }) {
  return (
    <article className="project-card">
      <div className="project-card-meta">
        <p className="project-card-seed">
          <span>Seed to plant</span>
          <strong><Sprout size={15} aria-hidden="true" /> {fieldName(project.field)}</strong>
        </p>
        <p className="project-card-type">{listingTypeName(project.listingType)}</p>
      </div>
      <Heading>
        {links && !helpAction ? <a className="project-card-link" href={`/projects/${encodeURIComponent(project.slug)}`}>
          {project.title} <ArrowRight size={20} aria-hidden="true" />
        </a> : project.title}
      </Heading>
      <p className="project-byline">By <ProjectOrganizer project={project} links={links} /></p>
      <div className="project-card-summary">
        <p className="project-summary">{project.summary}</p>
        {project.image && <img className="project-card-image" src={project.image.url} alt={project.image.alt} loading="lazy" decoding="async" />}
      </div>
      <dl className="project-facts">
        {project.location && <div><dt>Where</dt><dd>{project.location}</dd></div>}
        {!compact && project.schedule && <div><dt>When</dt><dd>{project.schedule}</dd></div>}
        <div><dt>Ways to help</dt><dd>{project.needs.map(({ type }) => kindName(type)).join(', ')}</dd></div>
        {!compact && project.endsAt && !project.demo && <div><dt>Listing closes</dt><dd><time dateTime={project.endsAt}>{dateLabel(project.endsAt)}</time></dd></div>}
      </dl>
      {actions && <div className="project-card-actions">{actions}</div>}
    </article>
  );
}

export function OpportunityHelpLink({ project, fromShortlist = false }) {
  return (
    <Button href={`/projects/${encodeURIComponent(project.slug)}${fromShortlist ? '?from=shortlist' : ''}`}>
      See how to help <ArrowRight size={17} aria-hidden="true" />
    </Button>
  );
}

export function ShortlistToggle({ project, saved, onToggle }) {
  return (
    <Button variant="outline" className="shortlist-save" data-saved={saved}
      aria-label={saved ? `Saved. Remove ${project.title} from shortlist` : `Save ${project.title} to shortlist`}
      onClick={onToggle}>
      {saved ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />} {saved ? 'Saved' : 'Save'}
    </Button>
  );
}

const decisionDistance = 62;

export function SwipeOpportunities({ projects, remaining, onSave, onPass, onBrowseAll }) {
  const list = useRef(null);
  const listId = useId();
  const finished = useRef(null);
  const gesture = useRef(null);
  const [position, setPosition] = useState(0);
  const [drag, setDrag] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const active = position < projects.length ? position : 0;
  const activeProject = projects[active];
  const sequence = projects.map(({ id }) => id).join(',');
  const ready = Math.abs(drag) >= decisionDistance;
  const showFeedback = !ready && feedback;

  useLayoutEffect(() => {
    const track = list.current;
    const card = track?.querySelector('li:not([inert])');
    if (card) track.scrollTop = card.offsetTop;
    else if (feedback) finished.current?.focus({ preventScroll: true });
  }, [sequence, feedback]);

  function updateActive({ currentTarget }) {
    const middle = currentTarget.scrollTop + currentTarget.clientHeight / 2;
    setPosition(Array.from(currentTarget.children).findLastIndex((card) => card.offsetTop <= middle));
  }

  function move(index) {
    const track = list.current;
    const card = track.children[index];
    if (card) track.scrollTop = card.offsetTop;
  }

  function decide(saved) {
    setFeedback({ saved, title: activeProject.title });
    if (active + 1 === remaining) setPosition(0);
    if (saved) onSave(activeProject);
    else onPass(activeProject.id);
  }

  function startSwipe(event) {
    const track = event.currentTarget;
    if (!event.isPrimary || event.pointerType === 'mouse' || event.target.closest('a, button')
      || !track.children[active]?.contains(event.target)) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, projectId: activeProject.id };
  }

  function dragSwipe(event) {
    const start = gesture.current;
    if (start?.id !== event.pointerId) return;
    const horizontal = event.clientX - start.x;
    const distance = Math.abs(horizontal);
    const vertical = Math.abs(event.clientY - start.y);
    if (distance < 12 || distance < vertical * 1.4) {
      setDrag(0);
      return;
    }
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(horizontal);
  }

  function finishSwipe(event) {
    const start = gesture.current;
    if (start?.id !== event.pointerId || event.type === 'lostpointercapture' && event.target !== event.currentTarget) return;
    gesture.current = null;
    setDrag(0);
    const horizontal = event.clientX - start.x;
    const distance = Math.abs(horizontal);
    const vertical = Math.abs(event.clientY - start.y);
    if (event.type === 'pointerup' && start.projectId === activeProject.id && distance >= decisionDistance && distance >= vertical * 1.4) {
      decide(horizontal > 0);
    }
  }

  return (
    <div className="swipe-deck">
      {activeProject && <div className="swipe-navigation">
        <Button variant="outline" aria-label={`Pass ${activeProject.title}`} onClick={() => decide(false)}>
          <ArrowLeft size={17} aria-hidden="true" /> Pass
        </Button>
        <div className="swipe-browse-controls">
          {projects.length > 1 && <Button variant="plain" aria-label="Previous opportunity" aria-controls={listId}
            aria-disabled={active === 0} onClick={() => move(active - 1)}>
            <ChevronUp size={17} aria-hidden="true" />
          </Button>}
          <p className="swipe-position" role="status" aria-atomic="true">
            {remaining} left<span className="sr-only">, {activeProject.title}</span>
          </p>
          {projects.length > 1 && <Button variant="plain" aria-label="Next opportunity" aria-controls={listId}
            aria-disabled={active === projects.length - 1} onClick={() => move(active + 1)}>
            <ChevronDown size={17} aria-hidden="true" />
          </Button>}
        </div>
        <Button aria-label={`Save ${activeProject.title} to shortlist`} onClick={() => decide(true)}>
          <Bookmark size={17} aria-hidden="true" /> Save
        </Button>
      </div>}
      <div className="swipe-cue">
        {!showFeedback && activeProject && <p className="swipe-hint" data-ready={ready}>
          {ready ? (drag < 0 ? 'Release to pass.' : 'Release to save.') : 'Swipe left to pass or right to save.'}
        </p>}
        <p className={showFeedback ? 'swipe-feedback' : 'sr-only'} role="status" aria-atomic="true">
          {showFeedback && <>
            {feedback.saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <ArrowLeft size={16} aria-hidden="true" />}
            {feedback.saved ? 'Saved to shortlist' : 'Passed'}
            <span className="sr-only">, {feedback.title}</span>
          </>}
        </p>
      </div>
      {activeProject ? <ol id={listId} ref={list} className="swipe-track" role="list" tabIndex={0}
        aria-label="Opportunity cards" onScroll={updateActive} onPointerDown={startSwipe} onPointerMove={dragSwipe}
        onPointerUp={finishSwipe} onPointerCancel={finishSwipe} onLostPointerCapture={finishSwipe}>
        {projects.map((project, index) => {
          const dragging = index === active && drag !== 0;
          return (
            <li key={project.id} inert={active !== index} className={dragging ? 'swipe-dragging' : undefined}
              style={dragging ? { '--swipe-offset': `${Math.max(-44, Math.min(drag / 3, 44))}px` } : undefined}>
              <ProjectCard project={project} helpAction actions={<OpportunityHelpLink project={project} />} />
            </li>
          );
        })}
      </ol> : <div className="empty-state swipe-complete">
        <h2 ref={finished} tabIndex={-1}>You’re caught up</h2>
        <p>Open Shortlist for saved opportunities or List to reconsider a pass.</p>
      </div>}
      {(!activeProject || remaining > projects.length) && <Button variant="plain" className="swipe-browse-all" onClick={onBrowseAll}>
        Browse all listings <ArrowRight size={16} aria-hidden="true" />
      </Button>}
    </div>
  );
}

export function FeaturedOpportunities({ projects }) {
  const featured = projects.filter(({ open }) => open).slice(0, 6);
  const strip = useRef(null);
  const listId = useId();
  const headingId = useId();
  const [edges, setEdges] = useState({ previous: false, next: false });

  useEffect(() => {
    const list = strip.current;
    if (!list) return;
    function measure() {
      const previous = list.scrollLeft > 1;
      const next = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      setEdges((current) => current.previous === previous && current.next === next ? current : { previous, next });
    }
    const resize = new ResizeObserver(measure);
    resize.observe(list);
    list.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      resize.disconnect();
      list.removeEventListener('scroll', measure);
    };
  }, [featured.length]);

  function step(direction) {
    const list = strip.current;
    const [first, second] = list.children;
    if (second) list.scrollBy({ left: (second.offsetLeft - first.offsetLeft) * direction });
  }

  if (!featured.length) return null;
  const scrollable = edges.previous || edges.next;
  return (
    <section className="featured-opportunities" aria-labelledby={headingId}>
      <div className="container">
        <div className="featured-opportunities-header">
          <h2 id={headingId}>Featured opportunities</h2>
          <div className="featured-opportunities-actions">
            <a className="back-link" href="#projects">See all opportunities <ArrowRight size={16} aria-hidden="true" /></a>
            {scrollable && <div className="featured-opportunities-arrows">
              <Button variant="outline" aria-controls={listId} aria-label="Previous featured opportunity" disabled={!edges.previous}
                onClick={() => step(-1)}><ChevronLeft size={18} aria-hidden="true" /></Button>
              <Button variant="outline" aria-controls={listId} aria-label="Next featured opportunity" disabled={!edges.next}
                onClick={() => step(1)}><ChevronRight size={18} aria-hidden="true" /></Button>
            </div>}
          </div>
        </div>
        <ul ref={strip} id={listId} className="featured-opportunities-strip" role="list" tabIndex={scrollable ? 0 : undefined}
          aria-label="Featured opportunity cards">
          {featured.map((project) => <li key={project.id}><ProjectCard project={project} heading="h3" compact /></li>)}
        </ul>
      </div>
    </section>
  );
}

export function ProjectCards({ projects, heading, links = true, cardActions }) {
  return (
    <div className="project-cards">
      {projects.map((project) => <ProjectCard key={project.id} project={project} heading={heading} links={links}
        actions={cardActions?.(project)} />)}
    </div>
  );
}
