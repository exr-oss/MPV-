import fs from "fs";
import path from "path";

const INPUT = "work/nodes.filtered.json";
const OUTPUT = "export/subscription.txt";

if (!fs.existsSync(INPUT)) {
  console.error("[export_txt] missing input:", INPUT);
  process.exit(1);
}

const nodes = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const lines = [];

for (const n of nodes) {
  if (!n || !n.url) continue;

  // разрешённые протоколы
  if (
    n.url.startsWith("vless://") ||
    n.url.startsWith("trojan://") ||
    n.url.startsWith("ss://") ||
    n.url.startsWith("hy2://") ||
    n.url.startsWith("tuic://")
  ) {
    lines.push(n.url.trim());
  }
}

if (lines.length === 0) {
  console.error("[export_txt] no valid nodes");
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, lines.join("\n") + "\n");

console.log(`[export_txt] OK: ${lines.length} nodes → ${OUTPUT}`);
