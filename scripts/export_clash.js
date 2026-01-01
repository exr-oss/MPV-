import fs from "fs";
import yaml from "js-yaml";

const INPUT = "work/nodes.filtered.json";
const OUTPUT = "work/main.yaml";

if (!fs.existsSync(INPUT)) {
  console.error("[export] nodes.filtered.json not found");
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const clash = {
  port: 7890,
  "socks-port": 7891,
  "allow-lan": true,
  mode: "rule",
  "log-level": "info",

  dns: {
    enable: true,
    listen: "0.0.0.0:53",
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    nameserver: ["1.1.1.1", "8.8.8.8"],
  },

  proxies: nodes,

  "proxy-groups": [
    {
      name: "AUTO",
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: nodes.map((n) => n.name),
    },
  ],

  rules: [
    "DOMAIN-SUFFIX,openai.com,AUTO",
    "DOMAIN-SUFFIX,netflix.com,AUTO",
    "MATCH,AUTO",
  ],
};

const yamlText = yaml.dump(clash, {
  noRefs: true,
  lineWidth: -1,
});

fs.writeFileSync(OUTPUT, yamlText);
console.log("✅ main.yaml generated:", OUTPUT);
