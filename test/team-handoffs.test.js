import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTeamHandoffs } from '../scripts/team-handoffs.js';

const readiness = 'readiness-reviewer';
const evidence = 'evidence-reviewer';
const creative = 'creative-director';
const operators = [
  'delegated-ceo', 'coo', 'cto', 'engineer', 'organizer-success',
  'community-outreach', 'partnerships', 'impact-and-learning',
];

function reviewStage(artifact, reviewers) {
  return {
    artifact,
    reviews: Object.fromEntries(reviewers.map((role) => [role, {
      reviewedBy: `test-${role}`,
      artifact,
      decision: 'pass',
      evidence: `fixture/${role}/${artifact}`,
    }])),
  };
}

function recordFixture() {
  const handoffs = {};
  for (const role of [...operators, readiness, evidence, creative]) {
    const reviewers = [readiness, evidence].filter((reviewer) => reviewer !== role);
    if (role === 'community-outreach') reviewers.push(creative);
    const documentation = reviewStage(`${role}/plan-v1`, reviewers);
    handoffs[role] = {
      preparedBy: `test-${role}`,
      documentation,
      synthetic: {
        ...reviewStage(`${role}/run-v1`, reviewers),
        documentation: documentation.artifact,
        cases: [
          {
            id: 'current',
            user: 'Sample supporter',
            kind: 'normal',
            expected: 'Open the request',
            observed: 'Request opened',
            result: 'pass',
          },
          {
            id: 'expired',
            user: 'Sample guest',
            kind: 'exception',
            expected: 'Hide expired request',
            observed: 'Request hidden',
            result: 'pass',
          },
        ],
      },
    };
  }
  return { version: 1, rehearsalId: 'sample-nourishment', mode: 'testing', handoffs };
}

test('the team checker accepts two independently reviewed stages for all eleven roles', () => {
  assert.deepEqual(checkTeamHandoffs(recordFixture()), {
    rehearsalId: 'sample-nourishment', mode: 'testing', rehearsalReady: true, holds: [],
  });
});

test('the team checker holds stale plans, stale reviews, and missing creative review', () => {
  const record = recordFixture();
  const handoff = record.handoffs['community-outreach'];
  handoff.documentation.artifact = 'community-outreach/plan-v2';
  delete handoff.synthetic.reviews[creative];

  const result = checkTeamHandoffs(record);
  assert.equal(result.rehearsalReady, false);
  assert.equal(result.holds.filter((hold) => hold.phase === 'documentation').length, 3);
  assert.ok(result.holds.some((hold) => hold.review === creative && hold.reason === 'Required review missing.'));
  assert.ok(result.holds.some((hold) => hold.phase === 'synthetic' && hold.reason === 'Test the current document version.'));
});

test('a missing handoff, missing exception case, failed case, and reviewer hold block readiness', () => {
  const record = recordFixture();
  delete record.handoffs.cto;
  const stage = record.handoffs.engineer.synthetic;
  stage.cases = [{ ...stage.cases[0], observed: 'Link failed', result: 'fail' }];
  Object.assign(stage.reviews[readiness], { decision: 'hold', reason: 'Check the link.', nextOwner: 'partnerships' });

  assert.deepEqual(checkTeamHandoffs(record).holds, [
    { handoff: 'cto', owner: 'cto', reason: 'Handoff missing.' },
    { handoff: 'engineer', phase: 'synthetic', owner: 'partnerships', review: readiness, reason: 'Check the link.' },
    { handoff: 'engineer', phase: 'synthetic', owner: 'engineer', reason: 'Synthetic case failed: current.' },
    { handoff: 'engineer', phase: 'synthetic', owner: 'engineer', reason: 'Run a normal case and an exception case.' },
  ]);
});

test('the team checker rejects self-review and reuse of one reviewer in two roles', () => {
  const record = recordFixture();
  const stage = record.handoffs.engineer.documentation;
  stage.reviews[readiness].reviewedBy = record.handoffs.engineer.preparedBy;
  assert.throws(() => checkTeamHandoffs(record), /distinct IDs/);

  stage.reviews[readiness].reviewedBy = stage.reviews[evidence].reviewedBy;
  assert.throws(() => checkTeamHandoffs(record), /distinct IDs/);
});

test('the team checker rejects records for live work and repeated case IDs', () => {
  const record = recordFixture();
  assert.throws(() => checkTeamHandoffs({ ...record, mode: 'live' }), /testing record/);

  const cases = record.handoffs.coo.synthetic.cases;
  cases[1].id = cases[0].id;
  assert.throws(() => checkTeamHandoffs(record), /repeated synthetic case/);
});
