import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, Sprout, X } from 'lucide-react';
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

const saveDistance = 62;

export function SwipeOpportunities({ projects, savedIds, onSave, onRemove, onBrowseAll }) {
  const list = useRef(null);
  const listId = useId();
  const gesture = useRef(null);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const activeProject = projects[active];
  const confirmed = !drag && lastSaved === activeProject.id && savedIds.has(activeProject.id);

  function updateActive({ currentTarget }) {
    const middle = currentTarget.scrollTop + currentTarget.clientHeight / 2;
    setActive(Array.from(currentTarget.children).findLastIndex((card) => card.offsetTop <= middle));
  }

  function move(index) {
    const track = list.current;
    const card = track.children[index];
    if (card) track.scrollTop = card.offsetTop;
  }

  function save(project) {
    onSave(project);
    setLastSaved(project.id);
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
    const right = event.clientX - start.x;
    const vertical = Math.abs(event.clientY - start.y);
    if (right < 12 || right < vertical * 1.4) {
      setDrag(0);
      return;
    }
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(right);
  }

  function finishSwipe(event) {
    const start = gesture.current;
    if (start?.id !== event.pointerId || event.type === 'lostpointercapture' && event.target !== event.currentTarget) return;
    gesture.current = null;
    setDrag(0);
    const right = event.clientX - start.x;
    const vertical = Math.abs(event.clientY - start.y);
    if (event.type === 'pointerup' && start.projectId === activeProject.id && right >= saveDistance && right >= vertical * 1.4) {
      save(activeProject);
    }
  }

  return (
    <div className="swipe-deck">
      <div className="swipe-navigation">
        <Button variant="outline" aria-label="Previous opportunity" aria-controls={listId}
          aria-disabled={active === 0} onClick={() => move(active - 1)}>
          <ChevronUp size={17} aria-hidden="true" /> Previous
        </Button>
        <p className="swipe-position" role="status" aria-atomic="true">
          {active + 1} of {projects.length}<span className="sr-only">, {projects[active].title}</span>
        </p>
        <Button variant="outline" aria-label="Next opportunity" aria-controls={listId}
          aria-disabled={active === projects.length - 1} onClick={() => move(active + 1)}>
          Next <ChevronDown size={17} aria-hidden="true" />
        </Button>
      </div>
      <div className="swipe-cue">
        {!confirmed && <p className="swipe-hint" data-ready={drag >= saveDistance}>
          {drag >= saveDistance ? 'Release to save.'
            : projects.length > 1 ? 'Swipe right to save. Swipe up to browse.' : 'Swipe right to save.'}
        </p>}
        <p className={confirmed ? 'swipe-feedback' : 'sr-only'} role="status">
          {confirmed && <><BookmarkCheck size={16} aria-hidden="true" /> Saved to shortlist</>}
        </p>
      </div>
      <ol id={listId} ref={list} className="swipe-track" role="list" tabIndex={0}
        aria-label="Opportunity cards" onScroll={updateActive} onPointerDown={startSwipe} onPointerMove={dragSwipe}
        onPointerUp={finishSwipe} onPointerCancel={finishSwipe} onLostPointerCapture={finishSwipe}>
        {projects.map((project, index) => {
          const saved = savedIds.has(project.id);
          const dragging = index === active && drag > 0;
          return (
            <li key={project.id} inert={active !== index} className={dragging ? 'swipe-dragging' : undefined}
              style={dragging ? { '--swipe-offset': `${Math.min(drag / 3, 44)}px` } : undefined}>
              <ProjectCard project={project} helpAction actions={<>
                <OpportunityHelpLink project={project} />
                <ShortlistToggle project={project} saved={saved} onToggle={() => saved ? onRemove(project.id) : save(project)} />
              </>} />
            </li>
          );
        })}
      </ol>
      {onBrowseAll && <Button variant="plain" className="swipe-browse-all" onClick={onBrowseAll}>
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
