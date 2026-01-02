/**
 * subscription-generator.cjs
 * PASS-THROUGH generator for NekoBox
 * Worker provides SUBSCRIPTION URLS (not proxy nodes)
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format: expected { items: [] }");

  const items = json.items;

  const urls = items
    .filter(i => i.type === "subscription" && typeof i.url === "string")
    .map(i => i.url);

  console.log(`✔ Subscriptions: ${items.length} → ${urls.length}`);

  let outputText;
  if (urls.length === 0) {
    outputText = `no url\n# updated: ${new Date().toISOString()}`;
  } else {
    outputText = urls.join("\n");
  }

  const base64 = Buffer.from(outputText, "utf8").toString("base64");

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");
  fs.writeFileSync(outFile, base64);

  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
