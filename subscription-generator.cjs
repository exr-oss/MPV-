/**
 * subscription-generator.cjs
 * FINAL — GitHub side
 * Input: Cloudflare Worker /export/json
 * Output: Base64 subscription for NekoBox
 * Single-file architecture
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector-b.zenyamail88.workers.dev/export/json";

/* ===== POLICY ===== */

// Целевые страны (если country отсутствует — разрешаем)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "SE", "PL", "CZ"];

// Допустимые протоколы (если это URI)
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic",
];

// Пороги качества источника
const MAX_LATENCY = 900; // ms
const MIN_SCORE = 70;

/* ===== HELPERS ===== */

function textOf(n) {
  return `${n.country || ""} ${n.tag || ""} ${n.url || ""} ${n.uri || ""}`.toLowerCase();
}

function extractEndpoint(n) {
  if (typeof n.uri === "string" && n.uri.includes("://")) return n.uri;
  if (typeof n.url === "string" && n.url.startsWith("http")) return n.url;
  return null;
}

/* ===== FILTERS ===== */

function protocolAllowed(endpoint) {
  if (!endpoint.includes("://")) return true; // URL → пропускаем
  return ALLOWED_PROTOCOLS.some(p => endpoint.startsWith(p + "://"));
}

function countryAllowed(n) {
  if (!n.country) return true;
  return ALLOWED_COUNTRIES.includes(n.country.toUpperCase());
}

function qualityAllowed(n) {
  if (typeof n.latency === "number" && n.latency > MAX_LATENCY) return false;
  if (typeof n.score === "number" && n.score < MIN_SCORE) return false;
  return true;
}

/* ===== SERVICE HEURISTICS ===== */

function netflixAllowed(n) {
  const t = textOf(n);
  return (
    !t.includes("trial") &&
    !t.includes("free") &&
    !t.includes("edu")
  );
}

function chatgptAllowed(n) {
  const t = textOf(n);
  return (
    !t.includes("cdn") &&
    !t.includes("cloudflare")
  );
}

function robloxAllowed(n) {
  if (typeof n.latency === "number" && n.latency > 350) return false;
  const t = textOf(n);
  return (
    !t.includes("cdn") &&
    !t.includes("cloudflare")
  );
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format");

  const accepted = [];

  for (const n of json.items) {
    const ep = extractEndpoint(n);
    if (!ep) continue;
    if (!protocolAllowed(ep)) continue;
    if (!countryAllowed(n)) continue;
    if (!qualityAllowed(n)) continue;
    if (!(netflixAllowed(n) || chatgptAllowed(n) || robloxAllowed(n))) continue;
    accepted.push(ep);
  }

  console.log(`✔ Accepted: ${accepted.length}`);

  const outDir = path.join(process.cwd(), "dist");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  if (accepted.length === 0) {
    console.warn("⚠ NO_URL — empty result");
    fs.writeFileSync(outFile, "", "utf8");
    return;
  }

  const base64 = Buffer.from(accepted.join("\n"), "utf8").toString("base64");
  fs.writeFileSync(outFile, base64, "utf8");

  console.log("✔ Written:", outFile);
}

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
