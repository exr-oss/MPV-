import fs from "fs";

const nodes = JSON.parse(fs.readFileSync("work/nodes.filtered.json", "utf8"));

for (const n of nodes) {
  n.score = 100;
}

fs.writeFileSync("work/nodes.scored.json", JSON.stringify(nodes, null, 2));
