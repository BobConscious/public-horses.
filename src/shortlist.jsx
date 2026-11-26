import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './components/controls.jsx';
import { OpportunityHelpLink, ProjectCard } from './components/listings.jsx';
import { LoadState } from './ui.jsx';
import './shortlist.css';

const storageKey = 'ph-opportunity-choices';
const legacyStorageKey = 'ph-shortlist';

function readStored(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function readChoices() {
  const choices = readStored(storageKey);
  const records = Array.isArray(choices?.entries) ? choices.entries : readStored(legacyStorageKey);
  const entries = new Map();
  for (const item of Array.isArray(records) ? records : []) {
    if (typeof item?.id === 'string' && typeof item.title === 'string') {
      entries.set(item.id, { id: item.id, title: item.title });
    }
  }
  const passed = Array.isArray(choices?.passed)
    ? [...new Set(choices.passed.filter((id) => typeof id === 'string' && !entries.has(id)))]
    : [];
  return { entries: [...entries.values()], passed };
}

export function useOpportunityChoices() {
  const [choices, setChoices] = useState(readChoices);
  const [stored, setStored] = useState(true);

  useEffect(() => {
    if (!stored) return;
    function sync(event) {
      if (event.key === storageKey || event.key === legacyStorageKey || event.key === null) setChoices(readChoices());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [stored]);

  function update(change) {
    const next = change(stored ? readChoices() : choices);
    if (stored) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setStored(false);
      }
    }
    setChoices(next);
  }

  function save({ id, title }) {
    update(({ entries, passed }) => ({
      entries: entries.some((item) => item.id === id) ? entries : [{ id, title }, ...entries],
      passed: passed.filter((item) => item !== id),
    }));
  }

  function remove(id) {
    update((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== id) }));
  }

  function pass(id) {
    update(({ entries, passed }) => ({
      entries: entries.filter((item) => item.id !== id),
      passed: passed.includes(id) ? passed : [...passed, id],
    }));
  }

  function undoPass(id) {
    update((current) => ({ ...current, passed: current.passed.filter((item) => item !== id) }));
  }

  return { ...choices, stored, save, remove, pass, undoPass };
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
