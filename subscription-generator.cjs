/**
 * subscription-generator.cjs
 * Strict server-only generator (RESTORED FILTERS)
 * Node.js 18+, GitHub Actions
 */

const fs = require("fs");
const path = require("path");

/* ================= SOURCE ================= */

const WORKER_URL =
  process.env.WORKER_URL ||
  "https://collector.zenyamail88.workers.dev/export/json";

/* ================= FILTERS ================= */

// допустимые страны (ищем в tag / country / uri)
const ALLOWED_COUNTRIES = ["DE", "NL", "FI", "PL", "CZ", "SE"];

// допустимые протоколы
const ALLOWED_PROTOCOLS = [
  "vless://",
  "trojan://",
  "hysteria2://",
  "ss://",
  "tuic://",
];

// hard sanity
const MIN_URI_LENGTH = 20;

/* ================= HELPERS ================= */

function isServerNode(n) {
  return (
    n &&
    typeof n.uri === "string" &&
    n.uri.length > MIN_URI_LENGTH &&
    ALLOWED_PROTOCOLS.some(p => n.uri.startsWith(p))
  );
}

function countryAllowed(n) {
  const text = `${n.country || ""} ${n.tag || ""} ${n.uri || ""}`.toUpperCase();
  return ALLOWED_COUNTRIES.some(c => text.includes(c));
}

/* ================= MAIN ================= */

async function run() {
  console.log("▶ Fetching:", WORKER_URL);

  const res = await fetch(WORKER_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const data = await res.json();
  if (!data || !Array.isArray(data.items))
    throw new Error("Invalid format: expected { items: [] }");

  const all = data.items;

  console.log("▶ Total items:", all.length);

  // 🔥 КЛЮЧЕВОЕ: берём ТОЛЬКО реальные серверы
  const servers = all.filter(isServerNode);

  console.log("▶ Server nodes:", servers.length);

  const filtered = servers.filter(countryAllowed);

  console.log(`✔ After country filter: ${filtered.length}`);

  const outDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "subscription.txt");

  if (filtered.length === 0) {
    console.warn("⚠ NO SERVER URLS");
    fs.writeFileSync(outFile, "NO_URL\n");
    return;
  }

  const plain = filtered.map(n => n.uri).join("\n");
  const base64 = Buffer.from(plain, "utf8").toString("base64");

  fs.writeFileSync(outFile, base64);

  console.log("✔ Written:", outFile);
}

/* ================= EXEC ================= */

run().catch(err => {
  console.error("✖ ERROR:", err.message);
  process.exit(1);
});
