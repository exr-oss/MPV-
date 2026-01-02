// scripts/apply_stickiness.js
import fs from "fs";

const data = JSON.parse(fs.readFileSync("work/scored.json"));

fs.writeFileSync("work/sticky.json", JSON.stringify(data, null, 2));
