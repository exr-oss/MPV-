import fs from "fs";

const WORKER_URL = "https://collector-b.zenyamail88.workers.dev/export/json";

const res = await fetch(WORKER_URL);
if (!res.ok) throw new Error("worker fetch failed");

const json = await res.json();
if (!json.items || !Array.isArray(json.items)) {
  throw new Error("invalid format");
}

const plain = json.items.join("\n");
const base64 = Buffer.from(plain, "utf8").toString("base64");

fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/subscription.txt", base64);

console.log("OK:", json.items.length);
