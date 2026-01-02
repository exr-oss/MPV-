import fs from "fs";

const nodes = JSON.parse(fs.readFileSync("work/nodes.normalized.json", "utf8"));

const ALLOWED_COUNTRIES = ["DE", "FI", "NL", "PL", "CZ", "EE", "JP"];
const ALLOWED_PROTOCOLS = ["vless", "trojan", "hysteria2", "shadowsocks", "tuic"];

const out = nodes.filter(n =>
  ALLOWED_COUNTRIES.includes(n.country) ||
  ALLOWED_PROTOCOLS.includes(n.protocol)
);

fs.writeFileSync("work/nodes.filtered.json", JSON.stringify(out, null, 2));
