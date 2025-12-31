import fs from "fs";

const INPUT = "work/nodes.filtered.json";
const OUTPUT = "work/main.yaml";

/* ---------- utils ---------- */

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveText(p, text) {
  fs.writeFileSync(p, text);
}

function yn(v) {
  return v ? "true" : "false";
}

/* ---------- clash proxy builders ---------- */

function buildVless(n) {
  return `
- name: "${n.name}"
  type: vless
  server: ${n.server}
  port: ${n.port}
  uuid: ${n.uuid}
  udp: true
  tls: ${yn(n.tls)}
  servername: ${n.sni || ""}
  flow: ${n.flow || ""}
  network: ${n.network || "tcp"}
  ws-opts:
    path: ${n.path || "/"}
    headers:
      Host: ${n.host || n.sni || ""}
`;
}

function buildTrojan(n) {
  return `
- name: "${n.name}"
  type: trojan
  server: ${n.server}
  port: ${n.port}
  password: ${n.password}
  udp: true
  tls: true
  sni: ${n.sni || ""}
`;
}

function buildHysteria2(n) {
  return `
- name: "${n.name}"
  type: hysteria2
  server: ${n.server}
  port: ${n.port}
  password: ${n.password}
  up: ${n.up || 50}
  down: ${n.down || 200}
  sni: ${n.sni || ""}
`;
}

function buildShadowsocks(n) {
  return `
- name: "${n.name}"
  type: ss
  server: ${n.server}
  port: ${n.port}
  cipher: ${n.cipher}
  password: ${n.password}
  udp: true
`;
}

function buildTuic(n) {
  return `
- name: "${n.name}"
  type: tuic
  server: ${n.server}
  port: ${n.port}
  uuid: ${n.uuid}
  password: ${n.password}
  congestion-controller: bbr
  udp-relay-mode: native
  sni: ${n.sni || ""}
`;
}

/* ---------- dispatcher ---------- */

function buildProxy(n) {
  const p = (n.type || n.protocol || "").toLowerCase();

  if (p === "vless") return buildVless(n);
  if (p === "trojan") return buildTrojan(n);
  if (p === "hysteria2" || p === "hy2") return buildHysteria2(n);
  if (p === "ss") return buildShadowsocks(n);
  if (p === "tuic") return buildTuic(n);

  return null;
}

/* ---------- run ---------- */

const nodes = loadJSON(INPUT);

const proxies = [];
const proxyNames = [];

for (const n of nodes) {
  if (!n.name) {
    n.name = `${n.type}-${n.server}:${n.port}`;
  }

  const block = buildProxy(n);
  if (!block) continue;

  proxies.push(block);
  proxyNames.push(`    - "${n.name}"`);
}

/* ---------- final YAML ---------- */

const yaml = `
mixed-port: 7890
allow-lan: true
mode: rule
log-level: info
external-controller: 127.0.0.1:9090

dns:
  enable: true
  listen: 0.0.0.0:1053
  enhanced-mode: fake-ip
  nameserver:
    - 1.1.1.1
    - 8.8.8.8

proxies:
${proxies.join("")}

proxy-groups:
  - name: AUTO
    type: select
    proxies:
${proxyNames.join("\n")}

rules:
  - MATCH,AUTO
`.trim() + "\n";

saveText(OUTPUT, yaml);

console.log(`✅ Clash Meta config written: ${OUTPUT}`);
console.log(`✅ Proxies exported: ${proxyNames.length}`);
