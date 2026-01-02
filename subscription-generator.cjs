/**
 * subscription-generator.cjs
 * FINAL Normalize v2
 *
 * Flow:
 * Worker (/export/json)
 *   → subscription URLs
 *   → fetch each subscription
 *   → decode base64 if needed
 *   → extract proxy URIs
 *   → deduplicate
 *   → output base64 for NekoBox
 *
 * Node.js 18+
 */

const fs = require("fs");
const path = require("path");

/* ===== SOURCE ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ===== SETTINGS ===== */

const ALLOWED_PROTOCOLS = [
  "vless://",
  "trojan://",
  "ss://",
  "hysteria2://",
  "hy2://",
  "tuic://",
];

/* ===== HELPERS ===== */

function looksLikeBase64(text) {
  return /^[A-Za-z0-9+/=\r\n]+$/.test(text.trim());
}

function extractUris(text) {
  const lines = text.split(/\r?\n/);
  return lines.filter(line =>
    ALLOWED_PROTOCOLS.some(p => line.startsWith(p))
  );
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetch worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format");

  const subs = json.items
    .filter(i => i.type === "subscription" && typeof i.url === "string")
    .map(i => i.url);

  console.log(`✔ Subscriptions: ${subs.length}`);

  let allNodes = [];

  for (const url of subs) {
    try {
      console.log("▶ Fetch sub:", url);
      const r = await fetch(url, { redirect: "follow" });
      if (!r.ok) continue;

      let text = await r.text();
      text = text.trim();

      // decode base64 if needed
      if (looksLikeBase64(text) && !text.includes("://")) {
        try {
          text = Buffer.from(text, "base64").toString("utf8");
        } catch {}
      }

      const nodes = extractUris(text);
      console.log(`  ↳ nodes: ${nodes.length}`);
      allNodes.push(...nodes);
    } catch (e) {
      console.warn("  ⚠ failed:", url);
    }
  }

  // deduplicate
  const uniqueNodes = Array.from(new Set(allNodes));

  console.log(`✔ Total nodes: ${uniqueNodes.length}`);

  let outputText;
  if (uniqueNodes.length === 0) {
    outputText = `no url\n# updated: ${new Date().toISOString()}`;
  } else {
    outputText = uniqueNodes.join("\n");
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
  console.error("✖ ERROR:", err);
  process.exit(1);
});
