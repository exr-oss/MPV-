import fs from "fs";

const INPUT = "work/nodes.json";
const OUTPUT = "work/nodes.filtered.json";

// разрешённые протоколы (по приоритету)
const ALLOWED_PROTOCOLS = [
  "vless",
  "trojan",
  "hysteria2",
  "shadowsocks",
  "tuic"
];

// разрешённые страны
const ALLOWED_COUNTRIES = [
  "DE", "FI", "NL", // T1
  "JP",             // T2
  "PL", "CZ", "EE"  // extra
];

function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function filterNodes(nodes) {
  const result = [];

  for (const node of nodes) {
    // protocol
    if (!ALLOWED_PROTOCOLS.includes(node.protocol)) continue;

    // country
    if (!ALLOWED_COUNTRIES.includes(node.country)) continue;

    // source tag
    if (node.source === "F0rc3Run") {
      node.fax = true;
    }

    result.push(node);
  }

  return result;
}

// ---- RUN ----
if (!fs.existsSync(INPUT)) {
  console.error("❌ nodes.json not found");
  process.exit(1);
}

const nodes = loadJSON(INPUT);
const filtered = filterNodes(nodes);

saveJSON(OUTPUT, filtered);

console.log(`✅ Filtered nodes: ${filtered.length}`);
