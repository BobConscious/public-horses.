import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
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
      const data = response.headers.get('content-type')?.startsWith('image/')
        ? Buffer.from(await response.arrayBuffer())
        : await response.json();
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
  assert.equal(draft.completion, '');
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
  const { data: { project: closed } } = await owner(mine + '/close', { method: 'POST', body: { version: published.version } });
  assert.equal(closed.status, 'closed');
  assert.equal(closed.fulfilledAt, null);
  assert.deepEqual((await guest('/projects')).data.projects, []);
  assert.equal((await guest('/projects/' + draft.slug)).data.project.open, false);
});

test('only the organizer can confirm fulfillment and a supporter can record help afterward', async (t) => {
  const { client, store } = await running(t);
  const guest = client();
  const owner = client();
  const reviewer = client();
  const supporter = client();
  await signup(owner, 'Organizer');
  store.setReviewer(await signup(reviewer, 'Reviewer'));
  await signup(supporter, 'Supporter');

  await owner('/projects', { method: 'POST', body: { ...request, completion: 'x'.repeat(281) }, expect: 400 });
  const completion = 'The crew sorts all boxes and clears the table.';
  const { data: { project: draft } } = await owner('/projects', {
    method: 'POST', body: { ...request, completion }, expect: 201,
  });
  const mine = '/mine/projects/' + draft.id;
  const publicPath = '/projects/' + draft.slug;
  const service = {
    projectId: draft.id, type: 'time', intention: 'nourishment', note: 'I sorted the donations.', requestId: randomUUID(),
  };
  await supporter('/support', { method: 'POST', body: service, expect: 404 });
  await owner(mine + '/close', { method: 'POST', body: { version: draft.version, fulfilled: true }, expect: 409 });

  const { data: { project: edited } } = await owner(mine, {
    method: 'PATCH', body: { ...request, version: draft.version, summary: 'Sort the Saturday donations.' },
  });
  assert.equal(edited.completion, completion);
  const { data: { project: submitted } } = await owner(mine + '/submit', {
    method: 'POST', body: { version: edited.version },
  });
  const { data: { projects: queue } } = await reviewer('/review');
  assert.equal(queue[0].completion, completion);
  const { data: { project: published } } = await reviewer('/review/' + draft.id, {
    method: 'POST', body: { version: submitted.version, decision: 'publish' },
  });
  const { data: { project: publicProject } } = await guest(publicPath);
  assert.equal(publicProject.completion, completion);
  assert.equal(publicProject.fulfilledAt, null);
  assert.deepEqual(publicProject.needs, request.needs);

  const closure = { version: published.version, fulfilled: true };
  await reviewer(mine + '/close', { method: 'POST', body: closure, expect: 404 });
  await owner(mine + '/close', { method: 'POST', body: { ...closure, version: submitted.version }, expect: 409 });
  await owner(mine + '/close', { method: 'POST', body: { ...closure, fulfilled: 'true' }, expect: 400 });
  const { data: { project: fulfilled } } = await owner(mine + '/close', { method: 'POST', body: closure });
  assert.equal(fulfilled.status, 'closed');
  assert.equal(fulfilled.fulfilledAt, '2027-01-07T12:00:00.000Z');
  assert.deepEqual((await guest('/projects')).data.projects, []);
  const { data: { project: closed } } = await guest(publicPath);
  assert.equal(closed.open, false);
  assert.equal(closed.fulfilledAt, fulfilled.fulfilledAt);
  assert.ok(closed.needs.every(({ url }) => url === null));

  const { data: { seed } } = await supporter('/support', { method: 'POST', body: service, expect: 201 });
  assert.equal(seed.note, service.note);
  assert.equal(seed.reflection, '');
  const replay = await supporter('/support', { method: 'POST', body: service, expect: 201 });
  assert.equal(replay.data.seed.id, seed.id);
  assert.deepEqual((await supporter('/garden')).data.seeds.map(({ id }) => id), [seed.id]);
});

