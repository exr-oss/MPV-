// scripts/pull_worker.js
import fs from "fs";

const url = process.env.WORKER_URL || "https://collector.zenyamail88.workers.dev/export/json";

const res = await fetch(url);
if (!res.ok) throw new Error("worker fetch failed");

const json = await res.json();
if (!Array.isArray(json.items)) throw new Error("invalid worker format");

fs.writeFileSync("work/worker_raw.json", JSON.stringify(json.items, null, 2));
