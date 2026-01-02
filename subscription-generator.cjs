/**
 * subscription-generator.cjs
 * Diagnostic version (countries disabled)
 * Target: prove worker payload → subscription pipeline
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== CONFIG ===== */

// ❗ Страны ОТКЛЮЧЕНЫ для диагностики
// const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "PL", "CZ", "SE"];

const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic",
];

const MAX_LATENCY = 800;
const MAX_LOSS = 0.2;

/* ===== FILTERS ===== */

function countryAllowed(_) {
  return true; // ⬅️ ВАЖНО: временно отключено
}

function protocolAllowed(node) {
  if (typeof node.uri !== "string") return false;
  return ALLOWED_PROTOCOLS.some(p =>
    node.uri.toLowerCase().startsWith(p + "://")
  );
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

  console.log("▶ Sample nodes (first 5):");
  console.log(nodes.slice(0, 5));

  const filtered = nodes.filter(n =>
    n &&
    typeof n.uri === "string" &&
    protocolAllowed(n) &&
    countryAllowed(n) &&
    qualityAllowed(n)
  );

  console.log(`✔ Nodes: ${nodes.length} → ${filtered.length}`);

  let outputText;
  if (filtered.length === 0) {
    console.warn("⚠ No nodes after filtering");
    outputText = "no url";
  } else {
    outputText = filtered.map(n => n.uri).join("\n");
  }

  const base64 = Buffer.from(outputText, "utf8").toString("base64");

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");
  fs.writeFileSync(outFile, base64);

  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
