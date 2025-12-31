// export_clash.js
// INPUT : work/nodes.filtered.json
// OUTPUT: work/main.yaml

import fs from "fs";

const INPUT = "work/nodes.filtered.json";
const OUTPUT = "work/main.yaml";

/* ================= CONFIG ================= */

const NETFLIX_COUNTRIES = ["DE", "NL", "PL", "CZ"];
const CHATGPT_COUNTRIES = ["DE", "NL", "FI", "JP"];
const GAMES_COUNTRIES = ["PL", "CZ", "EE", "DE"];

/* ================= LOAD ================= */

if (!fs.existsSync(INPUT)) {
  console.error("❌ nodes.filtered.json not found");
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

/* ================= GROUPS ================= */

const groups = {
  AUTO: [],
  NETFLIX: [],
  CHATGPT: [],
  GAMES: [],
  INTERNET: [],
  MANUAL: [],
};

/* ================= PROXIES ================= */

const proxiesYaml = [];

for (const node of nodes) {
  if (!node || !node.name || !node.type) continue;

  proxiesYaml.push(node.yaml);

  const country = node.country || "";

  groups.AUTO.push(node.name);
  groups.INTERNET.push(node.name);
  groups.MANUAL.push(node.name);

  if (NETFLIX_COUNTRIES.includes(country)) {
    groups.NETFLIX.push(node.name);
  }

  if (CHATGPT_COUNTRIES.includes(country)) {
    groups.CHATGPT.push(node.name);
  }

  if (GAMES_COUNTRIES.includes(country)) {
    groups.GAMES.push(node.name);
  }
}

/* ================= YAML BUILD ================= */

function yamlList(arr, indent = 6) {
  return arr.map(v => " ".repeat(indent) + "- " + v).join("\n");
}

const yaml = `
mixed-port: 7890
allow-lan: true
mode: rule
log-level: info
external-controller: 127.0.0.1:9090

dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  nameserver:
    - 1.1.1.1
    - 8.8.8.8

proxies:
${proxiesYaml.join("\n")}

proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - AUTO
      - NETFLIX
      - CHATGPT
      - GAMES
      - INTERNET
      - MANUAL

  - name: AUTO
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
${yamlList(groups.AUTO)}

  - name: NETFLIX
    type: fallback
    url: https://www.netflix.com
    interval: 300
    proxies:
${yamlList(groups.NETFLIX)}

  - name: CHATGPT
    type: fallback
    url: https://chat.openai.com
    interval: 300
    proxies:
${yamlList(groups.CHATGPT)}

  - name: GAMES
    type: url-test
    url: https://www.roblox.com
    interval: 300
    tolerance: 80
    proxies:
${yamlList(groups.GAMES)}

  - name: INTERNET
    type: select
    proxies:
${yamlList(groups.INTERNET)}

  - name: MANUAL
    type: select
    proxies:
${yamlList(groups.MANUAL)}

rules:
  - DOMAIN-SUFFIX,netflix.com,NETFLIX
  - DOMAIN-SUFFIX,nflxvideo.net,NETFLIX

  - DOMAIN-SUFFIX,openai.com,CHATGPT
  - DOMAIN-SUFFIX,chat.openai.com,CHATGPT

  - DOMAIN-SUFFIX,roblox.com,GAMES

  - MATCH,PROXY
`.trim() + "\n";

/* ================= SAVE ================= */

fs.writeFileSync(OUTPUT, yaml);
console.log("✅ main.yaml generated:", OUTPUT);
