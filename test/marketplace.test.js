import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server/index.js';
import { seedDemo } from '../server/demo.js';
import { createStore } from '../server/store.js';

const fullDay = 86_400_000;
const password = 'synthetic-long-password';
const request = {
  title: 'Pantry needs a winter delivery',
  organization: 'Example Neighborhood Pantry',
  location: 'York, PA',
  summary: 'Help our weekend crew pack groceries.',
  story: 'We pack and distribute grocery bags every Saturday.',
  field: 'nourishment',
  endsAt: '2027-01-25',
  proofUrl: 'https://pantry.example.org/about',
  needs: [
    { type: 'funding', detail: 'Give directly for grocery staples.', url: 'https://pantry.example.org/give' },
    { type: 'time', detail: 'Help sort groceries on Saturday.', url: 'https://pantry.example.org/help' },
  ],
};

async function running(t, { demo = false } = {}) {
  let now = Date.parse('2027-01-07T12:00:00Z');
  const store = createStore(':memory:', { clock: () => now });
  if (demo) seedDemo(store);
  const server = createApp({ store, demo }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => {
    store.close();
    if (error) reject(error);
    else resolve();
  })));
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  function client() {
    let cookie;
    return async (path, { method = 'GET', body, expect = 200, origin } = {}) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          ...(cookie ? { Cookie: cookie } : {}),
          ...(origin ? { Origin: origin } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      if (expect) assert.equal(response.status, expect, JSON.stringify(data));
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';', 1)[0];
      return { data, response };
    };
  }
  return { client, store, nextDay: () => { now += fullDay; } };
}

async function signup(client, name, email = name.toLowerCase() + '@example.org') {
  await client('/accounts', { method: 'POST', body: { name, email, password }, expect: 0 })
    .then(({ response }) => assert.ok(response.ok));
  return email;
}

test('an organizer submits, gets feedback, and a different reviewer publishes the current version', async (t) => {
  const { client, store } = await running(t);
  const guest = client();
  const owner = client();
  const reviewer = client();
  const ownerEmail = await signup(owner, 'Organizer');
  const reviewerEmail = await signup(reviewer, 'Reviewer');
  store.setReviewer(ownerEmail);
  store.setReviewer(reviewerEmail);
  const { data: { project: draft } } = await owner('/projects', { method: 'POST', body: request, expect: 0 });
  assert.equal(draft.status, 'draft');
  assert.deepEqual((await guest('/projects')).data.projects, []);
  await guest('/projects/' + draft.slug, { expect: 404 });
  const mine = '/mine/projects/' + draft.id;
  const review = '/review/' + draft.id;
  assert.ok(!(await reviewer(mine, { method: 'PATCH', body: { ...request, version: draft.version }, expect: 0 })).response.ok);
  const { data: { project: submitted } } = await owner(mine + '/submit', { method: 'POST', body: { version: draft.version } });
  assert.deepEqual((await owner('/review')).data.projects, []);
  assert.ok(!(await owner(review, { method: 'POST', body: { version: submitted.version, decision: 'publish', note: 'Tried self-review.' }, expect: 0 })).response.ok);
  const { data: { project: held } } = await reviewer(review, {
    method: 'POST', body: { version: submitted.version, decision: 'changes_requested', note: 'Add the confirmed day.' },
  });
  assert.equal(held.status, 'changes_requested');
  const { data: { project: edited } } = await owner(mine, { method: 'PATCH', body: { ...request, version: held.version } });
  const { data: { project: current } } = await owner(mine + '/submit', { method: 'POST', body: { version: edited.version } });
  await reviewer(review, { method: 'POST', body: { version: submitted.version, decision: 'publish', note: 'Outdated.' }, expect: 409 });
  const { data: { project: published } } = await reviewer(review, {
    method: 'POST', body: { version: current.version, decision: 'publish', note: 'Verified the official ask.' },
  });
  const publicCard = (await guest('/projects/' + draft.slug)).data.project;
  assert.equal(publicCard.title, request.title);
  assert.equal(publicCard.open, true);
  assert.equal('proofUrl' in publicCard, false);
  assert.equal('reviewNote' in publicCard, false);
  await owner(mine + '/close', { method: 'POST', body: { version: published.version } });
  assert.deepEqual((await guest('/projects')).data.projects, []);
  assert.equal((await guest('/projects/' + draft.slug)).data.project.open, false);
});

