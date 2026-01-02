/**
 * subscription-generator.cjs
 * FINAL — normalize subscriptions → servers → Nekobox
 * Node.js 18+, GitHub Actions safe
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== POLICY ===== */

// страны (ловим ISO / hostname / tag / emoji)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "PL", "CZ", "SE"];

// разрешённые протоколы
const ALLOWED_PROTOCOLS = [
  "vless://",
  "trojan://",
  "hysteria2://",
  "ss://",
  "tuic://",
];

// лимиты качества (если нет — не режем)
const MAX_LATENCY = 800;
const MAX_LOSS = 0.2;

/* ===== UTILS ===== */

function decodeBase64Safe(text) {
  try {
    return Buffer.from(text, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function countryAllowed(text) {
  const t = text.toUpperCase();
  return ALLOWED_COUNTRIES.some(c => t.includes(c));
}

function protocolAllowed(uri) {
  return ALLOWED_PROTOCOLS.some(p => uri.startsWith(p));
}

/* ===== NORMALIZE ===== */

async function fetchSubscription(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return [];

  const raw = await res.text();
  const decoded = decodeBase64Safe(raw);

  const text = decoded.includes("://") ? decoded : raw;

  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.includes("://"));
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error("Worker fetch failed");

  const json = await res.json();
  if (!Array.isArray(json.items))
    throw new Error("Invalid worker format");

  const subs = json.items
    .filter(i => i.type === "subscription" && i.url)
    .map(i => i.url);

  console.log("▶ Subscriptions:", subs.length);

  let servers = [];

  for (const url of subs) {
    try {
      const list = await fetchSubscription(url);
      servers.push(...list);
    } catch {}
  }

  servers = [...new Set(servers)];

  const filtered = servers.filter(uri => {
    if (!protocolAllowed(uri)) return false;
    if (!countryAllowed(uri)) return false;
    return true;
  });

  console.log(`✔ Servers: ${servers.length} → ${filtered.length}`);

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  if (filtered.length === 0) {
    fs.writeFileSync(outFile, "NO_URL\n");
    console.warn("⚠ NO_URL written");
    return;
  }

  const plain = filtered.join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  fs.writeFileSync(outFile, base64);
  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
