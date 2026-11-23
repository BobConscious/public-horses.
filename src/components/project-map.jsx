import { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from './controls.jsx';
import 'leaflet/dist/leaflet.css';
import './project-map.css';

const landStyle = { color: '#9a9d88', weight: 0.8, fillColor: '#e1e4cd', fillOpacity: 1 };
const boundaryStyle = { color: '#a8ad98', weight: 0.7, fill: false };
const worldBounds = [[-85, -180], [85, 180]];

function fitPlaces(map, places) {
  map.fitBounds(places.map(({ lat, lng }) => [lat, lng]), { padding: [46, 46], maxZoom: 7, animate: false });
}

function groupPlaces(projects) {
  const groups = new Map();

  for (const project of projects) {
    const place = project.mapLocation;
    if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;

    if (!groups.has(place.id)) groups.set(place.id, { ...place, projects: [] });
    groups.get(place.id).projects.push(project);
  }

  return [...groups.values()].sort((first, second) => first.label.localeCompare(second.label));
}

function projectHref(project) {
  return `/projects/${encodeURIComponent(project.slug)}`;
}

function popupContent(place) {
  const popup = document.createElement('div');
  popup.className = 'project-map__popup';
  const title = document.createElement('strong');
  title.textContent = place.label;
  popup.append(title);

  const list = document.createElement('ul');
  for (const project of place.projects) {
    const link = document.createElement('a');
    link.href = projectHref(project);
    link.textContent = project.title;
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  popup.append(list);
  return popup;
}

function openMarker(map, marker) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  marker.getPopup().options.autoPan = !reducedMotion;
  if (reducedMotion) map.panTo(marker.getLatLng(), { animate: false });
  marker.openPopup();
}

function createMarker(map, place, { showCityLabel, onSelect }) {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'project-map__pin-button';
  const count = place.projects.length;
  pin.setAttribute('aria-label', `${place.label}, ${count} ${count === 1 ? 'listing' : 'listings'}`);
  pin.textContent = String(count);
  L.DomEvent.disableClickPropagation(pin);

  const marker = L.marker([place.lat, place.lng], {
    keyboard: false,
    icon: L.divIcon({ html: pin, className: 'project-map__pin', iconSize: [44, 44], iconAnchor: [22, 22] }),
  });
  marker.bindPopup(() => popupContent(place), { maxWidth: 250, maxHeight: 174 });
  pin.addEventListener('click', (event) => {
    onSelect(place.id);
    openMarker(map, marker);
    if (event.detail === 0) marker.getPopup().getElement()?.querySelector('a')?.focus({ preventScroll: true });
  });

  if (showCityLabel) {
    const label = document.createElement('span');
    label.textContent = place.label.split(',')[0];
    marker.bindTooltip(label, { permanent: true, direction: 'bottom', offset: [0, 24], className: 'project-map__city-label' });
  }

  return marker;
}

async function loadOutlines(map, path, options, signal) {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error('Map outlines could not load.');
  const outlines = await response.json();

  if (!signal.aborted) L.geoJSON(outlines, { ...options, interactive: false }).addTo(map);
}

function PlaceMap({ places }) {
  const headingId = useId();
  const areaId = useId();
  const canvas = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const [selectedId, setSelectedId] = useState(null);
  const [outlineUnavailable, setOutlineUnavailable] = useState(false);

  useEffect(() => {
    const instance = L.map(canvas.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 9,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1,
      scrollWheelZoom: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      fadeAnimation: false,
      inertia: false,
      zoomControl: false,
      attributionControl: false,
    });
    L.control.zoom({ position: 'bottomleft' }).addTo(instance);
    map.current = instance;
    instance.createPane('state-lines').style.zIndex = '410';

    const controller = new AbortController();
    loadOutlines(instance, '/maps/world.geojson', { style: landStyle }, controller.signal).catch(() => {
      if (!controller.signal.aborted) setOutlineUnavailable(true);
    });
    const stateOptions = { style: boundaryStyle, pane: 'state-lines' };
    loadOutlines(instance, '/maps/us-states.geojson', stateOptions, controller.signal).catch(() => {});

    const observer = new ResizeObserver(() => instance.invalidateSize({ animate: false }));
    observer.observe(canvas.current);

    return () => {
      controller.abort();
      observer.disconnect();
      map.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const layer = L.layerGroup().addTo(instance);
    const nextMarkers = new Map();
    const showCityLabel = places.length <= 6;

    for (const place of places) {
      const marker = createMarker(instance, place, { showCityLabel, onSelect: setSelectedId });
      marker.addTo(layer);
      nextMarkers.set(place.id, marker);
    }

    markers.current = nextMarkers;
    fitPlaces(instance, places);

    return () => {
      layer.remove();
      markers.current.clear();
    };
  }, [places]);

  function resetView() {
    if (!map.current) return;
    map.current.closePopup();
    setSelectedId(null);
    fitPlaces(map.current, places);
  }

  function togglePlace(placeId) {
    if (selectedId === placeId) {
      setSelectedId(null);
      map.current?.closePopup();
      return;
    }

    setSelectedId(placeId);
    const marker = markers.current.get(placeId);
    if (map.current && marker) openMarker(map.current, marker);
  }

  return (
    <section className="project-map" aria-labelledby={headingId}>
      <div className="project-map__bar">
        <div>
          <h2 id={headingId}>Project map</h2>
          <p>Pins mark city centers. Select a pin to see listings there.</p>
        </div>
        <Button variant="outline" onClick={resetView}>Fit all pins</Button>
      </div>
      <div className="project-map__canvas" ref={canvas} role="region" aria-label="Interactive map of project locations" />
      <p className="project-map__credit">Made with <a href="https://www.naturalearthdata.com/">Natural Earth</a>.</p>
      {outlineUnavailable && <p role="status">Map outlines could not load. You can browse the places below.</p>}
      <h3>Places on this map</h3>
      <ul className="project-map__places">
        {places.map((place, index) => {
          const expanded = selectedId === place.id;
          const id = `${areaId}-${index}`;
          const count = place.projects.length;

          return (
            <li key={place.id}>
              <button className="project-map__place" type="button" aria-expanded={expanded}
                aria-controls={id} onClick={() => togglePlace(place.id)}>
                <span>{place.label}</span>
                <span>{count} {count === 1 ? 'listing' : 'listings'}</span>
              </button>
              <ul className="project-map__projects" id={id} hidden={!expanded}>
                {place.projects.map((project) => <li key={project.id}><a href={projectHref(project)}>{project.title}</a></li>)}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProjectMap({ projects }) {
  const places = useMemo(() => groupPlaces(projects), [projects]);
  if (!places.length) return null;
  return <PlaceMap places={places} />;
}
