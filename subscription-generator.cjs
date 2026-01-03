/**
 * subscription-generator.cjs
 * ONE FILE PIPELINE
 * Worker → normalize → subscription.txt (base64)
 */

const fs = require("fs");
const path = require("path");

/* ===== CONFIG ===== */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector-b.zenyamail88.workers.dev/export/json";

const ALLOWED_PROTOCOLS = [
  "vless://",
  "trojan://",
  "hysteria2://",
  "hy2://",
  "ss://",
  "tuic://",
];

/* ===== HELPERS ===== */

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

function decodeSubscription(text) {
  const t = text.trim();
  if (!t) return [];

  // base64 subscription
  if (!t.includes("://")) {
    try {
      return Buffer.from(t, "base64")
        .toString("utf8")
        .split("\n");
    } catch {
      return [];
    }
  }

  // plain text
  return t.split("\n");
}

/* ===== MAIN ===== */

async function run() {
  console.log("▶ Fetch worker:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Worker fetch failed: ${res.status}`);

  const json = await res.json();
  if (!json || !Array.isArray(json.items))
    throw new Error("Invalid worker format");

  const accepted = [];

  for (const src of json.items) {
    if (!src.url) continue;

    console.log("• Source:", src.tag || src.url);

    let text;
    try {
      text = await fetchText(src.url);
    } catch (e) {
      console.warn("  skip:", e.message);
      continue;
    }

    const lines = decodeSubscription(text);

    for (const line of lines) {
      const uri = line.trim();
      if (!uri.includes("://")) continue;
      if (!ALLOWED_PROTOCOLS.some(p => uri.startsWith(p))) continue;
      accepted.push(uri);
    }
  }

  console.log(`✔ Normalized nodes: ${accepted.length}`);

  const outDir = path.join(process.cwd(), "dist");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  if (accepted.length === 0) {
    console.warn("⚠ EMPTY RESULT");
    fs.writeFileSync(outFile, "", "utf8");
    return;
  }

  const plain = accepted.join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  fs.writeFileSync(outFile, base64, "utf8");

  console.log("✔ Written:", outFile);
}

/* ===== EXEC ===== */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
