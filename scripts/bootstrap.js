import fs from "fs";

const INPUT_PATH = "work/gold_raw.json";
const OUTPUT_PATH = "work/bootstrap.json";

function now() {
  return new Date().toISOString();
}

function loadRaw() {
  const rawText = fs.readFileSync(INPUT_PATH, "utf8").trim();

  try {
    return JSON.parse(rawText);
  } catch (e) {
    return { __invalid: true, rawText };
  }
}

function detectFormat(raw) {
  if (Array.isArray(raw)) return "run_array";

  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray(raw.items)
  ) {
    return "export_object";
  }

  return "unknown";
}

function normalizeSource(item) {
  return {
    id: item.id ?? null,
    type: item.type ?? "unknown",
    url: item.url ?? null,
    latency: item.latency ?? null,
    size: item.size ?? null,
    score: item.score ?? null
  };
}

function buildBootstrap(raw, format) {
  let sources = [];

  if (format === "run_array") {
    sources = raw.map(normalizeSource);
  }

  if (format === "export_object") {
    sources = raw.items.map(normalizeSource);
  }

  return {
    meta: {
      source: "cloudflare-worker",
      endpoint: "auto",
      detected_format: format,
      generated_at: now()
    },
    sources
  };
}

// ===== main =====

console.log("[bootstrap] loading raw");
const raw = loadRaw();

const format = detectFormat(raw);
console.log("[bootstrap] detected format:", format);

const bootstrap = buildBootstrap(raw, format);

fs.writeFileSync(
  OUTPUT_PATH,
  JSON.stringify(bootstrap, null, 2)
);

console.log(
  `[bootstrap] wrote ${OUTPUT_PATH} (${bootstrap.sources.length} sources)`
);
