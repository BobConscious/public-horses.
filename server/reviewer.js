import { existsSync } from 'node:fs';
import { databasePath } from './index.js';
import { createStore } from './store.js';

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith('--'));
try {
  if (!email || args.length !== (args.includes('--demo') ? 2 : 1)) {
    throw new Error('Use npm run reviewer -- [--demo] member@example.org.');
  }
  const path = databasePath(args.includes('--demo'));
  if (!existsSync(path)) throw new Error('Start the app and create the account first.');
  const store = createStore(path);
  try {
    const user = store.setReviewer(email);
    console.log(`Reviewer access granted for ${user.email}.`);
  } finally {
    store.close();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
