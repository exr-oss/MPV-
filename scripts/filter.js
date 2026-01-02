// scripts/filter.js
import fs from "fs";

const data = JSON.parse(fs.readFileSync("work/normalized.json"));

const filtered = data.filter(i => i.score >= 80);

fs.writeFileSync("work/filtered.json", JSON.stringify(filtered, null, 2));
