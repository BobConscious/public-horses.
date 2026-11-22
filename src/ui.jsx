import { useEffect, useState } from 'react';
import { BookOpen, Clock3, Flower2, HandHeart, HeartPulse, Search, Sprout, Sunset, Users, Wheat } from 'lucide-react';
import { fields, supportKinds } from '../shared/catalog.js';
import { api } from './http.js';

const fieldIcons = {
  nourishment: Wheat,
  health: HeartPulse,
  relationships: Users,
  livelihood: Sprout,
  happiness: Sunset,
  partnership: HandHeart,
};

const artPaths = {
  pantry: '/art/pantry.webp',
  tools: '/art/tools.webp',
  reading: '/art/reading.webp',
};

export function fieldName(id) {
  return fields.find((field) => field.id === id)?.label ?? id;
}

export function kindName(id) {
  return supportKinds.find((kind) => kind.id === id)?.label ?? id;
}

export function FieldIcon({ id, size = 17 }) {
  const Icon = fieldIcons[id] ?? (id === 'all' ? Search : Flower2);
  return <Icon size={size} aria-hidden="true" />;
}

export function ProjectArt({ project, className = '' }) {
  const [failed, setFailed] = useState(false);
  const source = artPaths[project.art];
  return (
    <div className={`project-art ${className}`} data-field={project.field}>
      {source && !failed
        ? <img src={source} alt="" onError={() => setFailed(true)} />
        : <FieldIcon id={project.field} size={56} />}
    </div>
  );
}

export function useLoad(path) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let active = true;
    if (path) {
      api(path).then(
        (data) => { if (active) setState({ data, error: null }); },
        (error) => { if (active) setState({ data: null, error }); },
      );
    }
    return () => { active = false; };
  }, [path, revision]);
  return {
    ...state,
    reload() {
      setState({ data: null, error: null });
      setRevision((value) => value + 1);
    },
  };
}

export function ErrorNotice({ error }) {
  if (!error) return null;
  return <p className="notice notice-error" role="alert">{error.message ?? error}</p>;
}

export function LoadState({ state }) {
  if (!state.error) return <p className="loading" role="status">Loading…</p>;
  return (
    <div className="empty-state">
      <ErrorNotice error={state.error} />
      <button className="button button-outline" type="button" onClick={state.reload}>Try again</button>
    </div>
  );
}

export function dateLabel(date) {
  const timestamp = Date.parse(`${date}T12:00:00Z`);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(timestamp)
    : date;
}

export function Deadline({ date }) {
  if (!date) return null;
  return <span className="detail-meta"><Clock3 size={15} aria-hidden="true" /> By {dateLabel(date)}</span>;
}

export function officialUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.hostname.endsWith('.invalid')) return url.href;
  } catch {
    return null;
  }
  return null;
}

export function EmptyProjects({ filtered, onReset }) {
  return (
    <div className="empty-state">
      <BookOpen size={27} strokeWidth={1.6} aria-hidden="true" />
      <h3>{filtered ? 'No matching projects' : 'No open projects yet'}</h3>
      <p>{filtered ? 'Try a different field or search term.' : 'Projects appear here after review.'}</p>
      {filtered && <button className="button button-outline" type="button" onClick={onReset}>Clear filters</button>}
    </div>
  );
}
