import { mkdir, writeFile } from 'node:fs/promises';

const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/';
const output = new URL('../public/maps/', import.meta.url);

async function load(name) {
  const response = await fetch(source + name + '.geojson', { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(name + ' returned HTTP ' + response.status);
  const data = await response.json();
  if (data.type !== 'FeatureCollection' || !data.features.length) throw new Error('Unexpected map data for ' + name);
  return data.features;
}

function round(number, digits) {
  return Number(number.toFixed(digits));
}

function mapCoordinates(coordinates) {
  return coordinates.map((item) => typeof item === 'number' ? round(item, 4) : mapCoordinates(item));
}

function outlines(features, nameKey, { keep = () => true } = {}) {
  return {
    type: 'FeatureCollection',
    features: features.filter(keep).map(({ geometry, properties }) => ({
      type: 'Feature',
      properties: { name: properties[nameKey] },
      geometry: { type: geometry.type, coordinates: mapCoordinates(geometry.coordinates) },
    })),
  };
}

function place({ properties, geometry }) {
  const country = properties.adm0name === 'United States of America' ? 'United States' : properties.adm0name;
  const names = [properties.name, properties.adm1name, country].filter((value) =>
    typeof value === 'string' && value && value !== '-99');
  const [lng, lat] = geometry.coordinates;
  return {
    id: 'ne-' + properties.ne_id,
    label: [...new Set(names)].join(', '),
    lat: round(lat, 2),
    lng: round(lng, 2),
  };
}

const [countries, states, populated] = await Promise.all([
  load('ne_110m_admin_0_countries'),
  load('ne_110m_admin_1_states_provinces'),
  load('ne_10m_populated_places_simple'),
]);
const places = populated.filter(({ geometry, properties }) =>
  geometry.type === 'Point' && properties.name && Number.isSafeInteger(properties.ne_id))
  .map(place)
  .filter(({ lat, lng }) => Math.abs(lat) <= 85 && Math.abs(lng) <= 180)
  .sort((left, right) => left.id.localeCompare(right.id));
if (new Set(places.map(({ id }) => id)).size !== places.length) throw new Error('Duplicate place IDs');

const files = {
  'world.geojson': outlines(countries, 'NAME', { keep: ({ properties }) => properties.ADM0_A3 !== 'ATA' }),
  'us-states.geojson': outlines(states, 'name'),
  'places.json': places,
};
await mkdir(output, { recursive: true });
await Promise.all(Object.entries(files).map(async ([name, data]) => {
  await writeFile(new URL(name, output), JSON.stringify(data) + '\n');
  console.log('Saved ' + name);
}));
