// apply_stickiness.js
// INPUT : work/nodes.filtered.json
// STATE : history/nodes.json
// OUTPUT: work/nodes.sticky.json

import fs from "fs";

const NODES_FILE = "work/nodes.filtered.json";
const HISTORY_FILE = "history/nodes.json";
const OUT = "work/nodes.sticky.json";

if (!fs.existsSync(NODES_FILE)) {
  console.error("❌ nodes.filtered.json not found");
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(NODES_FILE, "utf-8"));
const history = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"))
  : {};

for (const node of nodes) {
  const id = node.id || node.name;
  const h = history[id];

  node.stable = h?.stable === true;
  node.hits = h?.hits ?? 0;
  node.misses = h?.misses ?? 0;

  // Бонус за стабильность
  node._sticky_bonus = node.stable ? 100 : 0;
}

nodes.sort((a, b) =>
  (b._sticky_bonus + b.hits) - (a._sticky_bonus + a.hits)
);

fs.writeFileSync(OUT, JSON.stringify(nodes, null, 2));
console.log("✅ stickiness applied:", OUT);
