import { clerkMiddleware, createClerkClient, getAuth } from '@clerk/express';
import { parsePublishableKey } from '@clerk/shared/keys';
import { HttpError } from './validation.js';

const frontendHostname = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?$/i;
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const sessionOptions = { acceptsToken: 'session_token', treatPendingAsSignedOut: true };

export function loadClerkConfig(env, { demo = false } = {}) {
  if (demo || !env.PH_AUTH_MODE || env.PH_AUTH_MODE === 'local') return null;
  if (env.PH_AUTH_MODE !== 'clerk') throw new Error('Set PH_AUTH_MODE to local or clerk.');

  const origin = URL.parse(env.PH_ORIGIN ?? '');
  const local = origin && localHosts.has(origin.hostname);
  if (!origin || origin.origin !== env.PH_ORIGIN || !['http:', 'https:'].includes(origin.protocol)
    || (!local && origin.protocol !== 'https:')) {
    throw new Error('Set PH_ORIGIN to the exact Clerk application origin. Hosted origins require HTTPS.');
  }

  const publishableKey = env.CLERK_PUBLISHABLE_KEY?.trim() ?? '';
  const secretKey = env.CLERK_SECRET_KEY?.trim() ?? '';
  const parsed = parsePublishableKey(publishableKey);
  const stage = parsed?.instanceType === 'development' ? 'test' : 'live';
  if (!parsed || !frontendHostname.test(parsed.frontendApi) || !secretKey.startsWith('sk_' + stage + '_')
    || secretKey.length <= ('sk_' + stage + '_').length) {
    throw new Error('Set matching Clerk publishable and secret keys.');
  }
  return { origin: origin.origin, issuer: 'https://' + parsed.frontendApi, publishableKey, secretKey };
}

export async function resolveClerkMember(store, config, auth, getUser) {
  if (!auth.isAuthenticated) return null;
  const { iss, azp, sid, sub } = auth.sessionClaims ?? {};
  if (iss !== config.issuer || azp !== config.origin || sub !== auth.userId || typeof sub !== 'string'
    || typeof sid !== 'string' || sid !== auth.sessionId) {
    throw new HttpError(401, 'Sign in again to continue.');
  }

  const member = store.clerkMember(iss, sub);
  if (member) return member;

  let user;
  try {
    user = await getUser(sub);
  } catch (error) {
    if (error?.status === 404) throw new HttpError(401, 'Sign in again to continue.');
    throw new HttpError(503, 'Clerk could not load your account. Try again.');
  }
  const primary = user.primaryEmailAddress;
  if (user.id !== sub || user.banned || user.locked) {
    throw new HttpError(401, 'Sign in again to continue.');
  }
  if (primary?.verification?.status !== 'verified' || !primary.emailAddress) {
    throw new HttpError(403, 'Verify your primary email in Clerk to continue.');
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Member';
  return store.provisionClerkMember({
    issuer: iss, subject: sub, name: Array.from(name).slice(0, 80).join(''), email: primary.emailAddress,
  });
}

export function createClerkAuth(config) {
  const { origin, issuer, publishableKey, secretKey, jwtKey } = config;
  const canonical = new URL(origin);
  const client = createClerkClient({ publishableKey, secretKey, telemetry: { disabled: true } });
  const authenticate = clerkMiddleware({
    publishableKey, secretKey, jwtKey, authorizedParties: [origin], clerkClient: client,
  });
  return {
    publishableKey,
    frontendOrigin: issuer,
    middleware(req, res, next) {
      req.headers['x-forwarded-host'] = canonical.host;
      req.headers['x-forwarded-proto'] = canonical.protocol.slice(0, -1);
      req.headers['x-forwarded-port'] = canonical.port || (canonical.protocol === 'https:' ? '443' : '80');
      return authenticate(req, res, next);
    },
    async member(req, store) {
      const auth = getAuth(req, sessionOptions);
      const expectedSession = req.get('X-PH-Session');
      if (auth.isAuthenticated && expectedSession && expectedSession !== auth.sessionId) {
        throw new HttpError(409, 'Your sign-in changed. Refresh the page to continue.');
      }
      const member = await resolveClerkMember(store, config, auth, (userId) => client.users.getUser(userId));
      if (member) req.clerkSessionId = auth.sessionId;
      return member;
    },
  };
}

export function appContentSecurityPolicy(frontendOrigin) {
  const challenge = 'https://challenges.cloudflare.com';
  const protect = 'https://*.protect.clerk.com';
  const common = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'none'",
  ];
  const sources = frontendOrigin
    ? [
      `script-src 'self' ${frontendOrigin} ${challenge} ${protect}`,
      `connect-src 'self' ${frontendOrigin} ${protect}:* https://clerk-telemetry.com https://*.clerk-telemetry.com https://img.clerk.com`,
      `frame-src 'self' ${frontendOrigin} ${challenge} ${protect}`,
      "img-src 'self' data: https://img.clerk.com",
      "worker-src 'self' blob:",
    ]
    : ["img-src 'self' data:"];
  return [...common, ...sources].join('; ');
}
