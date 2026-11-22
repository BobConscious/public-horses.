import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { emailAddress, expectVersion, profileInput, projectInput, requireThat, supportInput, text } from './validation.js';

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const demoOrganizer = 'demo-organizer';
const demoReviewer = 'demo-reviewer';
const fieldArt = { nourishment: 'pantry', livelihood: 'tools', happiness: 'reading' };
const profileDetails = `SELECT p.id, p.slug, p.kind, p.demo, v.version, v.name, v.bio, v.location, v.website_url
  FROM profiles p JOIN profile_revisions v ON v.profile_id = p.id`;

function userView(row) {
  return row ? { id: row.id, name: row.name, email: row.email, reviewer: Boolean(row.reviewer) } : null;
}

function checkClerkIdentity(issuer, subject) {
  const url = typeof issuer === 'string' && issuer.length <= 256 ? URL.parse(issuer) : null;
  requireThat(url?.protocol === 'https:' && url.origin === issuer, 400, 'Invalid Clerk issuer.');
  requireThat(typeof subject === 'string' && /^user_[A-Za-z0-9_-]{1,128}$/u.test(subject), 400,
    'Invalid Clerk user ID.');
}

function seedView(row) {
  return {
    id: row.id, projectTitle: row.project_title, intention: row.intention, note: row.note, type: row.type,
    createdAt: row.created_at, plantedAt: row.planted_at, wateredAt: row.watered_at,
    waters: row.waters, plot: row.plot, harvestedAt: row.harvested_at,
  };
}

function profileView(row) {
  return {
    id: row.id, slug: row.slug, kind: row.kind, name: row.name, bio: row.bio, location: row.location,
    websiteUrl: row.website_url, version: row.version, demo: Boolean(row.demo),
  };
}

function resourceSlug(title, id, fallback) {
  const stem = title.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').slice(0, 64).replace(/^-|-$/gu, '');
  return (stem || fallback) + '-' + id.slice(0, 8);
}

