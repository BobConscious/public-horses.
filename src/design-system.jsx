import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, CalendarDays, Leaf, MapPin, Search } from 'lucide-react';
import { listingTypes } from '../shared/catalog.js';
import { Button, Checkbox, Field, Notice, StatusChip } from './components/controls.jsx';
import { filterListings, initialListingFilters, ListingFilters, ProjectCards } from './components/listings.jsx';
import { EmptyProjects, LoadState, officialUrl } from './ui.jsx';
import tokenSheet from './tokens.css?raw';
import './design-system.css';

const sections = [
  ['identity', 'Identity'], ['foundations', 'Foundations'], ['controls', 'Controls'],
  ['listings', 'Listings'], ['states', 'States'],
];

const marks = [
  { file: 'lockup.svg', label: 'Full logo' },
  { file: 'lockup-reverse.svg', label: 'Full logo on dark', dark: true },
  { file: 'mark.svg', label: 'Horse mark', mark: true },
  { file: 'mark-reverse.svg', label: 'Horse mark on dark', mark: true, dark: true },
];

const colors = [
  ['Forest', 'forest', 'Primary actions'], ['Cream', 'cream', 'Page background'], ['Paper', 'paper', 'Cards and forms'],
  ['Ink', 'ink', 'Main text'], ['Muted', 'muted', 'Supporting text'], ['Sage', 'sage', 'Selected controls'],
  ['Clay', 'accent', 'Focus ring'], ['Control border', 'control-border', 'Form boundaries'],
];
const colorValues = Object.fromEntries(
  [...tokenSheet.matchAll(/--([a-z-]+):\s*(#[a-f0-9]{6});/giu)].map(([, name, value]) => [name, value]),
);
const iconExamples = [
  [Search, 'Search'], [CalendarDays, 'Schedule'], [MapPin, 'Location'], [ArrowUpRight, 'External link'], [Leaf, 'Garden'],
];
const statuses = ['draft', 'submitted', 'changes_requested', 'published', 'closed'];

const listingExamples = [
  {
    id: 'sample-pantry', slug: 'sample-pantry', title: 'Pack Saturday grocery bags',
    listingType: 'volunteer', field: 'nourishment', location: 'York, Pennsylvania',
    schedule: 'Saturdays from 9 to 11 a.m.', summary: 'Help pack fresh produce and dry goods for the weekend pantry.',
    profile: { slug: 'sample-cedar-pantry', name: 'Cedar Street Pantry' },
    needs: [{ type: 'time', detail: 'Pack grocery bags with the Saturday team.' }],
  },
  {
    id: 'sample-seeds', slug: 'sample-seeds', title: 'Bring seeds to the neighborhood swap',
    listingType: 'event', field: 'happiness', location: 'Lancaster, Pennsylvania',
    schedule: 'First Saturday of the month', summary: 'Share labeled seed packets and meet other neighborhood gardeners.',
    profile: { slug: 'sample-may-lee', name: 'May Lee' },
    image: { url: '/art/about-garden-pond-840.webp', alt: 'Illustration of a garden path beside a lily pond' },
    needs: [{ type: 'supplies', detail: 'Bring labeled seed packets.' }, { type: 'skills', detail: 'Share a growing tip.' }],
  },
];

function LibrarySection({ id, title, children }) {
  return <section id={id} className="library-section" aria-labelledby={id + '-heading'}>
    <h2 id={id + '-heading'}>{title}</h2>
    {children}
  </section>;
}

function Identity() {
  return <LibrarySection id="identity" title="Logo and voice">
    <p>Use the full logo when introducing Public Horses. Use the horse mark where the name is already visible.</p>
    <div className="library-logos">
      {marks.map(({ file, label, mark, dark }) => <figure key={file}>
        <div className="library-logo-preview" data-dark={dark} data-mark={mark}>
          <img src={'/brand/' + file} alt={label} loading="lazy" />
        </div>
        <figcaption><a href={'/brand/' + file} download>
          {label} <ArrowDownToLine size={15} aria-hidden="true" />
        </a></figcaption>
      </figure>)}
    </div>
    <p className="library-guidance">Lead with a task someone can do. For example, “Pack grocery bags Saturday morning.”</p>
  </LibrarySection>;
}

function Foundations() {
  return <LibrarySection id="foundations" title="Color and type">
    <p>Use cream and paper for surfaces, deep green for primary actions, and clay for keyboard focus.</p>
    <dl className="library-swatches">
      {colors.map(([label, token, use]) => <div key={token}>
        <dt>
          <span className="library-swatch" style={{ backgroundColor: `var(--${token})` }} aria-hidden="true" />
          <span className="library-swatch-label">{label} <code>{colorValues[token]}</code></span>
        </dt>
        <dd>{use}</dd>
      </div>)}
    </dl>
    <div className="library-type">
      <div><p className="library-display">Help a community project</p><p>Georgia for headings</p></div>
      <div><p className="library-body-example">Give time, skills, supplies, or money directly to the organizer.</p>
        <p>System sans serif for body text and controls</p></div>
    </div>
    <div className="library-icons" role="group" aria-label="Common icons">
      {iconExamples.map(([Icon, label]) => <span key={label}><Icon size={21} aria-hidden="true" />{label}</span>)}
    </div>
    <Button href={'data:text/css;charset=utf-8,' + encodeURIComponent(tokenSheet)} download="public-horses-tokens.css" variant="outline">
      <ArrowDownToLine size={17} aria-hidden="true" /> Download CSS tokens
    </Button>
  </LibrarySection>;
}

function Controls() {
  const [organizerLink, setOrganizerLink] = useState('example.org/volunteer');
  const [repeats, setRepeats] = useState(false);
  const [saved, setSaved] = useState(false);

  return <LibrarySection id="controls" title="Buttons and fields">
    <div className="library-halves">
      <div className="library-panel">
        <h3>Buttons and links</h3>
        <p>Use a primary button for the main action. Use links to move between pages.</p>
        <div className="library-actions">
          <Button href="/#projects">Browse projects</Button>
          <Button href="/about" variant="outline">About Public Horses</Button>
          <Button href="/garden" variant="plain">My garden</Button>
          <Button disabled>Saving…</Button>
        </div>
        <Field label="Organizer link" type="url" value={organizerLink}
          onChange={(event) => setOrganizerLink(event.target.value)} hint="Use the organizer’s official page."
          error={officialUrl(organizerLink) ? undefined : 'Enter a full link that starts with https://.'} />
      </div>
      <div className="library-panel">
        <h3>Example listing form</h3>
        <p>Try the fields. This example stays on this page.</p>
        <form className="stack-form" onChange={() => setSaved(false)} onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}>
          <Field label="Project title" name="title" required maxLength={96} placeholder="Pack Saturday grocery bags" />
          <Field label="Listing type" as="select" name="type" defaultValue="event">
            {listingTypes.map(({ id, label }) => <option value={id} key={id}>{label}</option>)}
          </Field>
          <Checkbox label="Add a recurring schedule" checked={repeats} onChange={(event) => setRepeats(event.target.checked)} />
          {repeats && <Field label="Schedule" name="schedule" placeholder="First Saturday of the month" required />}
          <Field label="Short summary" name="summary" as="textarea" optional rows={2} maxLength={200} />
          <div className="library-actions"><Button type="submit">Try save</Button></div>
          {saved && <Notice>Example saved on this page.</Notice>}
        </form>
      </div>
    </div>
  </LibrarySection>;
}

function Listings() {
  const [filters, setFilters] = useState(initialListingFilters);
  const matches = filterListings(listingExamples, filters);
  return <LibrarySection id="listings" title="Project directory">
    <p>Use these fictional listings to try the filters. A card identifies the ask, organizer, place, and ways to help.</p>
    <div className="library-listings catalog-layout">
      <ListingFilters filters={filters} onChange={setFilters} />
      <div>
        <p className="result-count" role="status">{matches.length} {matches.length === 1 ? 'listing' : 'listings'}</p>
        {matches.length > 0
          ? <ProjectCards projects={matches} heading="h3" links={false} />
          : <EmptyProjects filtered onReset={() => setFilters(initialListingFilters)} />}
      </div>
    </div>
  </LibrarySection>;
}

function States() {
  const [state, setState] = useState('loading');
  return <LibrarySection id="states" title="Status and feedback">
    <div className="library-actions" role="group" aria-label="Listing statuses">{statuses.map((status) => <StatusChip key={status} status={status} />)}</div>
    <div className="library-halves">
      <div className="library-panel">
        <h3>Inline notices</h3>
        <Notice>Draft saved.</Notice>
        <Notice tone="error">The image could not load. Choose it again.</Notice>
      </div>
      <div className="library-panel">
        <h3>Directory results</h3>
        <div className="library-actions" role="group" aria-label="Choose a result state">
          {[['loading', 'Loading'], ['empty', 'Empty'], ['error', 'Error']].map(([id, label]) =>
            <Button key={id} variant={state === id ? 'primary' : 'outline'} aria-pressed={state === id}
              onClick={() => setState(id)}>{label}</Button>)}
        </div>
        {state === 'empty' ? <EmptyProjects filtered={false} />
          : <LoadState state={{ error: state === 'error' ? 'Projects could not load.' : null, reload: () => setState('loading') }} />}
      </div>
    </div>
  </LibrarySection>;
}

export default function DesignSystem() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Brand and UI library | Public Horses';
    return () => { document.title = previousTitle; };
  }, []);

  return <div className="library-page container">
    <section className="library-cover" aria-labelledby="library-heading">
      <div>
        <h1 id="library-heading">Brand and UI library</h1>
        <p>Botanical art sets the tone. Clear labels and practical actions help people find where they can help.</p>
        <nav className="library-links" aria-label="Library sections">
          {sections.map(([id, label]) => <a href={'#' + id} key={id}>{label}</a>)}
        </nav>
      </div>
      <figure className="library-plates">
        <div>
          <img src="/brand/botanical-wake-robin.webp" alt="Botanical plate of a white wake robin flower and green leaves" width="620" height="900" />
          <img src="/brand/botanical-swamp-magnolia.webp" alt="Botanical plate of a white swamp magnolia flower and green leaves" width="625" height="900" />
        </div>
        <figcaption>Mary Vaux Walcott, 1918. <a href="https://www.si.edu/object/wake-robin-trillium-grandiflorum%3Asaam_1970.355.17">Wake Robin</a> · <a href="https://www.si.edu/object/swamp-magnolia-magnolia-virginiana%3Asaam_1970.355.18">Swamp Magnolia</a></figcaption>
      </figure>
    </section>
    <Identity />
    <Foundations />
    <Controls />
    <Listings />
    <States />
  </div>;
}
