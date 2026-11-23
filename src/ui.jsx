import { useEffect, useState } from 'react';
import { fields, listingTypes, profileKinds, supportKinds } from '../shared/catalog.js';
import { useApi } from './http.js';
import { Button, Notice } from './components/controls.jsx';

export function fieldName(id) {
  return fields.find((field) => field.id === id)?.label ?? id;
}

export function kindName(id) {
  return supportKinds.find((kind) => kind.id === id)?.label ?? id;
}

export function listingTypeName(id) {
  return listingTypes.find((type) => type.id === id)?.label ?? 'Project';
}

export function profileKindName(id) {
  return profileKinds.find((kind) => kind.id === id)?.label ?? 'Profile';
}

export function useLoad(path) {
  const api = useApi();
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
  }, [api, path, revision]);
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
  return <Notice tone="error">{error.message ?? error}</Notice>;
}

export function LoadState({ state }) {
  if (!state.error) return <p className="loading" role="status">Loading…</p>;
  return (
    <div className="empty-state">
      <ErrorNotice error={state.error} />
      <Button variant="outline" onClick={state.reload}>Try again</Button>
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
  return <span className="detail-meta">By <time dateTime={date}>{dateLabel(date)}</time></span>;
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
      <h2>{filtered ? 'No matching projects' : 'No open projects yet'}</h2>
      <p>{filtered ? 'Change a filter or search term.' : 'Projects appear here after review.'}</p>
      {filtered && <Button variant="outline" onClick={onReset}>Clear filters</Button>}
    </div>
  );
}
