import fs from "fs";

const src = JSON.parse(fs.readFileSync("data/gold_sources.json", "utf8"));

const out = src.items.map((x, i) => ({
  id: `${x.id}_${i}`,
  url: x.url,
  score: x.score,
  latency: x.latency,
  type: x.type
}));

fs.writeFileSync(
  "data/nodes_normalized.json",
  JSON.stringify({ generated_at: new Date().toISOString(), items: out }, null, 2)
);
