// scripts/score.js
import fs from "fs";

const data = JSON.parse(fs.readFileSync("work/filtered.json"));

const scored = data.map(i => ({
  ...i,
  tier: i.score >= 95 ? "DIAMOND" : "GOLD"
}));

fs.writeFileSync("work/scored.json", JSON.stringify(scored, null, 2));
