/**
 * subscription-generator.cjs
 * Final adaptive generator for NekoBox
 * Source: Cloudflare Worker /export/json
 * Node.js 18+, GitHub Actions ready
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== CONFIG ===== */

// Приоритетные страны (ISO, hostname, emoji — всё ловим)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "PL", "CZ", "SE"];

// Разрешённые протоколы (определяем по URI)
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic",
];

// Пороги качества (если метрик нет — пропускаем)
const MAX_LATENCY = 800; // ms
const MAX_LOSS = 0.2;    // 20%

/* ===== FILTERS ===== */

function countryAllowed(node) {
  const text = `${node.country || ""} ${node.tag || ""} ${node.uri || ""}`.toUpperCase();
  return ALLOWED_COUNTRIES.some(c => text.includes(c));
}

function protocolAllowed(node) {
  if (typeof node.uri !== "string") return false;
  return ALLOWED_PROTOCOLS.some(p => node.uri.startsWith(p + "://"));
}

function qualityAllowed(node) {
  if (typeof node.latency === "number" && node.latency > MAX_LATENCY)
    return false;
  if (typeof node.loss === "number" && node.loss > MAX_LOSS)
    return false;
  return true;
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format: expected { items: [] }");

  const nodes = json.items;

  const filtered = nodes.filter(n =>
    n &&
    typeof n.uri === "string" &&
    protocolAllowed(n) &&
    countryAllowed(n) &&
    qualityAllowed(n)
  );

  console.log(`✔ Nodes: ${nodes.length} → ${filtered.length}`);

  if (filtered.length === 0) {
    console.warn("⚠ WARNING: filter result is empty");
  }

  const plain = filtered.map(n => n.uri).join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");
  fs.writeFileSync(outFile, base64);

  console.log("✔ Done:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
