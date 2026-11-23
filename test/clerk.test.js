import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createClerkAuth, loadClerkConfig, resolveClerkMember } from '../server/clerk.js';
import { createApp } from '../server/index.js';
import { createStore } from '../server/store.js';

const issuer = 'https://public-horses-fixture.clerk.accounts.dev';
const origin = 'http://127.0.0.1:4173';
const publishableKey = 'pk_test_' + Buffer.from(new URL(issuer).host + '$').toString('base64');
const testEnv = {
  PH_AUTH_MODE: 'clerk', PH_ORIGIN: origin,
  CLERK_PUBLISHABLE_KEY: publishableKey, CLERK_SECRET_KEY: 'sk_test_synthetic_input',
};

test('Clerk configuration requires an exact origin and matching runtime keys', () => {
  assert.equal(loadClerkConfig({}), null);
  assert.equal(loadClerkConfig({ PH_AUTH_MODE: 'invalid' }, { demo: true }), null);
  assert.equal(loadClerkConfig(testEnv).issuer, issuer);
  assert.throws(() => loadClerkConfig({ ...testEnv, PH_ORIGIN: origin + '/other' }), /exact Clerk application origin/);
  assert.throws(() => loadClerkConfig({ ...testEnv, CLERK_SECRET_KEY: 'sk_live_incorrect' }), /matching/);
  assert.throws(() => loadClerkConfig({ ...testEnv, PH_ORIGIN: 'http://horses.example' }), /Hosted origins require HTTPS/);
  assert.equal(loadClerkConfig({ ...testEnv, PH_ORIGIN: 'https://preview.horses.example' }).issuer, issuer);
});

function browserSession(userId, options = {}) {
  const sessionId = 'sess_local_fixture';
  return {
    isAuthenticated: true,
    userId,
    sessionId,
    sessionClaims: { iss: issuer, azp: origin, sub: userId, sid: sessionId, ...options },
  };
}

test('Clerk provisions a verified member by issuer and user ID and preserves app permissions', async (t) => {
  const store = createStore(':memory:');
  t.after(() => store.close());
  const config = loadClerkConfig(testEnv);
  const session = browserSession('user_new123');
  const profile = {
    id: session.userId, firstName: 'River',
    primaryEmailAddress: { emailAddress: 'river@example.org', verification: { status: 'verified' } },
  };
  await assert.rejects(resolveClerkMember(store, config, session, async () => ({
    ...profile, primaryEmailAddress: { ...profile.primaryEmailAddress, verification: { status: 'unverified' } },
  })), { status: 403 });
  await assert.rejects(resolveClerkMember(store, config, browserSession(session.userId, { azp: 'https://other.example' }),
    async () => { assert.fail('A session from another origin reached the provider.'); }), { status: 401 });
  const member = await resolveClerkMember(store, config, session, async () => profile);
  assert.equal(member.reviewer, false);
  assert.equal(store.setClerkReviewer(issuer, session.userId).reviewer, true);
  const later = await resolveClerkMember(store, config, session, async () => {
    assert.fail('An existing identity should not fetch the profile again.');
  });
  assert.equal(later.id, member.id);
  assert.equal(later.reviewer, true);

  const local = store.createAccount('Existing member', 'existing@example.org', 'local_hash_fixture');
  const collision = browserSession('user_another1');
  await assert.rejects(resolveClerkMember(store, config, collision, async () => ({
    ...profile, id: collision.userId, primaryEmailAddress: { ...profile.primaryEmailAddress, emailAddress: local.email },
  })), { status: 409 });
  assert.equal(store.clerkMember(issuer, collision.userId), null);
});

test('Clerk mode verifies a session through the SDK and leaves password routes disabled', async (t) => {
  const store = createStore(':memory:');
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(() => {
    store.close();
    resolve();
  })));
  const canonical = 'http://127.0.0.1:' + server.address().port;
  const config = loadClerkConfig({ ...testEnv, PH_ORIGIN: canonical });
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const clerk = createClerkAuth({ ...config, jwtKey: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  server.on('request', createApp({ store, origin: canonical, production: true, clerk }));
  const member = store.provisionClerkMember({ issuer, subject: 'user_fixture1', name: 'River', email: 'river@example.org' });

  function token(azp) {
    const issued = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: 'local-fixture', cat: 'cl_B7d4PD111AAA' };
    const claims = {
      iss: issuer, azp, sub: 'user_fixture1', sid: 'sess_fixture',
      iat: issued, nbf: issued - 1, exp: issued + 60, sts: 'active', v: 2,
    };
    const payload = [header, claims].map((value) => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
    return payload + '.' + sign('RSA-SHA256', Buffer.from(payload), pair.privateKey).toString('base64url');
  }

  const options = (azp) => ({ headers: { Accept: 'application/json', Authorization: 'Bearer ' + token(azp) } });
  const api = canonical + '/api';
  const provider = await fetch(api + '/auth-config');
  assert.deepEqual(await provider.json(), { mode: 'clerk', publishableKey });
  const csp = provider.headers.get('content-security-policy');
  assert.ok(csp.includes(issuer));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  const session = await fetch(api + '/session', options(canonical));
  assert.deepEqual(await session.json(), { user: member, demo: false, clerkSessionId: 'sess_fixture' },
    session.headers.get('x-clerk-auth-reason') ?? `HTTP ${session.status}`);
  const cookieSession = await fetch(api + '/session', {
    headers: { Accept: 'application/json', Cookie: '__session=' + token(canonical) + '; __client_uat=1; __clerk_db_jwt=fixture' },
  });
  assert.equal((await cookieSession.json()).user?.id, member.id,
    cookieSession.headers.get('x-clerk-auth-reason') ?? 'Clerk cookie session');
  const switched = await fetch(api + '/garden', {
    headers: { ...options(canonical).headers, 'X-PH-Session': 'sess_previous_account' },
  });
  assert.equal(switched.status, 409);
  const activeGarden = await fetch(api + '/garden', {
    headers: { ...options(canonical).headers, 'X-PH-Session': 'sess_fixture' },
  });
  assert.deepEqual(await activeGarden.json(), { seeds: [] });
  const local = store.createAccount('Local fixture', 'local@example.org', 'local_hash_fixture');
  const localToken = 'b'.repeat(64);
  store.startSession(local.id, createHash('sha256').update(localToken).digest('hex'), 60000);
  const oldSession = await fetch(api + '/session', {
    headers: { Accept: 'application/json', Cookie: 'ph_session=' + localToken },
  });
  assert.deepEqual(await oldSession.json(), { user: null, demo: false, clerkSessionId: null });
  assert.equal((await fetch(api + '/garden', options('https://other.example'))).status, 401);
  assert.equal((await fetch(api + '/review', options(canonical))).status, 403);
  assert.equal((await fetch(api + '/accounts', { method: 'POST' })).status, 404);
  assert.equal((await fetch(api + '/session', { method: 'DELETE' })).status, 404);
});
