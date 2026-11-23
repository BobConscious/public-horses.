import { readFileSync } from 'node:fs';

let places;

export function findPlace(id) {
  if (id == null) return null;
  if (!places) {
    const catalog = JSON.parse(readFileSync(new URL('../public/maps/places.json', import.meta.url), 'utf8'));
    places = new Map(catalog.map(({ id, label, lat, lng }) => [id, Object.freeze({ id, label, lat, lng })]));
  }
  return places.get(id) ?? null;
}
