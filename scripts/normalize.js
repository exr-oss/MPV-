// scripts/normalize.js
import fs from "fs";

const raw = JSON.parse(fs.readFileSync("work/worker_raw.json"));

const normalized = raw.map(i => ({
  id: i.id,
  url: i.url,
  protocol: "subscription",
  score: i.score
}));

fs.writeFileSync("work/normalized.json", JSON.stringify(normalized, null, 2));
