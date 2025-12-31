// update_history.js
// INPUT : work/nodes.filtered.json
// STATE : history/nodes.json
// OUTPUT: history/nodes.json (updated)

import fs from "fs";

const INPUT = "work/nodes.filtered.json";
const HISTORY_FILE = "history/nodes.json";

const NOW = Date.now();
const MAX_MISS = 3;      // сколько раз можно "пропасть"
const STABLE_HITS = 3;   // сколько раз подряд нужно для STABLE

if (!fs.existsSync(INPUT)) {
  console.error("❌ nodes.filtered.json not found");
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
const history = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"))
  : {};

const seen = new Set();

/* ===== UPDATE SEEN NODES ===== */

for (const node of nodes) {
  const id = node.id || node.name;
  seen.add(id);

  if (!history[id]) {
    history[id] = {
      first_seen: NOW,
      last_seen: NOW,
      hits: 1,
      misses: 0,
      stable: false,
      country: node.country,
      type: node.type
    };
  } else {
    history[id].last_seen = NOW;
    history[id].hits += 1;
    history[id].misses = 0;
  }

  if (history[id].hits >= STABLE_HITS) {
    history[id].stable = true;
  }
}

/* ===== UPDATE MISSES ===== */

for (const id of Object.keys(history)) {
  if (!seen.has(id)) {
    history[id].misses += 1;
  }
}

/* ===== CLEAN DEAD ===== */

for (const [id, h] of Object.entries(history)) {
  if (h.misses >= MAX_MISS && !h.stable) {
    delete history[id];
  }
}

/* ===== SAVE ===== */

fs.mkdirSync("history", { recursive: true });
fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

console.log("✅ history updated:", HISTORY_FILE);