test('expired requests allow past service without confirming fulfillment or exposing help links', async (t) => {
  const { client, store, nextDay } = await running(t);
  seedDemo(store);
  const guest = client();
  const owner = client();
  const reviewer = client();
  await signup(owner, 'Organizer');
  store.setReviewer(await signup(reviewer, 'Reviewer'));

  const { data: { project: draft } } = await owner('/projects', {
    method: 'POST', body: { ...request, endsAt: '2027-01-07' }, expect: 201,
  });
  const mine = '/mine/projects/' + draft.id;
  const { data: { project: submitted } } = await owner(mine + '/submit', {
    method: 'POST', body: { version: draft.version },
  });
  await reviewer('/review/' + draft.id, { method: 'POST', body: { version: submitted.version, decision: 'publish' } });
  nextDay();
  assert.deepEqual((await guest('/projects')).data.projects, []);
  const { data: { project: expired } } = await guest('/projects/' + draft.slug);
  assert.equal(expired.open, false);
  assert.equal(expired.fulfilledAt, null);
  assert.ok(expired.needs.every(({ url }) => url === null));

  const service = { projectId: draft.id, type: 'time', intention: 'nourishment', requestId: randomUUID() };
  await reviewer('/support', { method: 'POST', body: service, expect: 201 });
  await reviewer('/support', {
    method: 'POST', body: { ...service, projectId: 'demo-pantry', type: 'supplies', requestId: randomUUID() }, expect: 404,
  });
});

test('listing images remain private through review and publish as sanitized WebP', async (t) => {
  const { client, store } = await running(t);
  const guest = client();
  const owner = client();
  const reviewer = client();
  const stranger = client();
  await signup(owner, 'Organizer');
  store.setReviewer(await signup(reviewer, 'Reviewer'));
  await signup(stranger, 'Stranger');

  const jpeg = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: '#386147' },
  }).withExif({ IFD0: { Artist: 'Synthetic test' } }).jpeg().toBuffer();
  const image = { data: jpeg.toString('base64'), alt: 'A green test image' };
  await owner('/projects', { method: 'POST', body: { ...request, image: { alt: image.alt } }, expect: 400 });
  await owner('/projects', { method: 'POST', body: { ...request, image: { ...image, alt: '' } }, expect: 400 });
  await owner('/projects', {
    method: 'POST', body: { ...request, image: { ...image, data: Buffer.from('Not an image').toString('base64') } }, expect: 400,
  });
  assert.deepEqual((await owner('/mine/projects')).data.projects, []);
  const { data: { project: draft } } = await owner('/projects', {
    method: 'POST', body: { ...request, image }, expect: 201,
  });
  const mine = '/mine/projects/' + draft.id;
  const publicPath = '/projects/' + draft.slug + '/image';
  const privatePath = '/project-images/' + draft.id + '/preview';
  assert.deepEqual(draft.image, { url: '/api' + privatePath, alt: image.alt });
  await guest(publicPath, { expect: 404 });
  await guest(privatePath, { expect: 401 });
  await reviewer(privatePath, { expect: 404 });
  await stranger(privatePath, { expect: 404 });
  const original = (await owner(privatePath)).data.dataUrl;
  assert.match(original, /^data:image\/webp;base64,/u);

  const { data: { project: cleared } } = await owner(mine, {
    method: 'PATCH', body: { ...request, version: draft.version, image: null },
  });
  assert.equal(cleared.image, null);
  await owner(privatePath, { expect: 404 });
  const { data: { project: restored } } = await owner(mine, {
    method: 'PATCH', body: { ...request, version: cleared.version, image },
  });
  const { data: { project: edited } } = await owner(mine, {
    method: 'PATCH', body: { ...request, version: restored.version, summary: 'Pack groceries next Saturday.' },
  });
  assert.deepEqual(edited.image, draft.image);
  const newAlt = 'Green landscape illustration for the test listing';
  const { data: { project: described } } = await owner(mine, {
    method: 'PATCH', body: { ...request, version: edited.version, image: { alt: newAlt } },
  });
  assert.equal(described.image.alt, newAlt);
  assert.equal((await owner(privatePath)).data.dataUrl, original);
  const { data: { project: submitted } } = await owner(mine + '/submit', {
    method: 'POST', body: { version: described.version },
  });
  await owner(mine, { method: 'PATCH', body: { ...request, version: submitted.version, image: null }, expect: 409 });
  await guest(publicPath, { expect: 404 });
  assert.equal((await reviewer(privatePath)).data.dataUrl, original);
  await reviewer('/review/' + draft.id, {
    method: 'POST', body: { version: submitted.version, decision: 'publish', note: 'Checked the submitted image.' },
  });
  assert.deepEqual((await guest('/projects')).data.projects[0].image, { url: '/api' + publicPath, alt: newAlt });
  const { data: publishedImage, response } = await guest(publicPath);
  assert.equal(response.headers.get('content-type'), 'image/webp');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(publishedImage, Buffer.from(original.split(',')[1], 'base64'));
  const { format, width, exif } = await sharp(publishedImage).metadata();
  assert.equal(format, 'webp');
  assert.equal(width, 1280);
  assert.equal(exif, undefined);
});

