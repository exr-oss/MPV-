// scripts/export_clash.js
import fs from "fs";
import YAML from "yaml";

const data = JSON.parse(fs.readFileSync("work/sticky.json"));

const config = {
  proxies: data.map(i => ({
    name: i.id,
    type: "http",
    server: i.url,
    port: 443
  }))
};

fs.mkdirSync("export", { recursive: true });
fs.writeFileSync("export/main.yaml", YAML.stringify(config));
