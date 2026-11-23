import express from 'express';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApi } from './api.js';
import { appContentSecurityPolicy, createClerkAuth, loadClerkConfig } from './clerk.js';
import { seedDemo } from './demo.js';
import { createStore } from './store.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const privateData = resolve(root, '.data');

function within(folder, path) {
  const location = relative(folder, path);
  return !isAbsolute(location) && location !== '..' && !location.startsWith('..' + sep);
}

export function databasePath(demo) {
  const demoPath = resolve(privateData, 'marketplace-demo.sqlite');
  if (demo) return demoPath;
  const path = resolve(root, process.env.PH_DB_PATH || '.data/marketplace.sqlite');
  if (path === demoPath || (within(root, path) && !within(privateData, path))) {
    throw new Error('Keep service data in .data or outside the application directory.');
  }
  return path;
}

export function createApp({ store, demo = false, origin, production = false, clerk }) {
  const app = express();
  const secureCookies = origin?.startsWith('https://') ?? false;
  const csp = production ? appContentSecurityPolicy(clerk?.frontendOrigin) : null;
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const requestUrl = URL.parse('http://' + (req.get('Host') ?? ''));
    const expectedOrigin = origin ?? requestUrl?.origin;
    const expectedHost = origin ? new URL(origin).host : requestUrl?.host;
    if (!expectedHost || requestUrl?.host !== expectedHost
      || (!origin && !localHosts.has(requestUrl.hostname))) {
      return res.status(400).json({ error: 'This host is not configured.' });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)
      && ((req.get('Origin') && req.get('Origin') !== expectedOrigin)
        || req.get('Sec-Fetch-Site') === 'cross-site')) {
      return res.status(403).json({ error: 'Open Public Horses to make this request.' });
    }
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (csp) res.set('Content-Security-Policy', csp);
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  }, createApi(store, { demo, secureCookies, clerk }));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  return app;
}

async function start() {
  const demo = process.argv.includes('--demo');
  const production = process.argv.includes('--production');
  const clerkConfig = loadClerkConfig(process.env, { demo });
  const clerk = clerkConfig ? createClerkAuth(clerkConfig) : undefined;
  const host = (demo ? undefined : process.env.HOST) || '127.0.0.1';
  const port = Number(process.env.PORT || 4173);
  const origin = demo ? undefined : process.env.PH_ORIGIN;
  if (!production && !localHosts.has(host)) {
    throw new Error('Bind the development server to localhost.');
  }
  if (!localHosts.has(host) && !origin?.startsWith('https://')) {
    throw new Error('Configure an HTTPS PH_ORIGIN before serving Public Horses outside localhost.');
  }
  if (origin && URL.parse(origin)?.origin !== origin) {
    throw new Error('PH_ORIGIN must contain the scheme, host, and optional port.');
  }
  const path = databasePath(demo);
  mkdirSync(dirname(path), { recursive: true });
  const store = createStore(path);
  if (demo) seedDemo(store);
  const app = createApp({ store, demo, origin, production, clerk });
  const server = createServer(app);
  if (production) {
    const dist = resolve(root, 'dist');
    app.use(express.static(dist, { index: false }));
    app.get('/{*route}', (req, res) => {
      if (req.path.includes('.') || !req.accepts('html')) return res.sendStatus(404);
      res.sendFile(resolve(dist, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root,
      appType: 'spa',
      server: {
        middlewareMode: true,
        hmr: { server },
        fs: {
          allow: [root],
          deny: [
            '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
            '**/.data/**', '**/*.sqlite', '**/*.sqlite-*',
          ],
        },
      },
    });
    app.use(vite.middlewares);
  }
  server.listen(port, host, () => {
    console.log(`Public Horses${demo ? ' demo' : ''} at http://${host}:${server.address().port}`);
  });
  server.on('close', () => store.close());
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  start().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
