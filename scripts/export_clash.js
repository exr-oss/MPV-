import fs from "fs";
import YAML from "yaml";

const nodes = JSON.parse(fs.readFileSync("work/nodes.final.json", "utf8"));

const proxies = nodes.map((n, i) => ({
  name: `NODE_${i}`,
  type: "ss",
  server: "0.0.0.0",
  port: 443,
  cipher: "aes-128-gcm",
  password: "password"
}));

const cfg = {
  port: 7890,
  "socks-port": 7891,
  mode: "rule",
  proxies,
  "proxy-groups": [
    { name: "AUTO", type: "select", proxies: proxies.map(p => p.name) }
  ],
  rules: ["MATCH,AUTO"]
};

fs.mkdirSync("export", { recursive: true });
fs.writeFileSync("export/main.yaml", YAML.stringify(cfg));
