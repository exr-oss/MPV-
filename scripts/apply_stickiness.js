import fs from "fs";

const nodes = JSON.parse(fs.readFileSync("work/nodes.scored.json", "utf8"));

for (const n of nodes) {
  n.sticky = true;
}

fs.writeFileSync("work/nodes.final.json", JSON.stringify(nodes, null, 2));
