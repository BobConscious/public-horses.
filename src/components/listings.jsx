import { useId, useRef } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { fields, listingTypes, supportKinds } from '../../shared/catalog.js';
import { dateLabel, fieldName, kindName, listingTypeName } from '../ui.jsx';
import './listings.css';

const fieldOptions = [{ id: 'all', label: 'All fields' }, ...fields];
export const initialListingFilters = Object.freeze({ query: '', type: 'all', field: 'all', help: 'all' });

export function filterListings(projects, { query, type, field, help = 'all' }) {
  const terms = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  return projects.filter((project) => {
    if (field !== 'all' && project.field !== field) return false;
    if (type !== 'all' && (project.listingType ?? 'project') !== type) return false;
    if (help !== 'all' && !project.needs.some((need) => need.type === help)) return false;
    if (!terms.length) return true;
    const words = [
      project.title, project.profile?.name ?? project.organization, project.location,
      project.summary, fieldName(project.field), listingTypeName(project.listingType), project.schedule, project.mapLocation?.label,
      ...project.needs.map(({ type: kind, detail }) => `${kindName(kind)} ${detail}`),
    ].join(' ').toLowerCase();
    return terms.every((term) => words.includes(term));
  });
}

export function ListingFilters({ filters, onChange, children }) {
  const searchId = useId();
  const searchInput = useRef(null);

  function clearSearch() {
    searchInput.current?.focus();
    onChange({ ...filters, query: '' });
  }

  return (
    <div className="catalog-controls">
      <label className="search-label" htmlFor={searchId}>Search projects</label>
      <div className="search-box">
        <Search size={17} strokeWidth={1.8} aria-hidden="true" />
        <input ref={searchInput} id={searchId} type="search" value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Try pantry or a city" />
        {filters.query && <button type="button" aria-label="Clear search" onClick={clearSearch}><X size={16} aria-hidden="true" /></button>}
      </div>
      <label className="catalog-select-label">
        Listing type
        <select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value })}>
          <option value="all">All listings</option>
          {listingTypes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="catalog-select-label">
        Ways to help
        <select value={filters.help ?? 'all'} onChange={(event) => onChange({ ...filters, help: event.target.value })}>
          <option value="all">All ways to help</option>
          {supportKinds.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
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
  );
}

export function ProjectOrganizer({ project, links = true }) {
  if (!links || !project.profile) return <strong>{project.profile?.name ?? project.organization}</strong>;
  return <a className="profile-link" href={`/profiles/${encodeURIComponent(project.profile.slug)}`}>{project.profile.name}</a>;
}

export function ProjectCard({ project, heading: Heading = 'h2', links = true }) {
  return (
    <article className="project-card">
      <p className="project-card-type"><strong>{listingTypeName(project.listingType)}</strong><span>{fieldName(project.field)}</span></p>
      <Heading>
        {links ? <a className="project-card-link" href={`/projects/${encodeURIComponent(project.slug)}`}>
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
        {project.schedule && <div><dt>When</dt><dd>{project.schedule}</dd></div>}
        <div><dt>Ways to help</dt><dd>{project.needs.map(({ type }) => kindName(type)).join(', ')}</dd></div>
        {project.endsAt && !project.demo && <div><dt>Listing closes</dt><dd><time dateTime={project.endsAt}>{dateLabel(project.endsAt)}</time></dd></div>}
      </dl>
    </article>
  );
}

export function ProjectCards({ projects, heading, links = true }) {
  return (
    <div className="project-cards">
      {projects.map((project) => <ProjectCard key={project.id} project={project} heading={heading} links={links} />)}
    </div>
  );
}
