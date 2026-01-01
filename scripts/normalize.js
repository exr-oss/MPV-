import fs from "fs";
import path from "path";
import crypto from "crypto";

const INPUT = "work/gold_raw.json";
const OUTPUT = "work/nodes.normalized.json";

const ALLOWED_PROTOCOLS = new Set([
  "vless",
  "trojan",
  "shadowsocks",
  "ss",
  "hysteria2",
  "hy2",
  "tuic",
]);

const ALLOWED_COUNTRIES = new Set([
  "DE", "FI", "NL", "PL", "CZ", "EE", "JP",
]);

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function guessCountry(str) {
  if (!str) return null;
  const up = str.toUpperCase();
  for (const c of ALLOWED_COUNTRIES) {
    if (up.includes(c)) return c;
  }
  return null;
}

function parseLine(line) {
  line = line.trim();
  if (!line) return null;

  // vless://uuid@host:port?...
  if (line.startsWith("vless://")) {
    const m = line.match(/^vless:\/\/([^@]+)@([^:]+):(\d+)/);
    if (!m) return null;
    return {
      protocol: "vless",
      uuid: m[1],
      host: m[2],
      port: Number(m[3]),
    };
  }

  // trojan://password@host:port
  if (line.startsWith("trojan://")) {
    const m = line.match(/^trojan:\/\/([^@]+)@([^:]+):(\d+)/);
    if (!m) return null;
    return {
      protocol: "trojan",
      password: m[1],
      host: m[2],
      port: Number(m[3]),
    };
  }

  // ss://method:pass@host:port
  if (line.startsWith("ss://") || line.startsWith("shadowsocks://")) {
    const m = line.match(/^(?:ss|shadowsocks):\/\/([^@]+)@([^:]+):(\d+)/);
    if (!m) return null;
    return {
      protocol: "ss",
      auth: m[1],
      host: m[2],
      port: Number(m[3]),
    };
  }

  // hysteria2://host:port?...
  if (line.startsWith("hysteria2://") || line.startsWith("hy2://")) {
    const m = line.match(/^(?:hysteria2|hy2):\/\/([^:]+):(\d+)/);
    if (!m) return null;
    return {
      protocol: "hy2",
      host: m[1],
      port: Number(m[2]),
    };
  }

  // tuic://uuid@host:port
  if (line.startsWith("tuic://")) {
    const m = line.match(/^tuic:\/\/([^@]+)@([^:]+):(\d+)/);
    if (!m) return null;
    return {
      protocol: "tuic",
      uuid: m[1],
      host: m[2],
      port: Number(m[3]),
    };
  }

  return null;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("INPUT not found");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const seen = new Set();
  const out = [];

  for (const src of raw.items || []) {
    if (!src.text) continue;

    const lines = src.text.split(/\r?\n/);
    for (const line of lines) {
      const node = parseLine(line);
      if (!node) continue;
      if (!ALLOWED_PROTOCOLS.has(node.protocol)) continue;

      const country = guessCountry(line);
      if (!country || !ALLOWED_COUNTRIES.has(country)) continue;

      if (!node.host || !node.port) continue;

      const key = `${node.protocol}:${node.host}:${node.port}:${node.uuid || node.password || ""}`;
      const id = sha1(key);
      if (seen.has(id)) continue;
      seen.add(id);

      out.push({
        id,
        protocol: node.protocol,
        host: node.host,
        port: node.port,
        country,
        source: "F0rc3Run",
      });
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2));
  console.log(`normalized: ${out.length}`);
}

main();
