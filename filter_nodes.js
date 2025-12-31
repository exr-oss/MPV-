import fs from "fs";
import path from "path";

const INPUT = "work/nodes.json";
const OUTPUT = "work/nodes.filtered.json";

/* ---------- helpers ---------- */

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

/**
 * Универсальный экстрактор нод
 * Поддерживает:
 *  - []
 *  - { nodes: [] }
 *  - { data: [] }
 *  - { sourceA: [], sourceB: [] }
 */
function extractNodes(input) {
  if (Array.isArray(input)) return input;

  if (input && Array.isArray(input.nodes)) {
    return input.nodes;
  }

  if (input && Array.isArray(input.data)) {
    return input.data;
  }

  const collected = [];
  if (input && typeof input === "object") {
    for (const value of Object.values(input)) {
      if (Array.isArray(value)) {
        collected.push(...value);
      }
    }
  }

  return collected;
}

/* ---------- filtering ---------- */

function isAllowedCountry(node) {
  const cc = (node.country || node.cc || "").toUpperCase();
  return [
    "DE", // Germany
    "FI", // Finland
    "NL", // Netherlands
    "PL", // Poland
    "CZ", // Czechia
    "EE", // Estonia
    "JP"  // Japan
  ].includes(cc);
}

function isAllowedProtocol(node) {
  const p = (node.type || node.protocol || "").toLowerCase();
  return ["vless", "trojan", "hysteria2", "hy2", "ss", "tuic"].includes(p);
}

function filterNodes(nodes) {
  const out = [];

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    if (!isAllowedCountry(node)) continue;
    if (!isAllowedProtocol(node)) continue;

    out.push(node);
  }

  return out;
}

/* ---------- run ---------- */

console.log("▶ Loading:", INPUT);

const raw = loadJSON(INPUT);
const nodes = extractNodes(raw);

if (!Array.isArray(nodes)) {
  console.error("❌ nodes is not iterable after extraction");
  process.exit(1);
}

console.log(`ℹ Extracted nodes: ${nodes.length}`);

const filtered = filterNodes(nodes);

saveJSON(OUTPUT, filtered);

console.log(`✅ Filtered nodes saved: ${OUTPUT}`);
console.log(`✅ Final count: ${filtered.length}`);
