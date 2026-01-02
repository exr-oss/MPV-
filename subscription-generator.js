// MODE: ARCHITECT // Single-file subscription generator // Source: Cloudflare Worker (JSON export) // Output: Base64 subscription for NekoBox // Auto-update ready (GitHub Actions compatible)

import fs from 'fs'; import https from 'https';

// ================= CONFIG ================= const WORKER_URL = 'https://YOUR_WORKER.workers.dev/export/json'; const OUTPUT_FILE = 'dist/subscription.txt';

// Allowed countries (ISO / keywords) const ALLOWED_COUNTRIES = ['DE', 'NL', 'FI', 'PL', 'CZ', 'FR'];

// Protocol priority const ALLOWED_PROTOCOLS = ['vless', 'trojan', 'hysteria2', 'shadowsocks', 'tuic'];

// Quality thresholds const MAX_LATENCY = 350; // ms const MAX_LOSS = 0.05;   // 5%

// ================= HELPERS ================= function fetchJSON(url) { return new Promise((resolve, reject) => { https.get(url, res => { let data = ''; res.on('data', chunk => (data += chunk)); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } }); }).on('error', reject); }); }

function countryAllowed(node) { const text = ${node.country || ''} ${node.tag || ''}.toUpperCase(); return ALLOWED_COUNTRIES.some(c => text.includes(c)); }

function protocolAllowed(node) { return ALLOWED_PROTOCOLS.includes(node.protocol); }

function qualityAllowed(node) { return node.latency <= MAX_LATENCY && node.loss <= MAX_LOSS; }

function toURI(node) { return node.uri; }

function toBase64(lines) { return Buffer.from(lines.join('\n')).toString('base64'); }

// ================= MAIN ================= (async () => { try { const data = await fetchJSON(WORKER_URL);

const nodes = data
  .filter(protocolAllowed)
  .filter(countryAllowed)
  .filter(qualityAllowed)
  .map(toURI);

const base64 = toBase64(nodes);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(OUTPUT_FILE, base64);

console.log(`OK: ${nodes.length} nodes written`);

} catch (e) { console.error('FAILED:', e.message); process.exit(1); } })();