test('the demo has a sample image and keeps images optional', async (t) => {
  const { client } = await running(t, { demo: true });
  const guest = client();
  const { data: { projects } } = await guest('/projects');
  const event = projects.find(({ id }) => id === 'demo-fast-for-hunger');
  assert.equal(projects.filter(({ image }) => image).length, 1);
  assert.match(event.image.alt, /city skyline/u);
  const { data } = await guest(event.image.url.slice('/api'.length));
  assert.equal((await sharp(data).metadata()).format, 'webp');
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

  const reflectionPath = plant + '/reflection';
  const observation = 'Several neighbors returned to help again.';
  await guest(reflectionPath, { method: 'PATCH', body: { reflection: observation }, expect: 401 });
  await stranger(reflectionPath, { method: 'PATCH', body: { reflection: observation }, expect: 404 });
  await supporter(reflectionPath, { method: 'PATCH', body: {}, expect: 400 });
  await supporter(reflectionPath, { method: 'PATCH', body: { reflection: 'x'.repeat(501) }, expect: 400 });
  const { data: { seed: reflected } } = await supporter(reflectionPath, { method: 'PATCH', body: { reflection: observation } });
  assert.equal(reflected.reflection, observation);
  assert.equal(reflected.note, body.note);
  assert.equal(reflected.intention, body.intention);
  const updated = 'We planned another shift together.';
  await supporter(reflectionPath, { method: 'PATCH', body: { reflection: updated } });
  assert.equal((await supporter('/garden')).data.seeds[0].reflection, updated);
  assert.deepEqual((await stranger('/garden')).data.seeds, []);
  const publicData = JSON.stringify((await guest('/projects/' + project.slug)).data);
  assert.equal(publicData.includes(body.note), false);
  assert.equal(publicData.includes(updated), false);
  const { data: { seed: cleared } } = await supporter(reflectionPath, { method: 'PATCH', body: { reflection: '' } });
  assert.equal(cleared.reflection, '');
  assert.equal(cleared.note, body.note);
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
      assert.equal(second.listPublic(true).length, 5);
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

test('backup and restore keep a fulfilled request and private service records', () => {
  const folder = mkdtempSync(join(tmpdir(), 'public-horses-backup-'));
  const database = join(folder, 'marketplace.sqlite');
  const snapshot = join(folder, 'snapshot.sqlite');
  const restoredFile = join(folder, 'restored.sqlite');
  const backupScript = fileURLToPath(new URL('../scripts/backup-database.mjs', import.meta.url));
  const fulfilledAt = '2027-01-07T12:00:00.000Z';
  const clock = () => Date.parse(fulfilledAt);
  const completion = 'Sort and label one cart of donations.';
  const note = 'I sorted one cart.';
  const reflection = 'The labels helped the next crew.';
  let source, restored;
  try {
    source = createStore(database, { clock });
    const owner = source.createAccount('Organizer', 'organizer@example.org', 'disabled').id;
    const reviewer = source.createAccount('Reviewer', 'reviewer@example.org', 'disabled').id;
    const supporter = source.createAccount('Supporter', 'supporter@example.org', 'disabled').id;
    const draft = source.createProject(owner, { ...request, completion });
    const submitted = source.submitProject(owner, draft.id, draft.version);
    const published = source.reviewProject(reviewer, draft.id, { version: submitted.version, decision: 'publish' });
    const fulfilled = source.closeProject(owner, draft.id, published.version, true);
    const seed = source.recordSupport(supporter, {
      projectId: fulfilled.id, type: 'time', intention: 'nourishment', note, requestId: randomUUID(),
    });
    source.updateSeedReflection(supporter, seed.id, reflection);

    execFileSync(process.execPath, [backupScript, database, snapshot], { timeout: 20_000 });
    execFileSync(process.execPath, [backupScript, snapshot, restoredFile], { timeout: 20_000 });

    restored = createStore(restoredFile, { clock });
    const [owned] = restored.listOwned(owner);
    assert.equal(owned.status, 'closed');
    const project = restored.getPublic(fulfilled.slug);
    assert.equal(project.id, fulfilled.id);
    assert.equal(project.fulfilledAt, fulfilledAt);
    assert.equal(project.completion, completion);
    assert.equal(project.open, false);
    assert.deepEqual(project.needs, request.needs.map((need) => ({ ...need, url: null })));
    assert.deepEqual(restored.listSeeds(supporter), [{ ...seed, note, reflection }]);
    assert.deepEqual(restored.listSeeds(reviewer), []);
  } finally {
    restored?.close();
    source?.close();
    for (const path of [database, snapshot, restoredFile]) {
      for (const suffix of ['', '-wal', '-shm']) rmSync(path + suffix, { force: true });
    }
    rmdirSync(folder);
  }
});

test('opening a previous database keeps closed listings and original private service notes', () => {
  const folder = mkdtempSync(join(tmpdir(), 'public-horses-migrate-'));
  const database = join(folder, 'marketplace.sqlite');
  const clock = () => Date.parse('2027-01-07T12:00:00Z');
  try {
    const setup = createStore(database, { clock });
    let owner, reviewer, draft, seed;
    try {
      owner = setup.createAccount('Organizer', 'organizer@example.org', 'disabled').id;
      reviewer = setup.createAccount('Reviewer', 'reviewer@example.org', 'disabled').id;
      draft = setup.createProject(owner, request);
      const submitted = setup.submitProject(owner, draft.id, draft.version);
      const published = setup.reviewProject(reviewer, draft.id, { version: submitted.version, decision: 'publish' });
      seed = setup.recordSupport(reviewer, {
        projectId: draft.id, type: 'time', intention: 'nourishment', note: 'Original private note', requestId: randomUUID(),
      });
      setup.closeProject(owner, draft.id, published.version);
    } finally {
      setup.close();
    }

    const previous = new DatabaseSync(database);
    try {
      previous.exec(`ALTER TABLE projects DROP COLUMN completion;
        ALTER TABLE projects DROP COLUMN fulfilled_at;
        ALTER TABLE seeds DROP COLUMN reflection;`);
    } finally {
      previous.close();
    }

    for (let iteration = 0; iteration < 2; iteration += 1) {
      const migrated = createStore(database, { clock });
      try {
        const [closed] = migrated.listOwned(owner);
        assert.equal(closed.id, draft.id);
        assert.equal(closed.status, 'closed');
        assert.equal(closed.completion, '');
        assert.equal(closed.fulfilledAt, null);
        assert.deepEqual(migrated.listSeeds(reviewer), [seed]);
      } finally {
        migrated.close();
      }
    }
  } finally {
    for (const name of ['marketplace.sqlite', 'marketplace.sqlite-wal', 'marketplace.sqlite-shm']) {
      rmSync(join(folder, name), { force: true });
    }
    rmdirSync(folder);
  }
});
