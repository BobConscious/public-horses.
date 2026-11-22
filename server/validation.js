import { fields as fieldCatalog, supportKinds } from '../shared/catalog.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireThat(condition, status, message) {
  if (!condition) throw new HttpError(status, message);
}

export function text(value, label, limit, { optional = false } = {}) {
  if (optional && value === undefined) return '';
  requireThat(typeof value === 'string', 400, 'Enter ' + label + '.');
  const clean = value.trim();
  requireThat((optional || clean.length > 0) && clean.length <= limit, 400,
    label + ' must be ' + (optional ? 'at most ' : 'between 1 and ') + limit + ' characters.');
  requireThat(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean), 400,
    label + ' contains an unsupported character.');
  return clean;
}

export function emailAddress(value) {
  const email = text(value, 'an email address', 254).toLowerCase();
  requireThat(/^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/u.test(email), 400, 'Enter a valid email address.');
  return email;
}

function httpsUrl(value, label, demo) {
  const raw = text(value, label, 1000);
  const url = URL.parse(raw);
  const hostname = url?.hostname.replace(/\.$/u, '') ?? '';
  requireThat(url?.protocol === 'https:' && !url.username && !url.password
    && /^https:\/\//iu.test(raw) && !/\s|\\/u.test(raw) && hostname.includes('.')
    && (demo || !/\.(?:invalid|localhost|local)$/iu.test(hostname)),
    400, 'Use a public HTTPS address for ' + label + '.');
  return url.href;
}

const fields = new Set(fieldCatalog.map(({ id }) => id));
const needTypes = new Set(supportKinds.map(({ id }) => id));

export function projectInput(input, today, { demo = false } = {}) {
  const { field, endsAt, needs } = input;
  requireThat(fields.has(field), 400, 'Choose a field.');
  requireThat(typeof endsAt === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(endsAt), 400,
    'Choose a valid end date.');
  const date = new Date(endsAt + 'T00:00:00.000Z');
  requireThat(Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === endsAt
    && endsAt >= today, 400, 'Choose an end date of today or later.');
  requireThat(Array.isArray(needs) && needs.length >= 1 && needs.length <= needTypes.size, 400,
    'Add at least one way to help.');
  const seen = new Set();
  return {
    title: text(input.title, 'Project title', 96),
    organization: text(input.organization, 'Organization', 96),
    location: text(input.location, 'Location', 96),
    summary: text(input.summary, 'Summary', 200),
    story: text(input.story, 'Story', 4000),
    field,
    endsAt,
    proofUrl: httpsUrl(input.proofUrl, 'the source for review', demo),
    needs: needs.map((need) => {
      requireThat(need && needTypes.has(need.type) && !seen.has(need.type), 400,
        'Use each support type once.');
      seen.add(need.type);
      return {
        type: need.type,
        detail: text(need.detail, 'Support details', 360),
        url: httpsUrl(need.url, 'the support link', demo),
      };
    }),
  };
}

export function supportInput(input) {
  const { type, intention, requestId } = input;
  requireThat(needTypes.has(type) && fields.has(intention), 400,
    'Choose a support type and intention.');
  requireThat(typeof requestId === 'string' && /^[a-z\d_-]{8,128}$/iu.test(requestId), 400,
    'Refresh the page and try recording your support again.');
  return { projectId: text(input.projectId, 'the project', 128), type, intention, requestId,
    note: text(input.note, 'Private note', 500, { optional: true }) };
}

export function expectVersion(version, row) {
  requireThat(Number.isSafeInteger(version) && version > 0, 400, 'Refresh to get the current project version.');
  requireThat(version === row.version, 409, 'This project changed. Refresh and review the current version.');
}
