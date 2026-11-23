import { seedDemo } from '../server/demo.js';
import { createApp } from '../server/index.js';
import { createStore } from '../server/store.js';

function createPreviewHandler() {
  const hostname = process.env.VERCEL_URL;
  if (process.env.VERCEL_ENV !== 'preview' || !hostname) {
    return (_req, res) => {
      res.statusCode = 404;
      res.end();
    };
  }

  const store = createStore(':memory:');
  seedDemo(store);
  return createApp({ store, demo: true, origin: `https://${hostname}`, production: true });
}

export default createPreviewHandler();
