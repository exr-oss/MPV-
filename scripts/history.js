// scripts/history.js
import fs from "fs";

const now = new Date().toISOString();
const data = JSON.parse(fs.readFileSync("work/sticky.json"));

let history = [];
if (fs.existsSync("work/history.json")) {
  history = JSON.parse(fs.readFileSync("work/history.json"));
}

history.push({ at: now, count: data.length });

fs.writeFileSync("work/history.json", JSON.stringify(history, null, 2));