test('support retries add one private seed, and plants grow across separate days', async (t) => {
  const { client, nextDay } = await running(t, { demo: true });
  const supporter = client();
  const stranger = client();
  const guest = client();
  await signup(supporter, 'Supporter');
  await signup(stranger, 'Stranger');
  assert.equal((await guest('/session')).data.demo, true);
  const project = (await guest('/projects')).data.projects[0];
  assert.equal(project.demo, true);
  const body = { projectId: project.id, type: project.needs[0].type, intention: 'partnership', note: 'My private reflection', requestId: randomUUID() };
  await guest('/support', { method: 'POST', body, expect: 401 });
  const { data: { seed } } = await supporter('/support', { method: 'POST', body, expect: 0 });
  const replay = await supporter('/support', { method: 'POST', body, expect: 0 });
  assert.equal(replay.data.seed.id, seed.id);
  await supporter('/support', { method: 'POST', body: { ...body, note: 'Changed' }, expect: 409 });
  assert.equal((await supporter('/garden')).data.seeds.length, 1);
  assert.deepEqual((await stranger('/garden')).data.seeds, []);
  const plant = '/garden/' + seed.id;
  assert.ok(!(await stranger(plant + '/plant', { method: 'POST', body: { plot: 1 }, expect: 0 })).response.ok);
  assert.equal((await supporter(plant + '/plant', { method: 'POST', body: { plot: 1 } })).data.seed.plot, 1);
  const water = () => supporter(plant + '/water', { method: 'POST', body: {} });
  assert.equal((await water()).data.seed.waters, 1);
  const sameDay = await supporter(plant + '/water', { method: 'POST', body: {}, expect: 0 });
  assert.ok(!sameDay.response.ok || sameDay.data.seed.waters === 1);
  nextDay();
  assert.equal((await water()).data.seed.waters, 2);
  nextDay();
  assert.equal((await water()).data.seed.waters, 3);
  const harvested = (await supporter(plant + '/harvest', { method: 'POST', body: {} })).data.seed;
  assert.ok(harvested.harvestedAt);
  assert.equal(harvested.note, body.note);
  assert.equal(JSON.stringify((await guest('/projects')).data).includes(body.note), false);
});

test('only same-origin requests can act from a browser session', async (t) => {
  const { client } = await running(t);
  const user = client();
  await user('/accounts', { method: 'POST', body: { name: 'Test', email: 'test@example.org', password }, origin: 'https://unrelated.example', expect: 403 });
  await signup(user, 'Test');
  const session = await user('/session');
  assert.equal(session.response.headers.get('cache-control'), 'private, no-store');
  assert.equal(session.data.user.email, 'test@example.org');
});

test('a file-backed store retains fixtures across restarts', () => {
  const folder = mkdtempSync(join(tmpdir(), 'public-horses-test-'));
  const database = join(folder, 'marketplace.sqlite');
  try {
    const first = createStore(database);
    try {
      seedDemo(first);
    } finally {
      first.close();
    }
    const second = createStore(database);
    try {
      assert.equal(second.listPublic(true).length, 3);
      assert.equal(second.listPublic(false).length, 0);
    } finally {
      second.close();
    }
  } finally {
    for (const name of ['marketplace.sqlite', 'marketplace.sqlite-wal', 'marketplace.sqlite-shm']) {
      rmSync(join(folder, name), { force: true });
    }
    rmdirSync(folder);
  }
});
