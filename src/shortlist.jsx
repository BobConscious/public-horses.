import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './components/controls.jsx';
import { OpportunityHelpLink, ProjectCard } from './components/listings.jsx';
import { LoadState } from './ui.jsx';
import './shortlist.css';

const storageKey = 'ph-shortlist';

function readShortlist() {
  try {
    const records = JSON.parse(window.localStorage.getItem(storageKey));
    if (!Array.isArray(records)) return [];
    const entries = records.filter((entry) => typeof entry?.id === 'string' && typeof entry.title === 'string');
    return [...new Map(entries.map(({ id, title }) => [id, { id, title }])).values()];
  } catch {
    return [];
  }
}

export function useShortlist() {
  const [entries, setEntries] = useState(readShortlist);
  const [stored, setStored] = useState(true);

  useEffect(() => {
    if (!stored) return;
    function sync(event) {
      if (event.key === storageKey || event.key === null) setEntries(readShortlist());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [stored]);

  function update(change) {
    const current = stored ? readShortlist() : entries;
    const next = change(current);
    if (stored && next !== current) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setStored(false);
      }
    }
    setEntries(next);
  }

  function save({ id, title }) {
    update((items) => items.some((item) => item.id === id) ? items : [{ id, title }, ...items]);
  }

  function remove(id) {
    update((items) => items.filter((item) => item.id !== id));
  }

  return { entries, stored, save, remove };
}

export function ShortlistDialog({ entries, stored, load, onRemove, onClose }) {
  const dialog = useRef(null);
  const title = useRef(null);
  const titleId = useId();
  const projects = new Map(load.data?.projects.map((project) => [project.id, project]));

  useEffect(() => {
    if (!dialog.current.open) dialog.current.showModal();
    title.current.focus();
  }, []);

  function remove(id) {
    onRemove(id);
    title.current.focus({ preventScroll: true });
  }

  return (
    <dialog ref={dialog} className="shortlist-dialog" aria-labelledby={titleId} onClose={onClose}>
      <header className="shortlist-header">
        <div>
          <h2 id={titleId} ref={title} tabIndex={-1}>Your shortlist</h2>
          <p>{stored ? 'Saved in this browser.' : 'Available until you leave this page.'}</p>
        </div>
        <Button variant="outline" onClick={() => dialog.current.close()}>Done</Button>
      </header>
      <div className="shortlist-items">
        {!entries.length ? <p>Tap Save on an opportunity or swipe right to add it here.</p>
          : !load.data ? <LoadState state={load} />
            : entries.map((entry) => {
              const project = projects.get(entry.id);
              const removeButton = <Button variant="plain" aria-label={`Remove ${project?.title ?? entry.title} from shortlist`}
                onClick={() => remove(entry.id)}>Remove</Button>;
              return project?.open ? (
                <ProjectCard key={entry.id} project={project} heading="h3" helpAction
                  actions={<><OpportunityHelpLink project={project} fromShortlist />{removeButton}</>} />
              ) : (
                <article key={entry.id} className="project-card">
                  <h3>{entry.title}</h3>
                  <p className="shortlist-unavailable">This opportunity has left the service board.</p>
                  <div className="project-card-actions">{removeButton}</div>
                </article>
              );
            })}
      </div>
    </dialog>
  );
}
