import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { seedDemo } from '../server/demo.js';
import { createApp } from '../server/index.js';
import { createStore } from '../server/store.js';

const clock = () => Date.parse('2027-01-07T12:00:00Z');
const request = {
  title: 'Sort boxes at the pantry',
  location: 'York, PA',
  summary: 'Sort groceries before the Saturday pickup.',
  story: 'Our team packs grocery bags for neighbors each week.',
  field: 'nourishment',
  endsAt: '2027-02-20',
  proofUrl: 'https://pantry.example.org/saturday',
  needs: [{ type: 'time', detail: 'Help for one hour on Saturday.', url: 'https://pantry.example.org/help' }],
};

async function running(t) {
  const store = createStore(':memory:', { clock });
  const server = createApp({ store }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => {
    store.close();
    if (error) reject(error);
    else resolve();
  })));
  const api = `http://127.0.0.1:${server.address().port}/api`;

  function client(member) {
    const token = member && randomBytes(32).toString('hex');
    if (token) store.startSession(member.id, createHash('sha256').update(token).digest('hex'), 60_000);
    return async (path, { method = 'GET', body, status = 200 } = {}) => {
      const response = await fetch(api + path, {
        method,
        headers: {
          ...(token ? { Cookie: `ph_session=${token}` } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      assert.equal(response.status, status, JSON.stringify(data));
      return data;
    };
  }

  function account(name, reviewer = false) {
    const email = `${name.toLowerCase()}@accounts.example.org`;
    const user = store.createAccount(name, email, 'disabled');
    return client(reviewer ? store.setReviewer(email) : user);
  }

  return { account, guest: client() };
}

test('only the owner can edit a profile or use it on a project', async (t) => {
  const { account, guest } = await running(t);
  const owner = account('Organizer');
  const stranger = account('Stranger');
  await guest('/mine/profiles', { status: 401 });
  const create = { method: 'POST', body: { kind: 'person', name: 'Mira Ortiz' } };
  const { profile } = await owner('/mine/profiles', { ...create, status: 201 });
  await owner('/mine/profiles', { ...create, status: 409 });
  await owner('/mine/profiles', {
    method: 'POST', body: { kind: 'organization', name: 'Unusable link', websiteUrl: 'http://example.org' },
    status: 400,
  });
  assert.deepEqual((await stranger('/mine/profiles')).profiles, []);
  await guest(`/profiles/${profile.slug}`, { status: 404 });
  const path = `/mine/profiles/${profile.id}`;
  const update = { method: 'PATCH', body: { version: profile.version, bio: 'I organize pantry shifts.' } };
  await stranger(path, { ...update, status: 404 });
  await stranger('/projects', { method: 'POST', body: { ...request, profileId: profile.id }, status: 404 });
  await owner(path, { ...update, body: { ...update.body, kind: 'organization' }, status: 400 });
  const { profile: revised } = await owner(path, update);
  assert.equal(revised.name, profile.name);
  assert.equal(revised.slug, profile.slug);
  assert.equal(revised.version, 2);
  assert.equal(revised.bio, update.body.bio);
  await owner(path, { ...update, status: 409 });

  const { project: draft } = await owner('/projects', {
    method: 'POST', body: { ...request, profileId: profile.id }, status: 201,
  });
  await owner(path, { method: 'PATCH', body: { name: 'Mira Reyes', version: 2 } });
  const { projects: [current] } = await owner('/mine/projects');
  assert.equal(current.organization, 'Mira Reyes');
  const { project: saved } = await owner(`/mine/projects/${draft.id}`, {
    method: 'PATCH', body: { ...request, organization: current.organization, version: draft.version },
  });
  assert.equal(saved.profile.id, profile.id);
  assert.equal(saved.profile.kind, 'person');
});

test('publication exposes the profile revision reviewed with each project', async (t) => {
  const { account, guest } = await running(t);
  const owner = account('Organizer');
  const reviewer = account('Reviewer', true);
  const { profile } = await owner('/mine/profiles', {
    method: 'POST', status: 201, body: {
      kind: 'organization', name: 'Sample Food Pantry', bio: 'We serve our neighbors.',
      location: 'York, PA', websiteUrl: 'https://pantry.example.org',
    },
  });
  const profilePath = `/profiles/${profile.slug}`;
  const firstProject = { ...request, profileId: profile.id, listingType: 'volunteer', schedule: 'Saturdays' };
  const { project: draft } = await owner('/projects', { method: 'POST', status: 201, body: firstProject });
  const ownProject = `/mine/projects/${draft.id}`;
  const { project: submitted } = await owner(ownProject + '/submit', {
    method: 'POST', body: { version: draft.version },
  });
  await guest(profilePath, { status: 404 });
  const { profile: revised } = await owner(`/mine/profiles/${profile.id}`, {
    method: 'PATCH', body: { version: 1, name: 'Sample Community Pantry', websiteUrl: 'https://community.example.org' },
  });
  assert.equal(revised.version, 2);
  const queue = await reviewer('/review');
  assert.deepEqual(queue.projects[0].profile, profile);
  assert.equal(queue.projects[0].schedule, firstProject.schedule);

  const { project: approved } = await reviewer(`/review/${draft.id}`, {
    method: 'POST', body: { version: submitted.version, decision: 'publish' },
  });
  const page = await guest(profilePath);
  assert.deepEqual(page.profile, profile);
  assert.equal(page.profile.websiteUrl, 'https://pantry.example.org/');
  assert.equal(page.projects[0].listingType, 'volunteer');
  assert.equal(page.projects[0].proofUrl, undefined);
  assert.equal(JSON.stringify(page).includes('@accounts.example.org'), false);

  const { project: event } = await owner('/projects', {
    method: 'POST', status: 201, body: {
      ...request, title: 'Monthly pantry orientation', profileId: profile.id, listingType: 'event',
      schedule: 'First Friday of every month',
    },
  });
  const { project: eventSubmitted } = await owner(`/mine/projects/${event.id}/submit`, {
    method: 'POST', body: { version: event.version },
  });
  await reviewer(`/review/${event.id}`, {
    method: 'POST', body: { version: eventSubmitted.version, decision: 'publish' },
  });
  const updatedPage = await guest(profilePath);
  assert.deepEqual(updatedPage.profile, revised);
  assert.equal(updatedPage.projects.find((item) => item.id === event.id).listingType, 'event');
  await owner(ownProject + '/close', { method: 'POST', body: { version: approved.version } });
  const { project: closed } = await guest(`/projects/${draft.slug}`);
  assert.deepEqual(closed.profile, profile);
  assert.deepEqual((await guest(profilePath)).projects.map(({ id }) => id), [event.id]);
});

test('demo profiles stay private outside demo mode and keep their URLs across instances', () => {
  const store = createStore(':memory:', { clock });
  const otherInstance = createStore(':memory:', { clock });
  try {
    seedDemo(store);
    seedDemo(otherInstance);
    const projects = store.listPublic(true);
    assert.ok(projects.length > 0);
    for (const project of projects) {
      const { profile } = project;
      assert.equal(profile.demo, true);
      assert.throws(() => store.getPublicProfile(profile.slug), { status: 404 });
      const page = otherInstance.getPublicProfile(profile.slug, true);
      assert.deepEqual(page.profile, profile);
      assert.ok(page.projects.some(({ id }) => id === project.id));
    }
    assert.deepEqual(store.listPublic(), []);
  } finally {
    store.close();
    otherInstance.close();
  }
});

test('an existing database gains shared legacy profiles and keeps its review and garden records', () => {
  const folder = mkdtempSync(join(tmpdir(), 'public-horses-profiles-'));
  const path = join(folder, 'marketplace.sqlite');
  try {
    const setup = createStore(path, { clock });
    let owner, approved, seed;
    try {
      owner = setup.createAccount('Organizer', 'organizer@example.org', 'disabled');
      const reviewer = setup.createAccount('Reviewer', 'reviewer@example.org', 'disabled');
      const legacy = { ...request, organization: 'Neighborhood Pantry' };
      const first = setup.createProject(owner.id, legacy);
      setup.createProject(owner.id, { ...legacy, title: 'Pack a second delivery' });
      const submitted = setup.submitProject(owner.id, first.id, first.version);
      approved = setup.reviewProject(reviewer.id, first.id, {
        version: submitted.version, decision: 'publish', note: 'Confirmed pantry information.',
      });
      seed = setup.recordSupport(reviewer.id, {
        projectId: first.id, requestId: randomUUID(), type: 'time', intention: 'nourishment', note: 'Packed groceries.',
      });
    } finally {
      setup.close();
    }

    // Remove only the schema additions to reproduce the earlier on-disk layout.
    const legacy = new DatabaseSync(path);
    try {
      legacy.exec(`PRAGMA foreign_keys = ON; DROP TABLE project_profiles; DROP TABLE profile_revisions;
        DROP TABLE profiles; DROP INDEX projects_owner_identity;`);
    } finally {
      legacy.close();
    }

    let migratedProfile;
    for (let iteration = 0; iteration < 2; iteration += 1) {
      const store = createStore(path, { clock });
      try {
        const projects = store.listOwned(owner.id);
        const profiles = store.listOwnedProfiles(owner.id);
        assert.equal(projects.length, 2);
        assert.equal(profiles.length, 1);
        const [profile] = profiles;
        assert.equal(profile.name, 'Neighborhood Pantry');
        assert.equal(profile.kind, 'organization');
        assert.ok(projects.every((project) => project.profile.id === profile.id));
        const previous = projects.find(({ id }) => id === approved.id);
        assert.equal(previous.reviewNote, approved.reviewNote);
        assert.equal(previous.version, approved.version);
        assert.deepEqual(store.getPublicProfile(profile.slug).projects.map(({ id }) => id), [approved.id]);
        const reviewer = store.accountCredentials('reviewer@example.org');
        assert.deepEqual(store.listSeeds(reviewer.id), [seed]);
        if (migratedProfile) assert.deepEqual(profile, migratedProfile);
        migratedProfile = profile;
      } finally {
        store.close();
      }
    }
  } finally {
    for (const file of ['marketplace.sqlite', 'marketplace.sqlite-shm', 'marketplace.sqlite-wal']) {
      rmSync(join(folder, file), { force: true });
    }
    rmdirSync(folder);
  }
});
