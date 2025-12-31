// parse_nodes.js
// input:  work/gold.json
// output: work/nodes.json

import fs from "fs";

const INPUT = "work/gold.json";
const OUTPUT = "work/nodes.json";

const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "hy2",
  "shadowsocks",
  "ss",
  "tuic",
];

const ALLOWED_COUNTRIES = [
  "DE",
  "FI",
  "NL",
  "PL",
  "CZ",
  "EE",
  "JP",
];

function detectProtocol(line) {
  const l = line.toLowerCase();
  return ALLOWED_PROTOCOLS.find(p => l.startsWith(p + "://")) || null;
}

function detectCountry(line) {
  const upper = line.toUpperCase();
  return ALLOWED_COUNTRIES.find(c => upper.includes(c)) || null;
}

const gold = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const nodes = [];
let id = 0;

for (const item of gold.items || []) {
  if (!item.text) continue;

  const lines = item.text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const protocol = detectProtocol(line);
    if (!protocol) continue;

    const country = detectCountry(line);
    if (!country) continue;

    nodes.push({
      id: ++id,
      protocol,
      country,
      source: item.source || "unknown",
      raw: line,
    });
  }
}

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      total: nodes.length,
      nodes,
    },
    null,
    2
  )
);

console.log(`Parsed nodes: ${nodes.length}`);
