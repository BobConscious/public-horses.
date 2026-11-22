import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Router, json } from 'express';
import { emailAddress, HttpError, requireThat, text } from './validation.js';

const derive = promisify(scrypt);
const cookieName = 'ph_session';
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const authWindow = 10 * 60 * 1000;
const authAttempts = 30;
const digest = (token) => createHash('sha256').update(token).digest('hex');

function cookieToken(req) {
  const pair = req.get('cookie')?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(cookieName + '='));
  const token = pair?.slice(cookieName.length + 1);
  return /^[0-9a-f]{64}$/u.test(token ?? '') ? token : undefined;
}

function body(req) {
  requireThat(req.is('application/json') && req.body && !Array.isArray(req.body)
    && typeof req.body === 'object', 400, 'Send the request as a JSON object.');
  return req.body;
}

function chosenPassword(value) {
  requireThat(typeof value === 'string' && value.length >= 10 && value.length <= 128, 400,
    'Enter a password with 10 to 128 characters.');
  return value;
}

async function hashPassword(value) {
  const salt = randomBytes(16);
  const key = await derive(chosenPassword(value), salt, 64);
  return salt.toString('hex') + ':' + key.toString('hex');
}

async function validPassword(value, record) {
  const stored = record?.password_hash;
  const validHash = typeof stored === 'string' && /^[0-9a-f]{32}:[0-9a-f]{128}$/u.test(stored);
  const salt = validHash ? Buffer.from(stored.slice(0, 32), 'hex') : Buffer.alloc(16);
  const expected = validHash ? Buffer.from(stored.slice(33), 'hex') : Buffer.alloc(64);
  const key = await derive(chosenPassword(value), salt, 64);
  return timingSafeEqual(key, expected) && validHash;
}

function accountView(row) {
  return { id: row.id, name: row.name, email: row.email, reviewer: Boolean(row.reviewer) };
}

export function createApi(store, { demo = false, secureCookies = false } = {}) {
  const api = Router();
  const cookies = { httpOnly: true, sameSite: 'lax', secure: secureCookies, path: '/' };
  const attempts = new Map();
  let sweepAt = 0;

  function requireRate(req, res, next) {
    const now = Date.now();
    if (now >= sweepAt) {
      for (const [address, entry] of attempts) if (entry.endsAt <= now) attempts.delete(address);
      sweepAt = now + authWindow;
    }
    const address = req.ip;
    let entry = attempts.get(address);
    if (!entry || entry.endsAt <= now) {
      entry = { count: 0, endsAt: now + authWindow };
      attempts.set(address, entry);
    }
    entry.count += 1;
    if (entry.count > authAttempts) {
      res.set('Retry-After', String(Math.ceil((entry.endsAt - now) / 1000)));
      throw new HttpError(429, 'Too many sign-in attempts. Try again in a few minutes.');
    }
    next();
  }

  function startSession(req, res, user) {
    if (req.sessionToken) store.endSession(digest(req.sessionToken));
    const token = randomBytes(32).toString('hex');
    store.startSession(user.id, digest(token), sessionLifetime);
    res.cookie(cookieName, token, { ...cookies, maxAge: sessionLifetime });
  }

  function signedIn(req, _res, next) {
    requireThat(req.member, 401, 'Sign in to continue.');
    next();
  }

  function reviewer(req, res, next) {
    signedIn(req, res, () => {
      requireThat(req.member.reviewer, 403, 'Review access is required.');
      next();
    });
  }

  api.use((req, _res, next) => {
    req.sessionToken = cookieToken(req);
    req.member = req.sessionToken ? store.sessionUser(digest(req.sessionToken)) : null;
    next();
  });
  api.use(json({ limit: '24kb' }));

  api.get('/session', (req, res) => res.json({ user: req.member, demo }));
  api.post('/accounts', requireRate, async (req, res) => {
    const { name, email, password } = body(req);
    const cleanName = text(name, 'Your name', 80);
    const cleanEmail = emailAddress(email);
    const user = store.createAccount(cleanName, cleanEmail, await hashPassword(password));
    startSession(req, res, user);
    res.status(201).json({ user });
  });
  api.post('/session', requireRate, async (req, res) => {
    const { email, password } = body(req);
    const row = store.accountCredentials(emailAddress(email));
    requireThat(await validPassword(password, row), 401, 'The email or password is incorrect.');
    const user = accountView(row);
    startSession(req, res, user);
    res.json({ user });
  });
  api.delete('/session', (req, res) => {
    if (req.sessionToken) store.endSession(digest(req.sessionToken));
    res.clearCookie(cookieName, cookies);
    res.json({ ok: true });
  });

  api.get('/projects', (_req, res) => res.json({ projects: store.listPublic(demo) }));
  api.get('/projects/:slug', (req, res) => res.json({ project: store.getPublic(req.params.slug, demo) }));
  api.post('/projects', signedIn, (req, res) =>
    res.status(201).json({ project: store.createProject(req.member.id, body(req)) }));
  api.get('/mine/projects', signedIn, (req, res) => res.json({ projects: store.listOwned(req.member.id) }));
  api.patch('/mine/projects/:id', signedIn, (req, res) =>
    res.json({ project: store.updateProject(req.member.id, req.params.id, body(req)) }));
  api.post('/mine/projects/:id/submit', signedIn, (req, res) =>
    res.json({ project: store.submitProject(req.member.id, req.params.id, body(req).version) }));
  api.post('/mine/projects/:id/close', signedIn, (req, res) =>
    res.json({ project: store.closeProject(req.member.id, req.params.id, body(req).version) }));

  api.get('/review', reviewer, (req, res) => res.json({ projects: store.reviewQueue(req.member.id) }));
  api.post('/review/:id', reviewer, (req, res) =>
    res.json({ project: store.reviewProject(req.member.id, req.params.id, body(req)) }));

  api.post('/support', signedIn, (req, res) =>
    res.status(201).json({ seed: store.recordSupport(req.member.id, body(req), demo) }));
  api.get('/garden', signedIn, (req, res) => res.json({ seeds: store.listSeeds(req.member.id) }));
  api.post('/garden/:id/plant', signedIn, (req, res) =>
    res.json({ seed: store.plantSeed(req.member.id, req.params.id, body(req).plot) }));
  api.post('/garden/:id/water', signedIn, (req, res) => {
    body(req);
    res.json({ seed: store.waterSeed(req.member.id, req.params.id) });
  });
  api.post('/garden/:id/harvest', signedIn, (req, res) => {
    body(req);
    res.json({ seed: store.harvestSeed(req.member.id, req.params.id) });
  });

  api.use((_req, res) => res.status(404).json({ error: 'This API route does not exist.' }));
  api.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error.status === 400 || error.status === 413 || error.status === 415) {
      return res.status(error.status).json({ error: 'Send a valid JSON request within the size limit.' });
    }
    console.error('Public Horses API request failed.', error.code ?? error.name);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  return api;
}
