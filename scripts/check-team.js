import { readFile } from 'node:fs/promises';
import { checkTeamHandoffs } from './team-handoffs.js';

try {
  const [filename, ...extra] = process.argv.slice(2);
  if (!filename || extra.length) throw new Error('Use npm run team:check -- rehearsal.json.');
  const record = JSON.parse((await readFile(filename, 'utf8')).replace(/^\uFEFF/, ''));
  const result = checkTeamHandoffs(record);
  console.log(JSON.stringify(result, null, 2));
  if (!result.rehearsalReady) process.exitCode = 2;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
