// export_clash.js
// Генерация Clash Meta main.yaml из нормализованных proxy-нод
// ВХОД: work/nodes.filtered.json
// ВЫХОД: output/main.yaml

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const INPUT = 'work/nodes.filtered.json';
const OUTPUT_DIR = 'output';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'main.yaml');

// --- guards ---
if (!fs.existsSync(INPUT)) {
  console.error('[export] input not found:', INPUT);
  process.exit(1);
}

// --- read nodes ---
const nodes = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

if (!Array.isArray(nodes) || nodes.length === 0) {
  console.error('[export] no nodes to export');
  process.exit(1);
}

// --- ensure output dir ---
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --- build clash config ---
const clashConfig = {
  port: 7890,
  'socks-port': 7891,
  'mixed-port': 7892,
  'allow-lan': true,
  mode: 'rule',
  'log-level': 'info',
  ipv6: false,

  dns: {
    enable: true,
    listen: '0.0.0.0:1053',
    enhanced-mode: 'fake-ip',
    nameserver: ['1.1.1.1', '8.8.8.8']
  },

  proxies: nodes,

  'proxy-groups': [
    {
      name: 'AUTO',
      type: 'url-test',
      url: 'http://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: nodes.map(n => n.name)
    },
    {
      name: 'SELECT',
      type: 'select',
      proxies: ['AUTO', ...nodes.map(n => n.name)]
    }
  ],

  rules: [
    'DOMAIN-SUFFIX,netflix.com,SELECT',
    'DOMAIN-SUFFIX,chatgpt.com,SELECT',
    'MATCH,DIRECT'
  ]
};

// --- write yaml ---
const yamlText = yaml.dump(clashConfig, {
  noRefs: true,
  lineWidth: -1
});

fs.writeFileSync(OUTPUT_FILE, yamlText, 'utf8');

console.log(`✅ main.yaml generated: ${OUTPUT_FILE}`);
