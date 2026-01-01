import fs from 'fs';
import path from 'path';
import https from 'https';

const WORK_DIR = 'work';
const OUT_FILE = path.join(WORK_DIR, 'gold.json');

const WORKER_URL = 'https://20cfead0c8b2090962bc60e2edc4cb48.workers.dev/gold';

if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

console.log('[pull_worker] Fetching:', WORKER_URL);

https.get(WORKER_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error('[pull_worker] Bad status:', res.statusCode);
    process.exit(1);
  }

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync(OUT_FILE, data);
    console.log('[pull_worker] Saved:', OUT_FILE);
  });
}).on('error', (err) => {
  console.error('[pull_worker] Error:', err);
  process.exit(1);
});
