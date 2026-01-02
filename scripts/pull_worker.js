import fs from "fs";

const URL = "https://collector.zenyamail88.workers.dev/export/json";

const res = await fetch(URL);
if (!res.ok) throw new Error("worker fetch failed");

const data = await res.json();
if (!Array.isArray(data.items)) throw new Error("invalid worker format");

fs.mkdirSync("work", { recursive: true });
fs.writeFileSync("work/gold.json", JSON.stringify(data.items, null, 2));
