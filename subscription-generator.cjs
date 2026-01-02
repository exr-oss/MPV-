/**
 * subscription-generator.cjs
 * Variant 3 — relaxed mode (URL fallback)
 * Consumer: NekoBox
 * Node.js 18+, GitHub Actions ready
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== QUALITY LIMITS (KEEP) ===== */

const MAX_LATENCY = 1500; // ms
const MIN_SIZE = 50_000;  // bytes

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetching worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format: expected { items: [] }");

  const items = json.items;

  console.log("▶ Items received:", items.length);

  const accepted = items.filter(n => {
    if (!n || typeof n.url !== "string") return false;

    if (typeof n.latency === "number" && n.latency > MAX_LATENCY)
      return false;

    if (typeof n.size === "number" && n.size < MIN_SIZE)
      return false;

    return true;
  });

  console.log(`✔ Accepted: ${accepted.length}`);

  let output = "";

  if (accepted.length === 0) {
    console.warn("⚠ NO URL — no valid sources after filtering");
    output = "NO_URL\n";
  } else {
    output = accepted.map(n => n.url).join("\n");
  }

  const base64 = Buffer.from(output, "utf8").toString("base64");

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
