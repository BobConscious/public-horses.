import { useEffect, useId, useRef, useState } from 'react';
import { Button, Field, Notice } from './controls.jsx';
import './place-picker.css';

let catalog;

function searchKey(text) {
  return text.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim();
}

function loadPlaces() {
  catalog ??= fetch('/maps/places.json')
    .then((response) => {
      if (!response.ok) throw new Error('The city catalog could not load.');
      return response.json();
    })
    .then((places) => places.map((place) => ({
      place,
      label: searchKey(place.label),
      city: searchKey(place.label.split(',')[0]),
    })))
    .catch((error) => {
      catalog = undefined;
      throw error;
    });
  return catalog;
}

export function PlacePicker({ value, onChange, disabled }) {
  const searchId = useId();
  const toggleRef = useRef(null);
  const searchRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [places, setPlaces] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const key = searchKey(query);
  const terms = key.split(' ');
  const rank = ({ city }) => city === key ? 0 : city.startsWith(key) ? 1 : 2;
  const matches = places && key.length >= 2
    ? places.filter(({ label }) => terms.every((term) => label.includes(term)))
      .sort((a, b) => rank(a) - rank(b)).slice(0, 8)
    : [];

  useEffect(() => {
    if (!expanded || places || loadFailed) return;
    let active = true;
    loadPlaces().then(
      (loaded) => { if (active) setPlaces(loaded); },
      () => { if (active) setLoadFailed(true); },
    );
    return () => { active = false; };
  }, [expanded, loadFailed, places]);

  useEffect(() => {
    if (expanded) searchRef.current?.focus();
  }, [expanded]);

  function closeSearch() {
    setExpanded(false);
    setQuery('');
    toggleRef.current?.focus();
  }

  function select(place) {
    onChange(place);
    closeSearch();
  }

  function searchKeyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches.length === 1) select(matches[0].place);
    }
  }

  return (
    <fieldset className="place-picker" disabled={disabled}>
      <legend>City on the map <span className="optional">Optional</span></legend>
      <p className="field-hint">Choose the nearest city for in-person help. Leave this blank for online or unconfirmed locations.</p>
      {value && <p role="status"><strong>{value.label}</strong></p>}
      <div className="form-actions">
        <Button variant="outline" ref={toggleRef} aria-expanded={expanded} aria-controls={expanded ? searchId : undefined}
          onClick={() => { if (expanded) closeSearch(); else setExpanded(true); }}>
          {expanded ? 'Close city search' : value ? 'Change city' : 'Choose a city'}
        </Button>
        {value && <Button variant="plain" onClick={() => select(null)}>Remove city</Button>}
      </div>
      {expanded && (
        <div id={searchId} className="place-picker-search">
          <Field label="Search cities" ref={searchRef} type="search" value={query} autoComplete="off" maxLength={96}
            onChange={(event) => setQuery(event.target.value)} onKeyDown={searchKeyDown}
            hint="You can add a region or country to narrow the results." />
          {loadFailed ? (
            <>
              <Notice tone="error">Cities could not load. Try again or save without a city.</Notice>
              <Button variant="outline" onClick={() => { setLoadFailed(false); searchRef.current?.focus(); }}>Retry city search</Button>
            </>
          ) : !places ? <p className="field-hint" role="status">Loading cities…</p> : key.length >= 2 && (
            <>
              <p className="field-hint" role="status">
                {matches.length ? `${matches.length} ${matches.length === 1 ? 'city' : 'cities'} shown.` : 'No cities found. Try a nearby city.'}
              </p>
              {matches.length > 0 && <ul className="place-picker-results" aria-label="Matching cities">
                {matches.map(({ place }) => <li key={place.id}>
                  <Button variant="outline" onClick={() => select(place)}>{place.label}</Button>
                </li>)}
              </ul>}
            </>
          )}
        </div>
      )}
    </fieldset>
  );
}
