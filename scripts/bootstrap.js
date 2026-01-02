// scripts/bootstrap.js
import fs from "fs";

fs.mkdirSync("work", { recursive: true });

const state = {
  source: "worker",
  endpoint: "/export/json",
  created_at: new Date().toISOString()
};

fs.writeFileSync("work/bootstrap.json", JSON.stringify(state, null, 2));
