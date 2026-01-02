// subscription-generator.js
// Single-file generator for NekoBox
// Source: Cloudflare Worker /export/json

import fs from "fs";
import path from "path";

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== CONFIG ===== */

const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "PL", "CZ", "SE"];
const ALLOWED_PROTOCOLS = ["vless", "trojan", "hysteria2", "shadowsocks", "tuic"];

const MAX_LATENCY = 800; // ms
const MAX_LOSS = 0.2;    // 20%

/* ===== FILTERS ===== */

function countryAllowed(node) {
  const text = `${node.country || ""} ${node.tag || ""}`.toUpperCase();
  return ALLOWED_COUNTRIES.some(c => text.includes(c));
}

function protocolAllowed(node) {
  return ALLOWED_PROTOCOLS.includes((node.protocol || "").toLowerCase());
}

function qualityAllowed(node) {
  if (typeof node.latency === "number" && node.latency > MAX_LATENCY) return false;
  if (typeof node.loss === "number" && node.loss > MAX_LOSS) return false;
  return true;
}

/* ===== MAIN ===== */

async function main() {
  console.log("Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!Array.isArray(json.items))
    throw new Error("Invalid worker format: items[] missing");

  const nodes = json.items;

  const filtered = nodes.filter(
    n =>
      typeof n.uri === "string" &&
      protocolAllowed(n) &&
      countryAllowed(n) &&
      qualityAllowed(n)
  );

  console.log(`Nodes: ${nodes.length} → ${filtered.length}`);

  const content = filtered.map(n => n.uri).join("\n");
  const base64 = Buffer.from(content).toString("base64");

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "subscription.txt"), base64);
  console.log("OK → dist/subscription.txt");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