export function createStore(dbPath, { clock = Date.now } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');

  const get = (sql, ...values) => db.prepare(sql).get(...values);
  const all = (sql, ...values) => db.prepare(sql).all(...values);
  const run = (sql, ...values) => db.prepare(sql).run(...values);
  const now = () => new Date(clock()).toISOString();
  const today = () => now().slice(0, 10);
  const byId = (id) => get('SELECT * FROM projects WHERE id = ?', id);
  const projectLink = (id) => get('SELECT * FROM project_profiles WHERE project_id = ?', id);
  const seedById = (id) => get('SELECT * FROM seeds WHERE id = ?', id);
  const isOpen = (row, on) => row.status === 'published' && row.ends_at >= on;
  const clerkMemberRow = (issuer, subject) => get(`SELECT m.* FROM members m
    JOIN member_identities i ON m.id = i.member_id WHERE i.issuer = ? AND i.subject = ?`, issuer, subject);

  function transaction(action) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function currentProfile(id) {
    return get(`${profileDetails} WHERE p.id = ? ORDER BY v.version DESC LIMIT 1`, id);
  }

  function ownedProfile(id, owner) {
    const profile = get(`${profileDetails} WHERE p.id = ? AND p.owner_id = ? AND p.demo = 0
      ORDER BY v.version DESC LIMIT 1`, id, owner);
    requireThat(profile, 404, 'Profile not found.');
    return profile;
  }

  function insertProfileRevision(id, version, data) {
    run(`INSERT INTO profile_revisions(profile_id, version, name, bio, location, website_url)
      VALUES(?, ?, ?, ?, ?, ?)`, id, version, data.name, data.bio, data.location, data.websiteUrl);
    return currentProfile(id);
  }

  function insertProfile(owner, data, { demo = 0, legacyName = null } = {}) {
    if (data.kind === 'person') {
      requireThat(!get("SELECT 1 FROM profiles WHERE owner_id = ? AND kind = 'person'", owner), 409,
        'This account already has a person profile.');
    }
    const id = demo
      ? createHash('sha256').update(JSON.stringify([owner, legacyName])).digest('hex')
      : randomUUID();
    run('INSERT INTO profiles(id, slug, owner_id, kind, demo, legacy_name) VALUES(?, ?, ?, ?, ?, ?)',
      id, resourceSlug(data.name, id, 'profile'), owner, data.kind, demo, legacyName);
    return insertProfileRevision(id, 1, data);
  }

  function legacyProfile(owner, name, demo = 0) {
    const existing = get(`SELECT id FROM profiles WHERE owner_id = ? AND demo = ? AND legacy_name = ?`,
      owner, demo, name);
    return existing ? currentProfile(existing.id) : insertProfile(owner, {
      kind: 'organization', name, bio: '', location: '', websiteUrl: '',
    }, { demo, legacyName: name });
  }

  function demoProfile(input, organization) {
    if (!input) return legacyProfile(demoOrganizer, organization, 1);
    const data = profileInput(input);
    const legacyName = data.kind === 'person' ? 'seed:person' : `seed:organization:${data.name}`;
    const existing = get('SELECT id FROM profiles WHERE owner_id = ? AND demo = 1 AND legacy_name = ?',
      demoOrganizer, legacyName);
    if (!existing) return insertProfile(demoOrganizer, data, { demo: 1, legacyName });
    const current = currentProfile(existing.id);
    const view = profileView(current);
    return Object.keys(data).every((key) => view[key] === data[key])
      ? current
      : insertProfileRevision(current.id, current.version + 1, data);
  }

  function selectProjectProfile(owner, data, row) {
    if (data.profileId !== undefined) return ownedProfile(data.profileId, owner);
    if (row) {
      const linked = ownedProfile(projectLink(row.id).profile_id, owner);
      if (!data.organization || data.organization === row.organization || data.organization === linked.name) {
        return linked;
      }
    }
    requireThat(data.organization, 400, 'Choose a person or organization profile.');
    return legacyProfile(owner, data.organization);
  }

  function setProjectProfile(projectId, owner, profile, listingType = 'project', schedule = '') {
    run(`INSERT INTO project_profiles(project_id, owner_id, profile_id, profile_version, listing_type, schedule)
      VALUES(?, ?, ?, ?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET
      profile_id = excluded.profile_id, profile_version = excluded.profile_version,
      listing_type = excluded.listing_type, schedule = excluded.schedule`,
    projectId, owner, profile.id, profile.version, listingType, schedule);
  }

  function projectView(row, on, internal = false) {
    const needs = all('SELECT type, detail, url FROM needs WHERE project_id = ? ORDER BY rowid', row.id);
    const open = isOpen(row, on);
    const link = projectLink(row.id);
    const editable = internal && (row.status === 'draft' || row.status === 'changes_requested');
    const profile = profileView(editable ? currentProfile(link.profile_id) :
      get(`${profileDetails} WHERE p.id = ? AND v.version = ?`, link.profile_id, link.profile_version));
    const view = {
      id: row.id, slug: row.slug, title: row.title, organization: profile.name, profile, location: row.location,
      summary: row.summary, story: row.story, field: row.field, endsAt: row.ends_at, listingType: link.listing_type,
      schedule: link.schedule,
      needs: needs.map(({ type, detail, url }) => ({ type, detail, url: open || internal ? url : null })),
      open, art: row.art, demo: Boolean(row.demo),
    };
    if (!internal) return view;
    const review = get('SELECT note FROM reviews WHERE project_id = ? ORDER BY version DESC LIMIT 1', row.id);
    return { ...view, status: row.status, version: row.version, proofUrl: row.proof_url, reviewNote: review?.note ?? '' };
  }

  function ownedProject(id, owner) {
    const row = get('SELECT * FROM projects WHERE id = ? AND owner_id = ?', id, owner);
    requireThat(row, 404, 'Project not found.');
    return row;
  }

  function replaceNeeds(id, needs) {
    run('DELETE FROM needs WHERE project_id = ?', id);
    for (const { type, detail, url } of needs) {
      run('INSERT INTO needs(project_id, type, detail, url) VALUES(?, ?, ?, ?)', id, type, detail, url);
    }
  }

  function insertProject(data, owner, profile, { id = randomUUID(), slug = resourceSlug(data.title, id, 'project'),
    status = 'draft', version = 1, art = fieldArt[data.field] ?? '', demo = 0 } = {}) {
    const stamp = now();
    run(`INSERT INTO projects(id, slug, owner_id, title, organization, location, summary, story, field, ends_at,
          proof_url, status, version, art, demo, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, slug, owner, data.title,
    profile.name, data.location, data.summary, data.story, data.field, data.endsAt, data.proofUrl,
    status, version, art, demo, stamp, stamp);
    setProjectProfile(id, owner, profile, data.listingType, data.schedule);
    replaceNeeds(id, data.needs);
    return projectView(byId(id), stamp.slice(0, 10), true);
  }

  function ownedSeed(id, member) {
    const seed = get('SELECT * FROM seeds WHERE id = ? AND member_id = ?', id, member);
    requireThat(seed, 404, 'Seed not found.');
    return seed;
  }

  function changeSeed(member, id, change) {
    return transaction(() => {
      const seed = ownedSeed(id, member);
      change(seed);
      return seedView(seedById(id));
    });
  }

  try {
    transaction(() => {
      db.exec(schema);
      const legacy = all(`SELECT p.id, p.owner_id, p.organization, p.demo FROM projects p
        LEFT JOIN project_profiles l ON l.project_id = p.id WHERE l.project_id IS NULL
        ORDER BY p.created_at, p.id`);
      for (const project of legacy) {
        const profile = legacyProfile(project.owner_id, project.organization, project.demo);
        setProjectProfile(project.id, project.owner_id, profile);
      }
    });
  } catch (error) {
    db.close();
    throw error;
  }

  return {
    close() { db.close(); },
    accountCredentials(email) {
      return get('SELECT * FROM members WHERE email = ?', email);
    },
    createAccount(name, email, passwordHash) {
      return transaction(() => {
        requireThat(!get('SELECT 1 FROM members WHERE email = ?', email), 409,
          'An account already uses this email address.');
        const id = randomUUID();
        run('INSERT INTO members(id, name, email, password_hash) VALUES(?, ?, ?, ?)', id, name, email, passwordHash);
        return userView(get('SELECT * FROM members WHERE id = ?', id));
      });
    },
    clerkMember(issuer, subject) {
      checkClerkIdentity(issuer, subject);
      return userView(clerkMemberRow(issuer, subject));
    },
    provisionClerkMember({ issuer, subject, name, email }) {
      checkClerkIdentity(issuer, subject);
      return transaction(() => {
        const existing = clerkMemberRow(issuer, subject);
        if (existing) return userView(existing);
        const cleanName = text(name, 'Your name', 80);
        const cleanEmail = emailAddress(email);
        requireThat(!get('SELECT 1 FROM members WHERE email = ?', cleanEmail), 409,
          'This email already belongs to another Public Horses account.');
        const id = randomUUID();
        run('INSERT INTO members(id, name, email, password_hash) VALUES(?, ?, ?, ?)', id, cleanName, cleanEmail, 'disabled');
        run('INSERT INTO member_identities(issuer, subject, member_id) VALUES(?, ?, ?)', issuer, subject, id);
        return userView(get('SELECT * FROM members WHERE id = ?', id));
      });
    },
    setReviewer(address) {
      const email = emailAddress(address);
      const member = get('SELECT id FROM members WHERE email = ?', email);
      requireThat(member, 404, 'Create the account before assigning review access.');
      requireThat(!get('SELECT 1 FROM member_identities WHERE member_id = ?', member.id), 409,
        'Assign Clerk review access using the Clerk user ID.');
      run('UPDATE members SET reviewer = 1 WHERE id = ?', member.id);
      return userView(get('SELECT * FROM members WHERE email = ?', email));
    },
    setClerkReviewer(issuer, subject) {
      checkClerkIdentity(issuer, subject);
      const member = clerkMemberRow(issuer, subject);
      requireThat(member, 404, 'Sign in with Clerk before assigning review access.');
      run('UPDATE members SET reviewer = 1 WHERE id = ?', member.id);
      return userView(clerkMemberRow(issuer, subject));
    },
    startSession(member, tokenHash, lifetime) {
      const stamp = new Date(clock()).valueOf();
      transaction(() => {
        run('DELETE FROM sessions WHERE expires_at <= ?', stamp);
        run('INSERT INTO sessions(token_hash, member_id, expires_at) VALUES(?, ?, ?)',
          tokenHash, member, stamp + lifetime);
      });
    },
    sessionUser(tokenHash) {
      return userView(get(`SELECT m.* FROM members m JOIN sessions s ON s.member_id = m.id
        WHERE s.token_hash = ? AND s.expires_at > ?`, tokenHash, new Date(clock()).valueOf()));
    },
    endSession(tokenHash) {
      run('DELETE FROM sessions WHERE token_hash = ?', tokenHash);
    },
    listOwnedProfiles(owner) {
      return all(`${profileDetails} WHERE p.owner_id = ? AND p.demo = 0
        AND v.version = (SELECT MAX(latest.version) FROM profile_revisions latest WHERE latest.profile_id = p.id)
        ORDER BY p.kind DESC, v.name, p.id`, owner).map(profileView);
    },
    createProfile(owner, input) {
      const data = profileInput(input);
      return transaction(() => profileView(insertProfile(owner, data)));
    },
    updateProfile(owner, id, input) {
      return transaction(() => {
        const current = ownedProfile(id, owner);
        expectVersion(input.version, current, 'profile');
        const data = profileInput({ ...profileView(current), ...input }, current.kind);
        return profileView(insertProfileRevision(id, current.version + 1, data));
      });
    },
    getPublicProfile(slug, includeDemo = false) {
      const demo = Number(includeDemo);
      const row = get(`${profileDetails} WHERE p.slug = ? AND (p.demo = 0 OR ? = 1)
        AND EXISTS (
          SELECT 1 FROM project_profiles l JOIN projects j ON l.project_id = j.id
          WHERE l.profile_id = p.id AND l.profile_version = v.version
            AND j.status IN ('published', 'closed') AND (j.demo = 0 OR ? = 1)
        ) ORDER BY v.version DESC LIMIT 1`, slug, demo, demo);
      requireThat(row, 404, 'Profile not found.');
      const on = today();
      const projects = all(`SELECT j.* FROM projects j JOIN project_profiles l ON l.project_id = j.id
        WHERE l.profile_id = ? AND j.status = 'published' AND j.ends_at >= ?
          AND (j.demo = 0 OR ? = 1) ORDER BY j.demo, j.updated_at DESC, j.title, j.id`, row.id, on, demo);
      return { profile: profileView(row), projects: projects.map((project) => projectView(project, on)) };
    },
    listPublic(includeDemo = false) {
      const on = today();
      const rows = all(`SELECT * FROM projects WHERE status = 'published' AND ends_at >= ?
        AND (demo = 0 OR ? = 1) ORDER BY demo, updated_at DESC, title, id`, on, Number(includeDemo));
      return rows.map((row) => projectView(row, on));
    },
    getPublic(slug, includeDemo = false) {
      const row = get(`SELECT * FROM projects WHERE slug = ? AND status IN ('published', 'closed')
        AND (demo = 0 OR ? = 1)`, slug, Number(includeDemo));
      requireThat(row, 404, 'Project not found.');
      return projectView(row, today());
    },
    listOwned(owner) {
      const on = today();
      return all('SELECT * FROM projects WHERE owner_id = ? ORDER BY updated_at DESC, id', owner)
        .map((row) => projectView(row, on, true));
    },
    createProject(owner, input) {
      const data = projectInput(input, today());
      return transaction(() => insertProject(data, owner, selectProjectProfile(owner, data)));
    },
    updateProject(owner, id, input) {
      return transaction(() => {
        const row = ownedProject(id, owner);
        expectVersion(input.version, row);
        requireThat(row.status === 'draft' || row.status === 'changes_requested', 409,
          'Only a draft or a returned project can be edited.');
        const stamp = now();
        const on = stamp.slice(0, 10);
        const link = projectLink(id);
        const data = projectInput({ listingType: link.listing_type, schedule: link.schedule, ...input }, on);
        const profile = selectProjectProfile(owner, data, row);
        run(`UPDATE projects SET title = ?, organization = ?, location = ?, summary = ?, story = ?,
              field = ?, ends_at = ?, proof_url = ?, art = ?, updated_at = ?, version = version + 1 WHERE id = ?`,
        data.title, profile.name, data.location, data.summary, data.story, data.field, data.endsAt,
        data.proofUrl, fieldArt[data.field] ?? '', stamp, id);
        setProjectProfile(id, owner, profile, data.listingType, data.schedule);
        replaceNeeds(id, data.needs);
        return projectView(byId(id), on, true);
      });
    },
    submitProject(owner, id, version) {
      return transaction(() => {
        const row = ownedProject(id, owner);
        expectVersion(version, row);
        requireThat(row.status === 'draft' || row.status === 'changes_requested', 409,
          'Only a draft or a returned project can be submitted.');
        const stamp = now();
        const on = stamp.slice(0, 10);
        requireThat(row.ends_at >= on, 409, 'Update the end date before submitting this project.');
        const link = projectLink(id);
        const profile = ownedProfile(link.profile_id, owner);
        setProjectProfile(id, owner, profile, link.listing_type, link.schedule);
        run(`UPDATE projects SET organization = ?, status = 'submitted', version = version + 1,
          updated_at = ? WHERE id = ?`, profile.name, stamp, id);
        return projectView(byId(id), on, true);
      });
    },
    closeProject(owner, id, version) {
      return transaction(() => {
        const row = ownedProject(id, owner);
        expectVersion(version, row);
        requireThat(row.status === 'published', 409, 'Only a published project can be closed.');
        const stamp = now();
        run("UPDATE projects SET status = 'closed', version = version + 1, updated_at = ? WHERE id = ?", stamp, id);
        return projectView(byId(id), stamp.slice(0, 10), true);
      });
    },
    reviewQueue(reviewer) {
      const on = today();
      return all(`SELECT * FROM projects WHERE status = 'submitted' AND owner_id <> ?
        ORDER BY updated_at, id`, reviewer).map((row) => projectView(row, on, true));
    },
    reviewProject(reviewer, id, input) {
      const { version, decision } = input;
      requireThat(decision === 'publish' || decision === 'changes_requested', 400, 'Choose a review decision.');
      const note = text(input.note, 'Review note', 500, { optional: decision === 'publish' });
      return transaction(() => {
        const row = byId(id);
        requireThat(row && row.status === 'submitted', 404, 'Submitted project not found.');
        requireThat(row.owner_id !== reviewer, 403, 'Ask another reviewer to review your project.');
        expectVersion(version, row);
        const stamp = now();
        const on = stamp.slice(0, 10);
        requireThat(decision !== 'publish' || row.ends_at >= on, 409,
          'Ask the organizer to update the end date before publication.');
        run('INSERT INTO reviews(project_id, version, reviewer_id, decision, note, created_at) VALUES(?, ?, ?, ?, ?, ?)',
          id, version, reviewer, decision, note, stamp);
        run('UPDATE projects SET status = ?, version = version + 1, updated_at = ? WHERE id = ?',
          decision === 'publish' ? 'published' : 'changes_requested', stamp, id);
        return projectView(byId(id), on, true);
      });
    },
    recordSupport(member, input, includeDemo = false) {
      const data = supportInput(input);
      return transaction(() => {
        const prior = get('SELECT * FROM seeds WHERE member_id = ? AND request_id = ?', member, data.requestId);
        if (prior) {
          requireThat(prior.project_id === data.projectId && prior.type === data.type
            && prior.intention === data.intention && prior.note === data.note, 409,
          'This record already contains different details.');
          return seedView(prior);
        }
        const row = byId(data.projectId);
        const stamp = now();
        requireThat(row && (includeDemo || row.demo === 0) && isOpen(row, stamp.slice(0, 10)), 404,
          'This project is closed or unavailable.');
        requireThat(get('SELECT 1 FROM needs WHERE project_id = ? AND type = ?', data.projectId, data.type),
          400, 'Choose a support type listed for this project.');
        const id = randomUUID();
        run(`INSERT INTO seeds(id, member_id, request_id, project_id, project_title, type, intention, note, created_at)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, member, data.requestId, data.projectId, row.title,
        data.type, data.intention, data.note, stamp);
        return seedView(seedById(id));
      });
    },
    listSeeds(member) {
      return all('SELECT * FROM seeds WHERE member_id = ? ORDER BY created_at DESC, id', member).map(seedView);
    },
    plantSeed(member, id, plot) {
      requireThat(Number.isInteger(plot) && plot >= 1 && plot <= 12, 400, 'Choose a garden plot.');
      return changeSeed(member, id, (seed) => {
        if (seed.plot === plot) return;
        requireThat(!seed.planted_at, 409, 'This seed is already planted or harvested.');
        requireThat(!get('SELECT 1 FROM seeds WHERE member_id = ? AND plot = ?', member, plot), 409,
          'This plot already has a plant.');
        run('UPDATE seeds SET plot = ?, planted_at = ? WHERE id = ?', plot, now(), id);
      });
    },
    waterSeed(member, id) {
      return changeSeed(member, id, (seed) => {
        requireThat(seed.plot !== null, 409, 'Only a planted seed needs water.');
        const stamp = now();
        if (seed.watered_at?.slice(0, 10) === stamp.slice(0, 10)) return;
        requireThat(seed.waters < 3, 409, 'This plant is ready to harvest.');
        run('UPDATE seeds SET waters = waters + 1, watered_at = ? WHERE id = ?', stamp, id);
      });
    },
    harvestSeed(member, id) {
      return changeSeed(member, id, (seed) => {
        if (seed.harvested_at) return;
        requireThat(seed.plot !== null && seed.waters === 3, 409, 'The plant needs three days of care before harvest.');
        run('UPDATE seeds SET plot = NULL, harvested_at = ? WHERE id = ?', now(), id);
      });
    },
    addDemoProjects(projects) {
      transaction(() => {
        if (!get('SELECT 1 FROM members WHERE id = ?', demoOrganizer)) {
          run('INSERT INTO members(id, name, email, password_hash) VALUES(?, ?, ?, ?)', demoOrganizer,
            'Sample organizers', 'organizer@demo.invalid', 'disabled');
          run('INSERT INTO members(id, name, email, password_hash) VALUES(?, ?, ?, ?)', demoReviewer,
            'Sample review team', 'reviewer@demo.invalid', 'disabled');
        }
        for (const { id, slug, art, profile: inputProfile, ...input } of projects) {
          const existing = byId(id);
          if (existing && (existing.owner_id !== demoOrganizer || !existing.demo)) continue;
          const data = projectInput(input, today(), { demo: true });
          const profile = demoProfile(inputProfile, data.organization);
          if (existing) {
            setProjectProfile(id, demoOrganizer, profile, data.listingType, data.schedule);
            continue;
          }
          insertProject(data, demoOrganizer, profile, { id, slug, art, demo: 1, version: 3, status: 'published' });
          run('INSERT INTO reviews(project_id, version, reviewer_id, decision, note, created_at) VALUES(?, ?, ?, ?, ?, ?)',
            id, 2, demoReviewer, 'publish', 'Fictional request for the demo.', now());
        }
      });
    },
    demoEndDate() {
      const date = new Date(clock());
      date.setUTCDate(date.getUTCDate() + 60);
      return date.toISOString().slice(0, 10);
    },
  };
}
