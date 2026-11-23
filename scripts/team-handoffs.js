const readiness = 'readiness-reviewer';
const evidence = 'evidence-reviewer';
const creative = 'creative-director';
const coreReviews = [readiness, evidence];

const requiredReviews = {
  'delegated-ceo': coreReviews,
  coo: coreReviews,
  cto: coreReviews,
  engineer: coreReviews,
  'organizer-success': coreReviews,
  'community-outreach': [...coreReviews, creative],
  partnerships: coreReviews,
  'impact-and-learning': coreReviews,
  [readiness]: [evidence],
  [evidence]: [readiness],
  [creative]: coreReviews,
};

const reviewerRoles = new Set([readiness, evidence, creative]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value) {
  return typeof value === 'string' && value.length > 0 && value.trim() === value;
}

function assignActor(actors, id, role) {
  const assignment = reviewerRoles.has(role) ? role : 'operator';
  const prior = actors.get(id);
  if (prior && prior !== assignment) {
    throw new TypeError('Use distinct IDs for operators and each reviewer role.');
  }
  actors.set(id, assignment);
}

function checkReviews(stage, required, context, actors, holds) {
  if (Object.keys(stage.reviews).some((role) => !required.includes(role))) {
    throw new TypeError(`Unexpected reviewer for ${context.handoff}.`);
  }

  for (const role of required) {
    const review = stage.reviews[role];
    const check = { ...context, review: role, owner: role };
    if (review === undefined) {
      holds.push({ ...check, reason: 'Required review missing.' });
      continue;
    }
    if (!isRecord(review) || !isText(review.reviewedBy) || !isText(review.artifact) || !isText(review.evidence)
      || !['pass', 'hold'].includes(review.decision)) {
      throw new TypeError(`Review for ${context.handoff} needs a reviewer ID, version, evidence, and decision.`);
    }
    if (review.decision === 'hold'
      && (!isText(review.reason) || !isText(review.nextOwner) || !Object.hasOwn(requiredReviews, review.nextOwner))) {
      throw new TypeError('A hold needs a reason and the next team owner.');
    }
    assignActor(actors, review.reviewedBy, role);

    if (review.artifact !== stage.artifact) {
      holds.push({ ...check, reason: 'Review covers a different artifact version.' });
    } else if (review.decision === 'hold') {
      holds.push({ ...check, owner: review.nextOwner, reason: review.reason });
    }
  }
}

function checkCases(stage, documentation, context, holds) {
  if (!isText(stage.documentation) || !Array.isArray(stage.cases) || stage.artifact === documentation?.artifact) {
    throw new TypeError(`Synthetic tests for ${context.handoff} need a document reference, separate artifact, and cases.`);
  }
  if (stage.documentation !== documentation?.artifact) {
    holds.push({ ...context, reason: 'Test the current document version.' });
  }

  const ids = new Set();
  const kinds = new Set();
  for (const scenario of stage.cases) {
    if (!isRecord(scenario) || !isText(scenario.id) || ids.has(scenario.id) || !isText(scenario.user)
      || !isText(scenario.expected) || !isText(scenario.observed) || !['normal', 'exception'].includes(scenario.kind)
      || !['pass', 'fail'].includes(scenario.result)) {
      throw new TypeError(`Invalid or repeated synthetic case for ${context.handoff}.`);
    }
    ids.add(scenario.id);
    kinds.add(scenario.kind);
    if (scenario.result === 'fail') {
      holds.push({ ...context, reason: `Synthetic case failed: ${scenario.id}.` });
    }
  }
  if (kinds.size < 2) {
    holds.push({ ...context, reason: 'Run a normal case and an exception case.' });
  }
}

export function checkTeamHandoffs(record) {
  if (record?.version !== 1 || record.mode !== 'testing' || !isText(record.rehearsalId) || !isRecord(record.handoffs)) {
    throw new TypeError('Use a version 1 testing record with a rehearsal ID and handoffs.');
  }

  const actors = new Map();
  for (const [role, handoff] of Object.entries(record.handoffs)) {
    if (!Object.hasOwn(requiredReviews, role) || !isRecord(handoff) || !isText(handoff.preparedBy)) {
      throw new TypeError(`Invalid handoff for ${role}.`);
    }
    assignActor(actors, handoff.preparedBy, role);
  }

  const holds = [];
  for (const [role, reviewers] of Object.entries(requiredReviews)) {
    const handoff = record.handoffs[role];
    if (handoff === undefined) {
      holds.push({ handoff: role, owner: role, reason: 'Handoff missing.' });
      continue;
    }
    for (const phase of ['documentation', 'synthetic']) {
      const context = { handoff: role, phase, owner: role };
      const stage = handoff[phase];
      if (stage === undefined) {
        holds.push({ ...context, reason: 'Stage missing.' });
        continue;
      }
      if (!isRecord(stage) || !isText(stage.artifact) || !isRecord(stage.reviews)) {
        throw new TypeError(`Invalid ${phase} record for ${role}.`);
      }
      checkReviews(stage, reviewers, context, actors, holds);
      if (phase === 'synthetic') checkCases(stage, handoff.documentation, context, holds);
    }
  }

  return { rehearsalId: record.rehearsalId, mode: record.mode, rehearsalReady: holds.length === 0, holds };
}
