// normalize.js
// ======================================
// STATE_11 — NORMALIZE_START
//
// ВХОД:
//   raw/gold.json      ← отдаёт Worker (GOLD)
//
// ВЫХОД:
//   work/gold.json     ← нормализованные ноды
//
// Normalize выполняется ТОЛЬКО в GitHub
// Источник данных: work / raw (НЕ GitHub raw links)
// ======================================

import fs from "fs";

// --- ensure work dir exists ---
if (!fs.existsSync("work")) {
  fs.mkdirSync("work");
}

// --- CONFIG ---

// Приоритет протоколов (зафиксировано)
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hy2",
  "ss",
  "tuic"
];

// Разрешённые страны (маршруты + хабы)
const ALLOWED_COUNTRIES = [
  "DE", // Germany — Netflix / Roblox / ChatGPT
  "FI", // Finland — северный хаб
  "NL", // Netherlands — крупный VPN хаб
  "JP", // Japan — non-EU neutral
  "PL", // Poland
  "CZ", // Czechia
  "EE"  // Estonia
];

// --- LOAD INPUT ---

if (!fs.existsSync("raw/gold.json")) {
  console.error("❌ raw/gold.json not found");
  process.exit(1);
}

const gold = JSON.parse(
  fs.readFileSync("raw/gold.json", "utf8")
);

// --- NORMALIZE ---

const nodes = [];

for (const src of gold.items || []) {
  if (!src.text) continue;

  const lines = src.text.split("\n");

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    // protocol filter
    const proto = ALLOWED_PROTOCOLS.find(p =>
      l.toLowerCase().startsWith(p + "://")
    );
    if (!proto) continue;

    // country detect
    const country = extractCountry(l);
    if (country && !ALLOWED_COUNTRIES.includes(country)) continue;

    nodes.push({
      raw: l,
      protocol: proto,
      country: country || "UN",
      tier: "GOLD",
      source: "F0rc3Run",
      tag: "fax"
    });
  }
}

// --- SAVE OUTPUT ---

const output = {
  generated_at: new Date().toISOString(),
  source: "worker/gold.json",
  protocols: ALLOWED_PROTOCOLS,
  countries: ALLOWED_COUNTRIES,
  count: nodes.length,
  nodes
};

fs.writeFileSync(
  "work/gold.json",
  JSON.stringify(output, null, 2)
);

console.log(`✅ normalize complete`);
console.log(`📦 nodes: ${nodes.length}`);

// --- HELPERS ---

function extractCountry(str) {
  const m = str.match(/\b(DE|FI|NL|JP|PL|CZ|EE)\b/i);
  return m ? m[1].toUpperCase() : null;
}
