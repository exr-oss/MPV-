/**
 * subscription-generator.cjs
 * Aggressive Netflix + ChatGPT + Roblox filter
 * Output: Base64 subscription for NekoBox
 */

const fs = require("fs");
const path = require("path");

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== HARD FILTER CONFIG ===== */

const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "SE", "PL", "CZ"];

const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "tuic",
  "shadowsocks",
];

const MAX_LATENCY = 450; // general cap
const MAX_LOSS = 0.05;   // 5%

/* ===== HELPERS ===== */

function textOf(n) {
  return `${n.country || ""} ${n.tag || ""} ${n.uri || ""}`.toLowerCase();
}

function protocolAllowed(n) {
  return (
    typeof n.uri === "string" &&
    ALLOWED_PROTOCOLS.some(p => n.uri.startsWith(p + "://"))
  );
}

function countryAllowed(n) {
  const t = textOf(n).toUpperCase();
  return ALLOWED_COUNTRIES.some(c => t.includes(c));
}

function qualityAllowed(n) {
  if (typeof n.latency === "number" && n.latency > MAX_LATENCY) return false;
  if (typeof n.loss === "number" && n.loss > MAX_LOSS) return false;
  return true;
}

/* ===== SERVICE FILTERS ===== */

function netflixAllowed(n) {
  const t = textOf(n);
  return (
    t.includes("netflix") ||
    t.includes("nf") ||
    t.includes("stream") ||
    t.includes("residential")
  );
}

function chatgptAllowed(n) {
  const t = textOf(n);
  return (
    !t.includes("free") &&
    !t.includes("trial") &&
    !t.includes("iran") &&
    !t.includes("ru") &&
    !t.includes("cn") &&
    !t.includes("cdn")
  );
}

function robloxAllowed(n) {
  const t = textOf(n);

  // exclusions first
  if (
    t.includes("cdn") ||
    t.includes("ws") ||
    t.includes("grpc") ||
    t.includes("cloudflare") ||
    t.includes("cf")
  ) return false;

  // latency tighter for games
  if (typeof n.latency === "number" && n.latency > 250) return false;

  return (
    t.includes("roblox") ||
    t.includes("game") ||
    t.includes("gaming") ||
    t.includes("udp") ||
    t.includes("direct") ||
    t.includes("low")
  );
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error("Worker fetch failed");

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format");

  const nodes = json.items;

  const filtered = nodes.filter(n =>
    n &&
    typeof n.uri === "string" &&
    protocolAllowed(n) &&
    countryAllowed(n) &&
    qualityAllowed(n) &&
    (netflixAllowed(n) || chatgptAllowed(n) || robloxAllowed(n))
  );

  console.log(`✔ Nodes: ${nodes.length} → ${filtered.length}`);

  const output =
    filtered.length === 0
      ? "NO_URL"
      : Buffer.from(filtered.map(n => n.uri).join("\n")).toString("base64");

  const outDir = path.join(process.cwd(), "dist");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "subscription.txt"), output);

  console.log("✔ Written dist/subscription.txt");
}

run().catch(e => {
  console.error("✖ ERROR:", e.message);
  process.exit(1);
});
