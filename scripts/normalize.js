import fs from "fs";

const raw = JSON.parse(fs.readFileSync("work/gold.json", "utf8"));

const nodes = [];

for (const src of raw) {
  nodes.push({
    source: src.id,
    url: src.url,
    protocol: "unknown",
    country: "unknown",
    raw: true
  });
}

fs.writeFileSync("work/nodes.normalized.json", JSON.stringify(nodes, null, 2));
