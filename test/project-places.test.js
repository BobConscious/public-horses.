import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createStore } from '../server/store.js';

const clock = () => Date.parse('2027-01-07T12:00:00Z');
const catalog = JSON.parse(readFileSync(new URL('../public/maps/places.json', import.meta.url), 'utf8'));
const york = catalog.find(({ id }) => id === 'ne-1159133615');
const richmond = catalog.find(({ id }) => id === 'ne-1159149295');

const listing = {
  title: 'Sort boxes at the pantry',
  organization: 'Neighborhood Pantry',
  location: 'York, Pennsylvania',
  summary: 'Pack grocery bags before the pickup.',
  story: 'Our volunteers sort groceries for their neighbors each Saturday.',
  field: 'nourishment',
  endsAt: '2027-02-20',
  proofUrl: 'https://pantry.example.org/saturday',
  needs: [{ type: 'time', detail: 'Help for one hour.', url: 'https://pantry.example.org/help' }],
};

function withStore(callback, path = ':memory:') {
  const store = createStore(path, { clock });
  try {
    return callback(store);
  } finally {
    store.close();
  }
}

function organizer(store) {
  return store.createAccount('Organizer', 'organizer@example.org', 'disabled').id;
}

test('only the approved city appears on the public map', () => withStore((store) => {
  const owner = organizer(store);
  const reviewer = store.createAccount('Reviewer', 'reviewer@example.org', 'disabled').id;
  const draft = store.createProject(owner, { ...listing, placeId: york.id });
  assert.deepEqual(draft.mapLocation, york);
  assert.deepEqual(store.listPublic(), []);
  assert.throws(() => store.getPublic(draft.slug), { status: 404 });
  assert.throws(() => store.updateProject(reviewer, draft.id, {
    ...listing, version: draft.version, placeId: richmond.id,
  }), { status: 404 });

  const submitted = store.submitProject(owner, draft.id, draft.version);
  assert.deepEqual(store.reviewQueue(reviewer)[0].mapLocation, york);
  assert.deepEqual(store.listPublic(), []);
  assert.throws(() => store.updateProject(owner, draft.id, {
    ...listing, version: submitted.version, placeId: richmond.id,
  }), { status: 409 });

  const published = store.reviewProject(reviewer, draft.id, { version: submitted.version, decision: 'publish' });
  assert.deepEqual(store.listPublic()[0].mapLocation, york);
  assert.deepEqual(store.getPublic(draft.slug).mapLocation, york);
  assert.deepEqual(store.getPublicProfile(draft.profile.slug).projects[0].mapLocation, york);
  store.closeProject(owner, draft.id, published.version);
  assert.deepEqual(store.listPublic(), []);
}));

test('edits preserve, move, or clear a city without accepting new coordinates', () => withStore((store) => {
  const owner = organizer(store);
  for (const placeId of ['not-a-known-city', { lat: 40, lng: -76 }]) {
    assert.throws(() => store.createProject(owner, { ...listing, placeId }), { status: 400 });
  }
  assert.deepEqual(store.listOwned(owner), []);
  let draft = store.createProject(owner, { ...listing, placeId: york.id });
  function edit(changes) {
    draft = store.updateProject(owner, draft.id, { ...listing, version: draft.version, ...changes });
    return draft.mapLocation;
  }

  assert.deepEqual(edit({ summary: 'Sort pantry bags after pickup.' }), york);
  assert.throws(() => edit({ location: 'Richmond, Virginia', placeId: 'unknown' }), { status: 400 });
  assert.deepEqual(store.listOwned(owner)[0], draft);
  assert.equal(edit({ location: 'Online' }), null);
  assert.deepEqual(edit({ location: 'Richmond, Virginia', placeId: richmond.id }), richmond);
  assert.equal(edit({ placeId: null }), null);
  assert.deepEqual(edit({ placeId: york.id }), york);
  assert.equal(edit({ placeId: '' }), null);
}));

test('existing projects still open without pins and can persist an added city', (t) => {
  const folder = mkdtempSync(join(tmpdir(), 'public-horses-places-'));
  const path = join(folder, 'marketplace.sqlite');
  t.after(() => {
    for (const suffix of ['', '-shm', '-wal']) rmSync(path + suffix, { force: true });
    rmdirSync(folder);
  });

  const { owner, draft } = withStore((store) => {
    const owner = organizer(store);
    return { owner, draft: store.createProject(owner, listing) };
  }, path);
  const legacy = new DatabaseSync(path);
  try {
    legacy.exec('DROP TABLE project_places');
  } finally {
    legacy.close();
  }
  withStore((store) => {
    assert.equal(store.listOwned(owner)[0].mapLocation, null);
    store.updateProject(owner, draft.id, { ...listing, version: draft.version, placeId: york.id });
  }, path);
  withStore((store) => {
    assert.deepEqual(store.listOwned(owner)[0].mapLocation, york);
  }, path);
});

test('reseeding a demo project refreshes its city', () => withStore((store) => {
  const demo = { ...listing, id: 'demo-pantry-map', slug: 'demo-pantry-map' };
  store.addDemoProjects([demo]);
  assert.equal(store.getPublic(demo.slug, true).mapLocation, null);
  store.addDemoProjects([{ ...demo, placeId: york.id }]);
  assert.deepEqual(store.getPublic(demo.slug, true).mapLocation, york);
  assert.deepEqual(store.listPublic(), []);
  store.addDemoProjects([demo]);
  assert.equal(store.getPublic(demo.slug, true).mapLocation, null);
}));
