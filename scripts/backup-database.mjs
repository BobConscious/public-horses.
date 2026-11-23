import { chmod, link, mkdtemp, readdir, rmdir, stat, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';

async function saveBackup(sourcePath, destination) {
  const sourceInfo = await stat(sourcePath);
  if (!sourceInfo.isFile() || sourceInfo.size === 0) {
    throw new Error('Choose an existing SQLite database.');
  }

  const staging = await mkdtemp(join(dirname(destination), '.sqlite-backup-'));
  const snapshot = join(staging, 'snapshot.sqlite');
  try {
    const source = new DatabaseSync(sourcePath, { readOnly: true, timeout: 5000 });
    try {
      await backup(source, snapshot);
    } finally {
      source.close();
    }

    const copy = new DatabaseSync(snapshot);
    try {
      copy.exec('PRAGMA journal_mode = DELETE');
      const checks = copy.prepare('PRAGMA quick_check').all();
      if (checks.length !== 1 || checks[0].quick_check !== 'ok') {
        throw new Error('The backup did not pass the SQLite check.');
      }
    } finally {
      copy.close();
    }

    await chmod(snapshot, 0o600);
    await link(snapshot, destination);
  } finally {
    for (const name of await readdir(staging)) await unlink(join(staging, name));
    await rmdir(staging);
  }
}

try {
  const [source, destination, ...extra] = process.argv.slice(2);
  if (!source || !destination || extra.length) {
    throw new Error('Use node scripts/backup-database.mjs SOURCE DESTINATION.');
  }
  await saveBackup(resolve(source), resolve(destination));
  console.log('SQLite backup saved and checked.');
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'Choose a new backup destination.' : error.message);
  process.exitCode = 1;
}
