// normalize.js
// вход: work/gold.json
// выход: work/nodes.json

import fs from "fs";

const ALLOWED_PROTOCOLS = ["vless", "trojan", "hy2", "ss", "tuic"];
const ALLOWED_COUNTRIES = ["DE", "FI", "NL", "PL", "CZ", "EE", "JP"];

const gold = JSON.parse(
  fs.readFileSync("work/gold.json", "utf-8")
);

const nodes = [];

for (const src of gold.items || []) {
  if (!src.text) continue;

  const lines = src.text.split("\n");

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    const proto = ALLOWED_PROTOCOLS.find(p => l.startsWith(p + "://"));
    if (!proto) continue;

    const country = extractCountry(l);
    if (country && !ALLOWED_COUNTRIES.includes(country)) continue;

    nodes.push({
      protocol: proto,
      raw: l,
      country: country || "UN",
      source: src.id,
      tag: `${proto}_${country || "UN"}`
    });
  }
}

fs.writeFileSync(
  "work/nodes.json",
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      total: nodes.length,
      nodes
    },
    null,
    2
  )
);

console.log("normalize OK:", nodes.length);

// ---- helpers ----
function extractCountry(s) {
  const m = s.match(/\b(DE|FI|NL|PL|CZ|EE|JP)\b/i);
  return m ? m[1].toUpperCase() : null;
}
