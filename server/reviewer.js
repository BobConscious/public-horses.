import { existsSync } from 'node:fs';
import { loadClerkConfig } from './clerk.js';
import { databasePath } from './index.js';
import { createStore } from './store.js';

const args = process.argv.slice(2);
const member = args.find((arg) => !arg.startsWith('--'));
const demo = args.includes('--demo');
const clerk = args.includes('--clerk');
try {
  if (!member || (demo && clerk) || args.length !== (demo || clerk ? 2 : 1)) {
    throw new Error('Use npm run reviewer -- [--demo] member@example.org or npm run reviewer -- --clerk user_ID.');
  }
  const clerkConfig = loadClerkConfig(process.env, { demo });
  if (Boolean(clerkConfig) !== clerk) {
    throw new Error('Use --clerk with a Clerk user ID when PH_AUTH_MODE is clerk.');
  }
  const path = databasePath(demo);
  if (!existsSync(path)) throw new Error('Start the app and create the account first.');
  const store = createStore(path);
  try {
    const user = clerk ? store.setClerkReviewer(clerkConfig.issuer, member) : store.setReviewer(member);
    console.log(`Reviewer access granted for ${user.email}.`);
  } finally {
    store.close();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
