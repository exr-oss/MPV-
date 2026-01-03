/**
 * subscription-generator.cjs
 * FINAL ADAPTED VERSION
 *
 * Source: Cloudflare Worker (/export/json)
 * Output: Base64 subscription (NekoBox / v2rayNG compatible)
 *
 * Architecture:
 * Worker = execution / aggregation
 * GitHub = filtering / generation
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector-b.zenyamail88.workers.dev/export/json";

/* ===== CONFIG ===== */

// Разрешённые страны (если country отсутствует — допускаем)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "SE", "PL", "CZ"];

// Разрешённые протоколы (только для URI)
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic",
];

// Пороги качества (мягкие, fail-safe ниже)
const MAX_LATENCY = 900; // ms
const MIN_SCORE = 60;

/* ===== HELPERS ===== */

function textOf(n) {
  return `${n.country || ""} ${n.tag || ""} ${n.url || ""} ${n.uri || ""}`.toLowerCase();
}

// Извлечение конечной точки (URI или URL)
function extractEndpoint(n) {
  if (typeof n.uri === "string" && n.uri.includes("://")) return n.uri;
  if (typeof n.url === "string" && n.url.startsWith("http")) return n.url;
  return null;
}

/* ===== FILTERS ===== */

// Протокол — только если это URI
function protocolAllowed(endpoint) {
  if (!endpoint.includes("://")) return true; // URL пропускаем
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

/* ===== SERVICE HEURISTICS (SOFT) ===== */

function netflixAllowed(n) {
  const t = textOf(n);
  return !t.includes("trial") && !t.includes("free") && !t.includes("edu");
}

function chatgptAllowed(n) {
  const t = textOf(n);
  return !t.includes("cdn") && !t.includes("cloudflare");
}

function robloxAllowed(n) {
  if (typeof n.latency === "number" && n.latency > 350) return false;
  const t = textOf(n);
  return !t.includes("cdn") && !t.includes("cloudflare");
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items)) {
    throw new Error("Invalid worker response format (items[])");
  }

  const nodes = json.items;
  const accepted = [];

  for (const n of nodes) {
    const ep = extractEndpoint(n);
    if (!ep) continue;
    if (!protocolAllowed(ep)) continue;
    if (!countryAllowed(n)) continue;
    if (!qualityAllowed(n)) continue;

    // soft service gate (не жёсткий)
    if (
      !(
        netflixAllowed(n) ||
        chatgptAllowed(n) ||
        robloxAllowed(n)
      )
    ) continue;

    accepted.push(ep);
  }

  // FAIL-SAFE: если всё отфильтровали — берём хотя бы 1 лучший
  if (accepted.length === 0 && nodes.length > 0) {
    const fallback = extractEndpoint(nodes[0]);
    if (fallback) {
      console.warn("⚠ FAIL-SAFE: using single fallback endpoint");
      accepted.push(fallback);
    }
  }

  console.log(`✔ Nodes: ${nodes.length} → ${accepted.length}`);

  const outDir = path.join(process.cwd(), "dist");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  const plain = accepted.join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  fs.writeFileSync(outFile, base64, "utf8");

  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
