// scripts/export_txt.js
// SOURCE: export/main.yaml
// OUTPUT: export/subscription.txt
// PURPOSE: universal subscription (.txt) for v2rayNG / NekoBox / sing-box

import fs from "fs";
import path from "path";
import YAML from "yaml";

const MAIN_YAML = path.resolve("export/main.yaml");
const OUT_TXT = path.resolve("export/subscription.txt");

if (!fs.existsSync(MAIN_YAML)) {
  throw new Error("main.yaml not found");
}

const yamlRaw = fs.readFileSync(MAIN_YAML, "utf8");
const cfg = YAML.parse(yamlRaw);

if (!cfg.proxies || !Array.isArray(cfg.proxies)) {
  throw new Error("no proxies section in main.yaml");
}

const lines = [];

for (const p of cfg.proxies) {
  switch (p.type) {
    case "vless": {
      const params = new URLSearchParams({
        encryption: "none",
        security: p.tls ? "tls" : "none",
        sni: p.sni || "",
        fp: p["client-fingerprint"] || "",
        type: p.network || "tcp",
        host: p["ws-opts"]?.headers?.Host || "",
        path: p["ws-opts"]?.path || ""
      });
      lines.push(
        `vless://${p.uuid}@${p.server}:${p.port}?${params}#${encodeURIComponent(p.name)}`
      );
      break;
    }

    case "trojan": {
      const params = new URLSearchParams({
        sni: p.sni || "",
        security: "tls"
      });
      lines.push(
        `trojan://${p.password}@${p.server}:${p.port}?${params}#${encodeURIComponent(p.name)}`
      );
      break;
    }

    case "shadowsocks": {
      const userinfo = Buffer.from(
        `${p.cipher}:${p.password}`
      ).toString("base64");
      lines.push(
        `ss://${userinfo}@${p.server}:${p.port}#${encodeURIComponent(p.name)}`
      );
      break;
    }

    case "hysteria2": {
      const params = new URLSearchParams({
        sni: p.sni || "",
        insecure: p.skipCertVerify ? "1" : "0"
      });
      lines.push(
        `hysteria2://${p.password}@${p.server}:${p.port}?${params}#${encodeURIComponent(p.name)}`
      );
      break;
    }

    case "tuic": {
      const params = new URLSearchParams({
        sni: p.sni || "",
        alpn: (p.alpn || []).join(","),
        congestion_control: p.congestion_control || "bbr",
        udp_relay_mode: p.udp_relay_mode || "native"
      });
      lines.push(
        `tuic://${p.uuid}:${p.password}@${p.server}:${p.port}?${params}#${encodeURIComponent(p.name)}`
      );
      break;
    }

    default:
      // unsupported protocol → ignore
      break;
  }
}

fs.writeFileSync(OUT_TXT, lines.join("\n"), "utf8");
console.log(`OK: ${lines.length} nodes → export/subscription.txt`);
