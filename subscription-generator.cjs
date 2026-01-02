/**
 * subscription-generator.cjs
 * FINAL APPLY VERSION
 * Aggressive service-aware generator for NekoBox
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

// приоритетные страны (fallback разрешён)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "SE", "PL", "CZ"];

// разрешённые протоколы
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic",
];

// базовые пороги
const MAX_LATENCY = 800; // ms
const MAX_LOSS = 0.2;    // 20%

/* ===== HELPERS ===== */

function textOf(n) {
  return `${n.country || ""} ${n.tag || ""} ${n.uri || ""}`.toLowerCase();
}

/* ===== FILTERS ===== */

function protocolAllowed(n) {
  if (typeof n.uri !== "string") return false;
  return ALLOWED_PROTOCOLS.some(p => n.uri.startsWith(p + "://"));
}

// КРИТИЧНО: если страны нет — пропускаем
function countryAllowed(n) {
  if (!n.country) return true;
  return ALLOWED_COUNTRIES.includes(n.country.toUpperCase());
}

function qualityAllowed(n) {
  if (typeof n.latency === "number" && n.latency > MAX_LATENCY) return false;
  if (typeof n.loss === "number" && n.loss > MAX_LOSS) return false;
  return true;
}

/* ===== SERVICE HEURISTICS ===== */

// Netflix — чистота + стабильность
function netflixAllowed(n) {
  if (typeof n.latency === "number" && n.latency > 500) return false;
  if (typeof n.loss === "number" && n.loss > 0.03) return false;

  const t = textOf(n);
  if (
    t.includes("cdn") ||
    t.includes("edu") ||
    t.includes("trial") ||
    t.includes("free")
  ) return false;

  return true;
}

// ChatGPT — чистый egress, без CDN/прокси-следов
function chatgptAllowed(n) {
  const t = textOf(n);
  if (
    t.includes("cdn") ||
    t.includes("cloudflare") ||
    t.includes("ws") ||
    t.includes("grpc")
  ) return false;

  if (typeof n.latency === "number" && n.latency > 600) return false;
  if (typeof n.loss === "number" && n.loss > 0.05) return false;

  return true;
}

// Roblox — игровая эвристика (НЕ по словам)
function robloxAllowed(n) {
  const t = textOf(n);

  // жёсткие исключения
  if (
    t.includes("cdn") ||
    t.includes("cloudflare") ||
    t.includes("ws") ||
    t.includes("grpc")
  ) return false;

  if (typeof n.latency === "number" && n.latency > 280) return false;
  if (typeof n.loss === "number" && n.loss > 0.02) return false;

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
    qualityAllowed(n) &&
    (
      netflixAllowed(n) ||
      chatgptAllowed(n) ||
      robloxAllowed(n)
    )
  );

  console.log(`✔ Nodes: ${nodes.length} → ${filtered.length}`);

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  if (filtered.length === 0) {
    console.warn("⚠ NO_URL: no nodes passed aggressive filters");
    fs.writeFileSync(outFile, "", "utf8");
    return;
  }

  const plain = filtered.map(n => n.uri).join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  fs.writeFileSync(outFile, base64, "utf8");
  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
