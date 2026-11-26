import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Droplet, Leaf, LockKeyhole, Plus, Sprout } from 'lucide-react';
import { fields } from '../shared/catalog.js';
import { useApi } from './http.js';
import { Button, Field } from './components/controls.jsx';
import { ErrorNotice, kindName } from './ui.jsx';
import GardenWorld from './garden-world.jsx';
import { gardenPlots } from './garden-world-layout.js';
import './garden.css';

const stages = ['Seed', 'Sprout', 'First leaves', 'In bloom'];
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function fieldLabel(id) {
  return fields.find((field) => field.id === id)?.label ?? 'Care';
}

function dayKey(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function stageOf(seed) {
  return Math.min(3, Math.max(0, seed.waters ?? 0));
}

function Plant({ seed }) {
  return (
    <span className="garden-plant" data-stage={stageOf(seed)} data-intention={seed.intention} aria-hidden="true">
      <span className="garden-plant__bean" />
      <span className="garden-plant__stem" />
      <span className="garden-plant__leaf garden-plant__leaf--one" />
      <span className="garden-plant__leaf garden-plant__leaf--two" />
      <span className="garden-plant__leaf garden-plant__leaf--three" />
      <span className="garden-plant__bloom" />
    </span>
  );
}

function GardenNotice({ icon: Icon, title, children }) {
  return (
    <section className="garden-notice" aria-label={title}>
      <Icon size={32} strokeWidth={1.35} aria-hidden="true" />
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Plot({ number, seed, selectedSeed, inspected, busy, onInspect, onPlant }) {
  const numberLabel = `Plot ${number}`;
  if (!seed) {
    return (
      <button
        className="garden-plot garden-plot--empty"
        type="button"
        disabled={!selectedSeed || busy}
        aria-label={selectedSeed ? `${numberLabel}, plant seed from ${selectedSeed.projectTitle}` : `${numberLabel}, empty`}
        onClick={() => onPlant(number)}
      >
        <span className="garden-plot__number">{numberLabel}</span>
        <span className="garden-plot__soil"><Plus size={19} strokeWidth={1.5} aria-hidden="true" /></span>
        <span className="garden-plot__stage">{selectedSeed ? 'Plant here' : 'Empty'}</span>
      </button>
    );
  }

  return (
    <button
      className="garden-plot garden-plot--planted"
      type="button"
      aria-label={`${numberLabel}, ${stages[stageOf(seed)]} from ${seed.projectTitle}`}
      aria-pressed={inspected}
      disabled={busy}
      onClick={() => onInspect(seed.id)}
    >
      <span className="garden-plot__number">{numberLabel}</span>
      <span className="garden-plot__soil"><Plant seed={seed} /></span>
      <span className="garden-plot__stage">{stages[stageOf(seed)]}</span>
    </button>
  );
}

function WateringPractice({ seed, busy, onClose, onWater, onWatered }) {
  const [rejoice, setRejoice] = useState(false);
  const dialog = useRef(null);
  const heading = useRef(null);
  const saving = useRef(false);

  useEffect(() => {
    const panel = dialog.current;
    panel.showModal();
    return () => panel.close();
  }, []);

  useEffect(() => { heading.current?.focus(); }, [rejoice]);

  function cancel(event) {
    event.preventDefault();
    if (busy) return;
    dialog.current.close();
    onClose();
  }

  async function water() {
    if (saving.current) return;
    saving.current = true;
    const result = await onWater();
    if (!dialog.current) return;
    dialog.current.close();
    onClose();
    if (result?.waters > seed.waters) onWatered(result.plot);
  }

  return (
    <dialog ref={dialog} className="garden-watering" aria-labelledby="garden-watering-title" onCancel={cancel}>
      <p className="garden-watering__step"><Droplet size={16} aria-hidden="true" /> Watering · {rejoice ? '2 of 2' : '1 of 2'}</p>
      <h2 id="garden-watering-title" ref={heading} tabIndex={-1}>{rejoice ? 'Rejoice in the good you did' : 'Remember emptiness'}</h2>
      <div className="garden-watering__act">
        <strong>{seed.projectTitle}</strong>
        {seed.note && <p>{seed.note}</p>}
      </div>
      {rejoice ? (
        <>
          <p>Remember who was there and what you gave. Feel grateful and rejoice in the good you and others did.</p>
          <p>This is the act you’re watering.</p>
        </>
      ) : (
        <>
          <p>In this practice, emptiness means things have no fixed nature of their own. They arise through causes and conditions.</p>
          <p>Recall the causes and conditions that made this act possible. What seed did you plant for the world you want to be part of?</p>
        </>
      )}
      <div className="form-actions garden-watering__actions">
        {rejoice ? <Button onClick={water} disabled={busy}>{busy ? 'Watering…' : 'Water this seed'}</Button>
          : <Button onClick={() => setRejoice(true)}>Continue to rejoicing</Button>}
        {rejoice && <Button variant="outline" onClick={() => setRejoice(false)} disabled={busy}>Back</Button>}
        <Button variant="plain" onClick={cancel} disabled={busy}>Cancel</Button>
      </div>
    </dialog>
  );
}

function PlantDetails({ seed, busy, headingRef, onWater, onWatered, onHarvest }) {
  const [practicing, setPracticing] = useState(false);
  const [today, setToday] = useState(() => dayKey(Date.now()));
  useEffect(() => {
    const interval = setInterval(() => setToday(dayKey(Date.now())), 60_000);
    return () => clearInterval(interval);
  }, []);
  const stage = stageOf(seed);
  const wateredToday = dayKey(seed.wateredAt) === today;

  return (
    <section className="garden-panel garden-plant-details" aria-labelledby="garden-plant-title">
      <div className="garden-panel__heading">
        <span className="garden-panel__icon"><Leaf size={18} aria-hidden="true" /></span>
        <h2 id="garden-plant-title" tabIndex={-1} ref={headingRef}>Plot {seed.plot}</h2>
      </div>
      <p className="garden-plant-details__project">{seed.projectTitle}</p>
      <span className="garden-intention">{fieldLabel(seed.intention)}</span>
      {seed.note && <p className="garden-reflection">{seed.note}</p>}
      <div className="garden-growth">
        <div><strong>{stages[stage]}</strong><span>{stage} of 3 waterings</span></div>
        <progress value={stage} max={3} aria-label="Waterings toward bloom" />
      </div>
      {stage === 3 ? (
        <button className="garden-button garden-button--solid" type="button" onClick={onHarvest} disabled={busy}>
          <Leaf size={17} aria-hidden="true" /> Harvest
        </button>
      ) : (
        <>
          <button
            className="garden-button garden-button--solid"
            type="button"
            onClick={() => { if (!busy && !wateredToday) setPracticing(true); }}
            aria-disabled={busy || wateredToday}
          >
            <Droplet size={17} aria-hidden="true" /> {wateredToday ? 'Watered today' : 'Water this seed'}
          </button>
          {wateredToday && <p className="garden-help">Water again after midnight UTC.</p>}
        </>
      )}
      {practicing && <WateringPractice seed={seed} busy={busy} onClose={() => setPracticing(false)}
        onWater={onWater} onWatered={onWatered} />}
    </section>
  );
}

function SeedPouch({ seeds, selectedId, full, busy, headingRef, onPick }) {
  return (
    <section className="garden-panel garden-pouch" aria-labelledby="garden-pouch-title">
      <div className="garden-panel__heading">
        <span className="garden-panel__icon"><Sprout size={18} aria-hidden="true" /></span>
        <h2 id="garden-pouch-title" tabIndex={-1} ref={headingRef}>Seed pouch</h2>
        <span className="garden-panel__count">{seeds.length}</span>
      </div>
      {seeds.length > 0 ? (
        <>
          <p className="garden-help">
            {full ? 'Harvest a plant to make room for another seed.' : 'Choose a seed, then go to an empty plot.'}
          </p>
          <ul className="garden-pouch__list">
            {seeds.map((seed) => (
              <li key={seed.id}>
                <button
                  type="button"
                  className="garden-seed"
                  aria-pressed={selectedId === seed.id}
                  disabled={busy || full}
                  onClick={() => onPick(seed.id)}
                >
                  <span className="garden-seed__mark" aria-hidden="true"><Sprout size={17} strokeWidth={1.7} /></span>
                  <span className="garden-seed__label"><strong>{seed.projectTitle}</strong><small>{fieldLabel(seed.intention)}</small></span>
                  <ArrowRight size={16} className="garden-seed__arrow" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="garden-help">Record an act of service to add a seed.</p>}
    </section>
  );
}

function JournalEntry({ seed, onSave }) {
  const [draft, setDraft] = useState(seed.reflection ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const saving = useRef(false);
  const summary = useRef(null);

  async function save(reflection) {
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setError(null);
    setStatus('');
    try {
      const stored = await onSave(seed.id, reflection);
      setDraft(stored);
      setStatus(stored ? 'Observation saved.' : 'Observation cleared.');
      summary.current?.focus();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
      saving.current = false;
    }
  }

  return (
    <li>
      <h3>{seed.projectTitle}</h3>
      <time dateTime={seed.createdAt}>{dateFormat.format(new Date(seed.createdAt))}</time>
      <dl className="garden-journal__act">
        <div>
          <dt>What you wanted to cultivate</dt>
          <dd><span className="garden-intention">{fieldLabel(seed.intention)}</span></dd>
        </div>
        <div>
          <dt>What you did</dt>
          <dd>{kindName(seed.type)}{seed.note && <p className="garden-reflection">{seed.note}</p>}</dd>
        </div>
        {seed.reflection && <div>
          <dt>What you noticed later</dt>
          <dd className="garden-reflection">{seed.reflection}</dd>
        </div>}
      </dl>
      {seed.harvestedAt && <p className="garden-journal__harvest">
        Harvested <time dateTime={seed.harvestedAt}>{dateFormat.format(new Date(seed.harvestedAt))}</time>
      </p>}
      <details className="garden-observation">
        <summary ref={summary}>{seed.reflection ? 'Edit observation' : 'Add observation'}</summary>
        <form className="stack-form" onSubmit={(event) => { event.preventDefault(); save(draft); }}>
          <Field label="What did you notice later?" as="textarea" optional maxLength={500} rows={3}
            value={draft} onChange={(event) => setDraft(event.target.value)} disabled={pending} />
          <ErrorNotice error={error} />
          <div className="form-actions">
            <Button type="submit" disabled={pending || (!draft.trim() && !seed.reflection)}>{pending ? 'Saving…' : 'Save observation'}</Button>
            {seed.reflection && <Button variant="plain" disabled={pending} onClick={() => save('')}>Clear observation</Button>}
          </div>
        </form>
      </details>
      <p role="status" className="garden-feedback">{status}</p>
    </li>
  );
}

function ServiceJournal({ seeds, onSave }) {
  const journal = useRef(null);

  useEffect(() => {
    if (window.location.hash === '#service-journal') journal.current?.focus();
  }, []);

  return (
    <section ref={journal} id="service-journal" tabIndex={-1} className="garden-journal" aria-labelledby="garden-journal-title">
      <div className="garden-panel__heading">
        <span className="garden-panel__icon"><BookOpen size={18} aria-hidden="true" /></span>
        <h2 id="garden-journal-title">Service journal</h2>
      </div>
      <p className="garden-help">Return to an act of service and reflect on what you notice over time.</p>
      {seeds.length === 0 ? <p className="garden-help">Record an act of service to start your journal.</p> : <ul className="garden-journal__entries">
        {seeds.map((seed) => <JournalEntry key={seed.id} seed={seed} onSave={onSave} />)}
      </ul>}
    </section>
  );
}

function MemberGarden({ boardHref }) {
  const api = useApi();
  const [seeds, setSeeds] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSeedId, setSelectedSeedId] = useState(null);
  const [inspectedId, setInspectedId] = useState(null);
  const [status, setStatus] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [watering, setWatering] = useState(null);
  const updating = useRef(false);
  const openedFromWorld = useRef(false);
  const canvasRef = useRef(null);
  const plotsRef = useRef(null);
  const plantHeading = useRef(null);
  const pouchHeading = useRef(null);
  const nextFocus = useRef(null);

  useEffect(() => {
    let active = true;
    api('/garden').then(
      (result) => {
        if (active) setSeeds(result.seeds);
      },
      (error) => {
        if (active) setLoadError(error.message);
      },
    );
    return () => { active = false; };
  }, [api, refreshKey]);

  useEffect(() => {
    if (busy || !nextFocus.current) return;
    if (nextFocus.current === 'plot') {
      const list = plotsRef.current;
      if (list && (list.open || !canvasRef.current)) {
        list.open = true;
        list.querySelector('.garden-plot--empty:not(:disabled)')?.focus();
      } else {
        canvasRef.current?.focus();
      }
    } else if (nextFocus.current === 'plant') {
      plantHeading.current?.focus();
    } else {
      pouchHeading.current?.focus();
    }
    nextFocus.current = null;
  }, [busy, selectedSeedId, inspectedId]);

  if (loadError) {
    return (
      <GardenNotice icon={Sprout} title="Your garden could not load">
        <p role="alert">{loadError}</p>
        <button className="garden-button garden-button--solid" type="button" onClick={() => {
          setLoadError('');
          setRefreshKey((key) => key + 1);
        }}>Try again</button>
      </GardenNotice>
    );
  }

  if (!seeds) return <p className="garden-loading" role="status">Opening your garden…</p>;

  const unplanted = seeds.filter((seed) => !seed.plantedAt && !seed.harvestedAt);
  const planted = seeds.filter((seed) => seed.plantedAt && !seed.harvestedAt);
  const selectedSeed = unplanted.find((seed) => seed.id === selectedSeedId);
  const inspected = planted.find((seed) => seed.id === inspectedId);
  const seedsByPlot = new Map(planted.map((seed) => [Number(seed.plot), seed]));

  async function saveObservation(seedId, reflection) {
    const { seed } = await api(`/garden/${encodeURIComponent(seedId)}/reflection`, { method: 'PATCH', body: { reflection } });
    setSeeds((previous) => previous.map((current) => current.id === seed.id ? { ...current, reflection: seed.reflection } : current));
    return seed.reflection;
  }

  async function updateSeed(seedId, action, body, message) {
    if (updating.current) return null;
    updating.current = true;
    setBusy(true);
    setActionError('');
    setStatus('');
    try {
      const { seed } = await api(`/garden/${encodeURIComponent(seedId)}/${action}`, { method: 'POST', body });
      setSeeds((previous) => previous.map((current) => current.id === seed.id ? { ...seed, reflection: current.reflection } : current));
      setStatus(message);
      return seed;
    } catch (error) {
      setActionError(error.message);
      return null;
    } finally {
      updating.current = false;
      setBusy(false);
    }
  }

  async function plant(number, fromWorld = false) {
    if (!selectedSeed) return;
    const seed = await updateSeed(selectedSeed.id, 'plant', { plot: number }, `Seed planted in plot ${number}.`);
    if (seed) {
      openedFromWorld.current = fromWorld;
      nextFocus.current = 'plant';
      setSelectedSeedId(null);
      setInspectedId(seed.id);
    }
  }

  function pick(id) {
    const next = id === selectedSeedId ? null : id;
    if (next) nextFocus.current = 'plot';
    setSelectedSeedId(next);
    setInspectedId(null);
    setActionError('');
  }

  function inspect(id, fromWorld = false) {
    openedFromWorld.current = fromWorld;
    if (id === inspectedId) {
      plantHeading.current?.focus();
      return;
    }
    nextFocus.current = 'plant';
    setInspectedId(id);
    setSelectedSeedId(null);
    setActionError('');
  }

  async function harvest() {
    const seed = await updateSeed(inspected.id, 'harvest', {}, 'Harvest saved in your journal.');
    if (seed) {
      nextFocus.current = 'pouch';
      setInspectedId(null);
    }
  }

  function usePlot(number) {
    const seed = seedsByPlot.get(number);
    if (seed) inspect(seed.id, true);
    else if (selectedSeed) plant(number, true);
    else pouchHeading.current?.focus();
  }

  function showWatering(plot) {
    if (openedFromWorld.current && canvasRef.current) {
      canvasRef.current.focus({ preventScroll: true });
      canvasRef.current.scrollIntoView({ block: 'nearest' });
    }
    setWatering({ plot, startedAt: performance.now() });
  }

  function openJournal() {
    const journal = document.getElementById('service-journal');
    journal?.focus({ preventScroll: true });
    journal?.scrollIntoView({ block: 'start' });
  }

  return (
    <>
      <div className="garden-actions">
        <a className="garden-text-link" href="#service-journal">
          Open service journal <ArrowRight size={15} aria-hidden="true" />
        </a>
        <a className="garden-text-link" href={boardHref}>Find a way to serve <ArrowRight size={15} aria-hidden="true" /></a>
      </div>
      <div className="garden-layout">
        <section className="garden-beds" aria-labelledby="garden-beds-title">
          <header className="garden-beds__header">
            <h2 id="garden-beds-title">Garden beds</h2>
            <span>{planted.length} of {gardenPlots.length} planted</span>
          </header>
          <GardenWorld canvasRef={canvasRef} plants={seedsByPlot} selectedSeed={selectedSeed} watering={watering}
            onPlot={usePlot} onJournal={openJournal} busy={busy} />
          <div className="garden-beds__foot">
            {actionError && <p role="alert" className="garden-feedback garden-feedback--error">{actionError}</p>}
            <p role="status" className="garden-feedback">{status}</p>
            {!status && !actionError && selectedSeed && <p className="garden-help">Go to an empty plot to plant this seed.</p>}
          </div>
          <details className="garden-plot-list" ref={plotsRef}>
            <summary>Garden plot list</summary>
            <div className="garden-beds__plots">
              {gardenPlots.map(({ number }) => (
                <Plot
                  key={number}
                  number={number}
                  seed={seedsByPlot.get(number)}
                  selectedSeed={selectedSeed}
                  inspected={inspected?.plot === number}
                  busy={busy}
                  onInspect={inspect}
                  onPlant={plant}
                />
              ))}
            </div>
          </details>
        </section>
        <aside className="garden-sidebar" aria-label="Garden tools">
          {inspected && <PlantDetails
            seed={inspected}
            busy={busy}
            headingRef={plantHeading}
            onWater={() => updateSeed(inspected.id, 'water', {}, 'Seed watered.')}
            onWatered={showWatering}
            onHarvest={harvest}
          />}
          <SeedPouch
            seeds={unplanted}
            selectedId={selectedSeedId}
            full={planted.length === gardenPlots.length}
            busy={busy}
            headingRef={pouchHeading}
            onPick={pick}
          />
        </aside>
      </div>
      <ServiceJournal seeds={seeds} onSave={saveObservation} />
    </>
  );
}

export default function Garden({ user, boardHref = '/#projects' }) {
  return (
    <main className="garden-page" data-member={Boolean(user)} id="main" tabIndex={-1}>
      <header className="garden-header">
        <div>
          <h1>My garden</h1>
          <p>We become gardeners of our own minds. Each act of service plants a karmic seed for the world we want to be part of.</p>
        </div>
        <span className="garden-privacy"><LockKeyhole size={15} aria-hidden="true" /> Private</span>
      </header>
      {user ? <MemberGarden key={user.id} boardHref={boardHref} /> : (
        <GardenNotice icon={Sprout} title="Sign in to see your garden">
          <a className="garden-button garden-button--solid" href="/sign-in?next=%2Fgarden">Sign in <ArrowRight size={16} aria-hidden="true" /></a>
        </GardenNotice>
      )}
    </main>
  );
}
